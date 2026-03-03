const { isConnected } = require('../config/database-config');
const { getPrisma } = require('../config/prismaClient');
const demoProductsStore = require('../utils/demoProductsStore');
const { normalizeRoles } = require('../utils/rbac');

const isDemoMode = String(process.env.DEMO_MODE || '').toLowerCase() === 'true';

function sanitizeProductForPublic(product) {
  if (!product || typeof product !== 'object') return product;

  // Clonar superficialmente y remover campos potencialmente sensibles.
  const out = { ...product };

  // Evitar IDs/atributos internos del store demo.
  delete out.owner;

  // Si por error se incluye un usuario poblado, no exponer PII.
  if (out.seller && typeof out.seller === 'object') {
    out.seller = { id: out.seller.id || out.seller._id, username: out.seller.username };
  }
  if (out.user && typeof out.user === 'object') {
    out.user = { id: out.user.id || out.user._id, username: out.user.username };
  }

  // Blindaje extra: eliminar claves típicas de PII/credenciales si aparecieran por cambios futuros.
  for (const key of Object.keys(out)) {
    const k = String(key).toLowerCase();
    if (
      k.includes('password') ||
      k === 'email' ||
      k.includes('recyclingcode') ||
      k === 'roles' ||
      k === 'ecocoins'
    ) {
      delete out[key];
    }
  }

  return out;
}

function isOwnerOrAdmin(req, sellerId) {
  const roles = normalizeRoles(req.user);
  const isAdmin = roles.includes('admin');
  if (isAdmin) return true;
  return String(sellerId) === String(req.userId || req.user?.id);
}

// Función para verificar si MongoDB está disponible
const isMongoAvailable = () => {
  return isConnected();
};

function requireDbOrDemo(res) {
  if (isMongoAvailable()) return { mode: 'db' };
  if (isDemoMode) return { mode: 'demo' };
  res.status(503).json({
    success: false,
    message: 'Base de datos no disponible'
  });
  return null;
}

function isMissingTableError(err) {
  if (err?.code === 'P2021') return true;
  const msg = String(err?.message || '').toLowerCase();
  return msg.includes('does not exist') || (msg.includes('relation') && msg.includes('does not exist'));
}

async function safeGetPrimaryCompanyId(prisma, userId) {
  try {
    if (!userId) return null;
    const membership = await prisma.companyMember.findFirst({
      where: { userId: String(userId), status: 'active' },
      select: { companyId: true },
      orderBy: { createdAt: 'asc' },
    });
    return membership?.companyId ? String(membership.companyId) : null;
  } catch (err) {
    if (isMissingTableError(err)) return null;
    throw err;
  }
}

// Controlador base para productos
exports.getAllProducts = async (req, res) => {
  try {
    const { page, limit } = req.query || {};
    const hasPaginationParams = page !== undefined || limit !== undefined;
    const take = hasPaginationParams ? Math.min(100, Math.max(1, Number(limit) || 20)) : null;
    const p = Math.max(1, Number(page) || 1);
    const skip = take ? (p - 1) * take : 0;

    const env = requireDbOrDemo(res);
    if (!env) return;

    if (env.mode === 'db') {
      const prisma = getPrisma();
      const products = await prisma.product.findMany({
        orderBy: { createdAt: 'desc' },
        ...(take ? { skip, take } : {}),
      });

      // Compatibilidad: el endpoint histórico devolvía array plano
      return res.json(products.map((p) => sanitizeProductForPublic({ ...p, _id: p.id })));
    }

    // Usar datos de demostración (solo DEMO_MODE)
    const list = demoProductsStore.list();
    const paged = take ? list.slice(skip, skip + take) : list;
    return res.json(paged.map((p) => sanitizeProductForPublic(p)));
  } catch (err) {
    console.error('Error en getAllProducts:', err);
    if (isDemoMode) {
      return res.json(demoProductsStore.list().map((p) => sanitizeProductForPublic(p)));
    }
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { title, description, price, category, condition, location } = req.body;
    
    // Validar campos requeridos
    if (!title || !description || !price || !category || !condition) {
      return res.status(400).json({ 
        success: false,
        message: 'Faltan campos requeridos: title, description, price, category, condition' 
      });
    }

    // Validar precio
    if (price <= 0) {
      return res.status(400).json({ 
        success: false,
        message: 'El precio debe ser mayor a 0' 
      });
    }

    // Crear el producto con los datos correctos
    const productData = {
      name: title,
      description,
      price: parseFloat(price),
      category,
      condition,
      locationText: location || 'No especificada',
      status: 'available',
      sellerId: req.user?.id || null,
      // Multi-tenant: si el usuario pertenece a una Company, asociar el producto.
      // No rompe el flujo actual si Company aún no está desplegado.
      companyId: null,
      images: [],
      tags: [],
    };

    let product;

    const env = requireDbOrDemo(res);
    if (!env) return;

    if (env.mode === 'db') {
      const prisma = getPrisma();

      try {
        productData.companyId = await safeGetPrimaryCompanyId(prisma, req.user?.id);
      } catch (e) {
        console.warn('No se pudo resolver companyId (continuando):', e?.code || e?.message);
      }

      product = await prisma.product.create({ data: productData });
      product = { ...product, _id: product.id };
    } else {
      // Usar datos temporales (solo DEMO_MODE)
      product = demoProductsStore.create(productData);
    }

    res.status(201).json({
      success: true,
      message: '¡Producto creado exitosamente!',
      data: {
        product: product,
        // Compatibilidad: el frontend leía este campo, pero publicar no acredita ecoCoins.
        ecoCoinsEarned: 0
      }
    });
  } catch (err) {
    console.error('Error al crear producto:', err);
    res.status(400).json({ 
      success: false,
      message: 'Error al crear producto: ' + err.message,
    });
  }
};

