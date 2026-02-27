/**
 * Controlador de productos simplificado para demo
 */

let products = [
  {
    id: '1',
    title: 'iPhone 12 Pro',
    description: 'iPhone en excelente estado, usado por 1 año',
    price: 800,
    category: 'Electrónicos',
    condition: 'Usado - Excelente',
    location: 'Madrid, España',
    seller: 'demo_user',
    ecoCoinsReward: 15,
    createdAt: new Date()
  },
  {
    id: '2',
    title: 'Bicicleta de montaña',
    description: 'Bicicleta Trek en buen estado, ideal para aventuras',
    price: 300,
    category: 'Deportes y Recreación',
    condition: 'Usado - Bueno',
    location: 'Barcelona, España',
    seller: 'eco_rider',
    ecoCoinsReward: 8,
    createdAt: new Date()
  }
];

/**
 * Obtener todos los productos
 */
exports.getAllProducts = async (req, res) => {
  try {
    // Simular filtros opcionales
    let filteredProducts = [...products];
    
    const { category, condition, minPrice, maxPrice, search } = req.query;
    
    if (category) {
      filteredProducts = filteredProducts.filter(p => p.category === category);
    }
    
    if (condition) {
      filteredProducts = filteredProducts.filter(p => p.condition === condition);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredProducts = filteredProducts.filter(p => 
        p.title.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower)
      );
    }
    
    if (minPrice) {
      filteredProducts = filteredProducts.filter(p => p.price >= parseFloat(minPrice));
    }
    
    if (maxPrice) {
      filteredProducts = filteredProducts.filter(p => p.price <= parseFloat(maxPrice));
    }

    return res.json({
      success: true,
      data: {
        products: filteredProducts,
        total: filteredProducts.length
      }
    });
  } catch (error) {
    console.error('Error en getAllProducts:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Crear nuevo producto
 */
exports.createProduct = async (req, res) => {
  try {
    console.log('Datos recibidos para crear producto:', req.body);
    
    const { title, description, price, category, condition, location } = req.body;
    
    if (!title || !description || !price || !category || !condition) {
      return res.status(400).json({
        success: false,
        message: 'Faltan datos obligatorios'
      });
    }

    // Calcular EcoCoins por vender
    const categoryMultiplier = {
      'Electrónicos': 2.0,
      'Ropa y Accesorios': 1.5,
      'Hogar y Jardín': 1.3,
      'Libros y Medios': 1.2,
      'Deportes y Recreación': 1.4,
      'Automóvil': 2.5,
      'Arte y Artesanías': 1.6,
      'Otros': 1.0
    };

    const conditionMultiplier = {
      'Nuevo': 1.0,
      'Como nuevo': 1.1,
      'Usado - Excelente': 1.3,
      'Usado - Bueno': 1.5,
      'Usado - Regular': 1.8,
      'Para reparar': 2.0
    };

    const baseEcoCoins = Math.floor(price * 0.01); // 1% del precio
    const categoryBonus = categoryMultiplier[category] || 1.0;
    const conditionBonus = conditionMultiplier[condition] || 1.0;
    const ecoCoinsReward = Math.floor(baseEcoCoins * categoryBonus * conditionBonus);

    const newProduct = {
      id: Date.now().toString(),
      title,
      description,
      price: parseFloat(price),
      category,
      condition,
      location: location || '',
      seller: req.user?.username || 'demo_user',
      ecoCoinsReward,
      createdAt: new Date()
    };

    products.unshift(newProduct); // Agregar al inicio

    return res.status(201).json({
      success: true,
      message: `¡Producto creado! Ganaste ${ecoCoinsReward} EcoCoins`,
      data: {
        product: newProduct,
        ecoCoinsEarned: ecoCoinsReward
      }
    });

  } catch (error) {
    console.error('Error en createProduct:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Obtener producto por ID
 */
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = products.find(p => p.id === id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    return res.json({
      success: true,
      data: { product }
    });
  } catch (error) {
    console.error('Error en getProductById:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Actualizar producto
 */
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const productIndex = products.findIndex(p => p.id === id);
    
    if (productIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    const updatedProduct = {
      ...products[productIndex],
      ...req.body,
      updatedAt: new Date()
    };

    products[productIndex] = updatedProduct;

    return res.json({
      success: true,
      message: 'Producto actualizado correctamente',
      data: { product: updatedProduct }
    });
  } catch (error) {
    console.error('Error en updateProduct:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Eliminar producto
 */
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const productIndex = products.findIndex(p => p.id === id);
    
    if (productIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    products.splice(productIndex, 1);

    return res.json({
      success: true,
      message: 'Producto eliminado correctamente'
    });
  } catch (error) {
    console.error('Error en deleteProduct:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};