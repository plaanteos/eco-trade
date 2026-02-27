const { isConnected } = require('../config/database-config');
const { getPrisma } = require('../config/prismaClient');
const crypto = require('crypto');

function randomId24() {
  return crypto.randomBytes(12).toString('hex');
}

// Datos de demostración para cuando no hay base de datos
const demoProducts = [
  {
    _id: randomId24(),
    name: "iPhone 12 Pro",
    description: "iPhone 12 Pro en excelente estado, usado por 1 año. Incluye cargador y auriculares.",
    price: 45000,
    category: "Electrónicos",
    condition: "Muy bueno",
    locationText: "CDMX, México",
    owner: "demo_user",
    sellerId: randomId24(),
    status: "available",
    createdAt: new Date()
  },
  {
    _id: randomId24(),
    name: "Laptop Dell Inspiron",
    description: "Laptop Dell en buen estado, ideal para trabajo y estudio. 8GB RAM, SSD 256GB.",
    price: 32000,
    category: "Electrónicos",
    condition: "Bueno",
    locationText: "Guadalajara, México",
    owner: "demo_user",
    sellerId: randomId24(),
    status: "available",
    createdAt: new Date()
  },
  {
    _id: randomId24(),
    name: "Bicicleta de montaña",
    description: "Bicicleta Trek en excelente estado, perfecta para aventuras al aire libre.",
    price: 15000,
    category: "Deportes",
    condition: "Excelente",
    locationText: "Monterrey, México",
    owner: "demo_user",
    sellerId: randomId24(),
    status: "available",
    createdAt: new Date()
  },
  {
    _id: randomId24(),
    name: "Sofá 3 plazas",
    description: "Sofá cómodo y en buen estado, color gris. Ideal para sala de estar.",
    price: 8500,
    category: "Hogar",
    condition: "Bueno",
    locationText: "Puebla, México",
    owner: "demo_user",
    sellerId: randomId24(),
    status: "available",
    createdAt: new Date()
  },
  {
    _id: randomId24(),
    name: "Libros de programación",
    description: "Colección de 5 libros sobre desarrollo web y JavaScript. Excelente para estudiantes.",
    price: 1200,
    category: "Libros",
    condition: "Muy bueno",
    locationText: "CDMX, México",
    owner: "demo_user",
    sellerId: randomId24(),
    status: "available",
    createdAt: new Date()
  }
];

// Variable global para productos temporales (simulando base de datos)
let tempProducts = [...demoProducts];

// Función para verificar si MongoDB está disponible
const isMongoAvailable = () => {
  return isConnected();
};

// Controlador base para productos
exports.getAllProducts = async (req, res) => {
  try {
    if (isMongoAvailable()) {
      const prisma = getPrisma();
      const products = await prisma.product.findMany({
        orderBy: { createdAt: 'desc' },
      });

      // Compatibilidad: el endpoint histórico devolvía array plano
      res.json(products.map((p) => ({ ...p, _id: p.id })));
    } else {
      // Usar datos de demostración
      res.json(tempProducts);
    }
  } catch (err) {
    console.log('Usando datos de demostración:', err.message);
    res.json(tempProducts);
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
      images: [],
      tags: [],
    };

    let product;
    
    if (isMongoAvailable()) {
      const prisma = getPrisma();
      product = await prisma.product.create({ data: productData });
      product = { ...product, _id: product.id };
    } else {
      // Usar datos temporales
      product = { _id: randomId24(), ...productData, createdAt: new Date() };
      tempProducts.unshift(product); // Agregar al inicio del array
    }

    // Calcular EcoCoins ganados (1 EcoCoin por cada 10 unidades de precio)
    const ecoCoinsEarned = Math.floor(price / 10);

    res.status(201).json({
      success: true,
      message: `¡Producto creado exitosamente! Ganaste ${ecoCoinsEarned} EcoCoins.`,
      data: {
        product: product,
        ecoCoinsEarned: ecoCoinsEarned
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
    
    if (isMongoAvailable()) {
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
      products = products.map((p) => ({ ...p, _id: p.id }));
    } else {
      // Usar datos temporales con filtros
      products = tempProducts.filter(product => {
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
    // Fallback a datos de demo en caso de error
    res.json({
      success: true,
      data: {
        products: demoProducts,
        total: demoProducts.length
      }
    });
  }
};

// Obtener producto por ID
exports.getProductById = async (req, res) => {
  try {
    if (!isMongoAvailable()) {
      const p = tempProducts.find((x) => String(x._id) === String(req.params.id));
      if (!p) {
        return res.status(404).json({ success: false, message: 'Producto no encontrado' });
      }
      return res.json({ success: true, data: { product: p } });
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
      data: { product }
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
    
    if (!isMongoAvailable()) {
      const idx = tempProducts.findIndex((x) => String(x._id) === String(req.params.id));
      if (idx === -1) {
        return res.status(404).json({ success: false, message: 'Producto no encontrado' });
      }
      tempProducts[idx] = { ...tempProducts[idx], ...updateData };
      return res.json({ success: true, data: { product: tempProducts[idx] } });
    }

    const prisma = getPrisma();
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
    if (!isMongoAvailable()) {
      const before = tempProducts.length;
      tempProducts = tempProducts.filter((x) => String(x._id) !== String(req.params.id));
      if (tempProducts.length === before) {
        return res.status(404).json({ success: false, message: 'Producto no encontrado' });
      }
      return res.json({ success: true, message: 'Producto eliminado exitosamente' });
    }

    const prisma = getPrisma();
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
    if (isMongoAvailable()) {
      const prisma = getPrisma();
      products = await prisma.product.findMany({
        where: { sellerId: String(req.userId) },
        orderBy: { createdAt: 'desc' },
      });
      products = products.map((p) => ({ ...p, _id: p.id }));
    } else {
      products = tempProducts
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
    if (isMongoAvailable()) {
      const prisma = getPrisma();
      product = await prisma.product.findUnique({ where: { id: String(req.params.id) } });
      if (product) product = { ...product, _id: product.id };
    } else {
      product = tempProducts.find((x) => String(x._id) === String(req.params.id));
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
      data: { product }
    });
  } catch (error) {
    console.error('Error en showInterest:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};
