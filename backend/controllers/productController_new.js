const Product = require('../models/Product');
const User = require('../models/User');
const { productValidationSchemas } = require('../utils/validationSchemas');

/**
 * Crear nuevo producto
 */
exports.createProduct = async (req, res) => {
  try {
    const { error, value } = productValidationSchemas.create.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.details.map(detail => detail.message)
      });
    }

    const productData = {
      ...value,
      owner: req.userId,
      ecologicalImpact: calculateEcologicalImpact(value)
    };

    const product = new Product(productData);
    await product.save();

    // Poblar datos del propietario para la respuesta
    await product.populate('owner', 'username rating sustainabilityScore');

    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      data: { product }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al crear producto',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Búsqueda avanzada de productos con filtros
 */
exports.searchProducts = async (req, res) => {
  try {
    const {
      search,
      category,
      condition,
      minPrice,
      maxPrice,
      location,
      radius = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
      minSustainabilityScore = 0
    } = req.query;

    // Construir query
    let query = { status: 'available' };

    // Búsqueda por texto
    if (search) {
      query.$text = { $search: search };
    }

    // Filtros básicos
    if (category) query.category = category;
    if (condition) query.condition = condition;

    // Rango de precio
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Filtro de sostenibilidad del propietario
    if (minSustainabilityScore > 0) {
      const sustainableUsers = await User.find({
        sustainabilityScore: { $gte: minSustainabilityScore }
      }).select('_id');
      query.owner = { $in: sustainableUsers.map(u => u._id) };
    }

    // Configurar paginación
    const skip = (page - 1) * limit;

    // Configurar ordenamiento
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Pipeline de agregación para incluir distancia si hay ubicación
    let pipeline = [
      { $match: query },
      {
        $lookup: {
          from: 'users',
          localField: 'owner',
          foreignField: '_id',
          as: 'ownerInfo'
        }
      },
      { $unwind: '$ownerInfo' },
      {
        $addFields: {
          'owner.username': '$ownerInfo.username',
          'owner.rating': '$ownerInfo.rating',
          'owner.sustainabilityScore': '$ownerInfo.sustainabilityScore',
          'owner.location': '$ownerInfo.location'
        }
      },
      { $project: { ownerInfo: 0 } }
    ];

    // Agregar filtro de distancia si se proporciona ubicación
    if (location && location.coordinates) {
      pipeline.unshift({
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [parseFloat(location.coordinates[0]), parseFloat(location.coordinates[1])]
          },
          distanceField: 'distance',
          maxDistance: radius * 1000, // convertir km a metros
          spherical: true
        }
      });
    }

    // Agregar ordenamiento y paginación
    pipeline.push(
      { $sort: sortOptions },
      { $skip: skip },
      { $limit: parseInt(limit) }
    );

    const products = await Product.aggregate(pipeline);

    // Contar total para paginación
    const countPipeline = pipeline.slice(0, -2); // Remover skip y limit
    const totalProducts = await Product.aggregate([
      ...countPipeline,
      { $count: "total" }
    ]);

    const total = totalProducts[0]?.total || 0;

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        },
        filters: {
          search,
          category,
          condition,
          priceRange: { min: minPrice, max: maxPrice },
          sustainabilityFilter: minSustainabilityScore
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error en búsqueda de productos',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Obtener producto por ID con detalles completos
 */
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('owner', 'username rating sustainabilityScore location verification')
      .populate('interestedBuyers.user', 'username rating');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // Incrementar vistas si no es el propietario
    if (req.userId && product.owner._id.toString() !== req.userId.toString()) {
      product.views += 1;
      await product.save();
    }

    res.json({
      success: true,
      data: { product }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener producto',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Actualizar producto (solo propietario)
 */
exports.updateProduct = async (req, res) => {
  try {
    const { error, value } = productValidationSchemas.update.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.details.map(detail => detail.message)
      });
    }

    // Recalcular impacto ecológico si es necesario
    if (value.category || value.condition || value.price) {
      value.ecologicalImpact = calculateEcologicalImpact(value);
    }

    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, owner: req.userId },
      value,
      { new: true, runValidators: true }
    ).populate('owner', 'username rating sustainabilityScore');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado o sin permisos'
      });
    }

    res.json({
      success: true,
      message: 'Producto actualizado exitosamente',
      data: { product }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al actualizar producto',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Eliminar producto (solo propietario)
 */
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({
      _id: req.params.id,
      owner: req.userId
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado o sin permisos'
      });
    }

    res.json({
      success: true,
      message: 'Producto eliminado exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar producto',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Listar productos del usuario actual
 */
exports.getMyProducts = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    let query = { owner: req.userId };
    if (status) query.status = status;

    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('interestedBuyers.user', 'username rating');

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener productos',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Marcar interés en un producto
 */
exports.showInterest = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    if (product.owner.toString() === req.userId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'No puedes mostrar interés en tu propio producto'
      });
    }

    const hasInterest = product.interestedBuyers.some(
      buyer => buyer.user.toString() === req.userId.toString()
    );

    if (hasInterest) {
      return res.status(400).json({
        success: false,
        message: 'Ya has mostrado interés en este producto'
      });
    }

    product.interestedBuyers.push({
      user: req.userId,
      message: req.body.message || '',
      timestamp: new Date()
    });

    await product.save();

    res.json({
      success: true,
      message: 'Interés registrado exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al registrar interés',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Función auxiliar para calcular impacto ecológico
 */
function calculateEcologicalImpact(productData) {
  const { category, condition, price } = productData;

  // Factores base por categoría (CO2 ahorrado en kg)
  const categoryImpact = {
    'Electrónica': 50,
    'Vehículos': 200,
    'Muebles': 30,
    'Ropa': 10,
    'Herramientas': 15,
    'Libros': 2,
    'Deportes': 8,
    'Hogar': 12,
    'Otros': 5
  };

  // Multiplicadores por condición
  const conditionMultiplier = {
    'Nuevo': 0.5,
    'Como nuevo': 0.8,
    'Bueno': 1.0,
    'Aceptable': 1.2,
    'Reparar': 1.5
  };

  const baseCO2 = categoryImpact[category] || 5;
  const conditionFactor = conditionMultiplier[condition] || 1.0;
  const priceFactor = Math.log(price / 100 + 1); // Factor logarítmico por precio

  return {
    co2SavedKg: Math.round(baseCO2 * conditionFactor * priceFactor),
    waterSavedL: Math.round(baseCO2 * conditionFactor * priceFactor * 20),
    wasteAvoidedKg: Math.round(baseCO2 * conditionFactor * 0.8),
    treesEquivalent: Math.round(baseCO2 * conditionFactor * priceFactor / 25)
  };
}