// Buscar productos
exports.searchProducts = async (req, res) => {
  try {
    const { search, category, condition, minPrice, maxPrice } = req.query;
    
    let products;
    
    const env = requireDbOrDemo(res);
    if (!env) return;

    if (env.mode === 'db') {
      const prisma = getPrisma();
      const where = {};

      if (search) {
        where.OR = [
          { name: { contains: String(search), mode: 'insensitive' } },
          { description: { contains: String(search), mode: 'insensitive' } },
        ];
      }

      if (category) where.category = String(category);
      if (condition) where.condition = String(condition);

      if (minPrice || maxPrice) {
        where.price = {};
        if (minPrice) where.price.gte = parseFloat(minPrice);
        if (maxPrice) where.price.lte = parseFloat(maxPrice);
      }

      products = await prisma.product.findMany({ where, orderBy: { createdAt: 'desc' } });
      products = products.map((p) => sanitizeProductForPublic({ ...p, _id: p.id }));
    } else {
      // Usar datos de demostración con filtros (solo DEMO_MODE)
      products = demoProductsStore.list().filter(product => {
        let matches = true;
        
        if (search) {
          const searchLower = search.toLowerCase();
          matches = matches && (
            product.name.toLowerCase().includes(searchLower) ||
            product.description.toLowerCase().includes(searchLower)
          );
        }
        
        if (category) {
          matches = matches && product.category === category;
        }
        
        if (condition) {
          matches = matches && product.condition === condition;
        }
        
        if (minPrice) {
          matches = matches && product.price >= parseFloat(minPrice);
        }
        
        if (maxPrice) {
          matches = matches && product.price <= parseFloat(maxPrice);
        }
        
        return matches;
      });
      
      // Ordenar por fecha de creación (más recientes primero)
      products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      products = products.map((p) => sanitizeProductForPublic(p));
    }
    
    res.json({
      success: true,
      data: {
        products: products,
        total: products.length
      }
    });
  } catch (error) {
    console.error('Error en searchProducts:', error);
    if (isDemoMode) {
      const demoProducts = demoProductsStore.list();
      return res.json({
        success: true,
        data: {
          products: demoProducts.map((p) => sanitizeProductForPublic(p)),
          total: demoProducts.length
        }
      });
    }
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

// Obtener producto por ID
exports.getProductById = async (req, res) => {
  try {
    const env = requireDbOrDemo(res);
    if (!env) return;

    if (env.mode !== 'db') {
      const p = demoProductsStore.getById(req.params.id);
      if (!p) {
        return res.status(404).json({ success: false, message: 'Producto no encontrado' });
      }
      return res.json({ success: true, data: { product: sanitizeProductForPublic(p) } });
    }

    const prisma = getPrisma();
    const product = await prisma.product.findUnique({ where: { id: String(req.params.id) } });
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: { product: sanitizeProductForPublic(product) }
    });
  } catch (error) {
    console.error('Error en getProductById:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Actualizar producto
exports.updateProduct = async (req, res) => {
  try {
    const { title, description, price, category, condition, location } = req.body;
    
    const updateData = {};
    if (title) updateData.name = title;
    if (description) updateData.description = description;
    if (price) updateData.price = parseFloat(price);
    if (category) updateData.category = category;
    if (condition) updateData.condition = condition;
    if (location) updateData.locationText = location;
    
    const env = requireDbOrDemo(res);
    if (!env) return;

    if (env.mode !== 'db') {
      const existing = demoProductsStore.getById(req.params.id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Producto no encontrado' });
      }
      if (!isOwnerOrAdmin(req, existing.sellerId)) {
        return res.status(403).json({ success: false, message: 'No autorizado para editar este producto' });
      }
      const updated = demoProductsStore.update(req.params.id, updateData);
      return res.json({ success: true, data: { product: updated } });
    }

    const prisma = getPrisma();
    const existing = await prisma.product.findUnique({
      where: { id: String(req.params.id) },
      select: { id: true, sellerId: true },
    });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }
    if (!isOwnerOrAdmin(req, existing.sellerId)) {
      return res.status(403).json({ success: false, message: 'No autorizado para editar este producto' });
    }

    const product = await prisma.product.update({
      where: { id: String(req.params.id) },
      data: updateData,
    });
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: { product }
    });
  } catch (error) {
    console.error('Error en updateProduct:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Eliminar producto
exports.deleteProduct = async (req, res) => {
  try {
    const env = requireDbOrDemo(res);
    if (!env) return;

    if (env.mode !== 'db') {
      const existing = demoProductsStore.getById(req.params.id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Producto no encontrado' });
      }
      if (!isOwnerOrAdmin(req, existing.sellerId)) {
        return res.status(403).json({ success: false, message: 'No autorizado para eliminar este producto' });
      }
      const removed = demoProductsStore.remove(req.params.id);
      if (!removed) {
        return res.status(404).json({ success: false, message: 'Producto no encontrado' });
      }
      return res.json({ success: true, message: 'Producto eliminado exitosamente' });
    }

    const prisma = getPrisma();
    const existing = await prisma.product.findUnique({
      where: { id: String(req.params.id) },
      select: { id: true, sellerId: true },
    });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }
    if (!isOwnerOrAdmin(req, existing.sellerId)) {
      return res.status(403).json({ success: false, message: 'No autorizado para eliminar este producto' });
    }

    const product = await prisma.product.delete({ where: { id: String(req.params.id) } });
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }
    
    res.json({
      success: true,
      message: 'Producto eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error en deleteProduct:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener productos del usuario
exports.getMyProducts = async (req, res) => {
  try {
    const userId = req.user?.id || 'demo_user';

    let products;
    const env = requireDbOrDemo(res);
    if (!env) return;

    if (env.mode === 'db') {
      const prisma = getPrisma();
      products = await prisma.product.findMany({
        where: { sellerId: String(req.userId) },
        orderBy: { createdAt: 'desc' },
      });
      products = products.map((p) => ({ ...p, _id: p.id }));
    } else {
      products = demoProductsStore.list()
        .filter((p) => (p.sellerId ? String(p.sellerId) === String(userId) : p.owner === userId))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    
    res.json({
      success: true,
      data: {
        products: products,
        total: products.length
      }
    });
  } catch (error) {
    console.error('Error en getMyProducts:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Mostrar interés en producto
exports.showInterest = async (req, res) => {
  try {
    let product;
    const env = requireDbOrDemo(res);
    if (!env) return;

    if (env.mode === 'db') {
      const prisma = getPrisma();
      product = await prisma.product.findUnique({ where: { id: String(req.params.id) } });
      if (product) product = { ...product, _id: product.id };
    } else {
      product = demoProductsStore.getById(req.params.id);
    }
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }
    
    res.json({
      success: true,
      message: 'Interés registrado exitosamente',
      data: { product: sanitizeProductForPublic(product) }
    });
  } catch (error) {
    console.error('Error en showInterest:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};
