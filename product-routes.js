const express = require('express');
const router = express.Router();
const Product = require('./models/product'); // Asumiendo que tenemos el modelo de producto

// Crear un nuevo producto
router.post('/products', async (req, res) => {
  try {
    // Calcular impacto ecológico (lógica simplificada)
    const calculateEcologicalImpact = (product) => {
      const factors = {
        'Electrónica': 50,
        'Muebles': 30,
        'Ropa': 20,
        'Herramientas': 40
      };
      
      const baseFactor = factors[product.category] || 25;
      const conditionMultiplier = {
        'Nuevo': 1,
        'Como nuevo': 0.8,
        'Bueno': 0.6,
        'Aceptable': 0.4
      };
      
      return Math.round(baseFactor * conditionMultiplier[product.condition]);
    };

    const newProduct = new Product({
      ...req.body,
      ecological_impact: calculateEcologicalImpact(req.body),
      ecocoins_generated: Math.round(req.body.price * 0.1) // 10% del precio en EcoCoins
    });

    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Obtener todos los productos
router.get('/products', async (req, res) => {
  try {
    const { category, minPrice, maxPrice, condition } = req.query;
    
    // Construir filtro dinámico
    let filter = {};
    if (category) filter.category = category;
    if (minPrice) filter.price = { $gte: parseFloat(minPrice) };
    if (maxPrice) filter.price = { 
      ...filter.price, 
      $lte: parseFloat(maxPrice) 
    };
    if (condition) filter.condition = condition;

    const products = await Product.find(filter)
      .sort({ ecological_impact: -1 }) // Ordenar por impacto ecológico
      .limit(50); // Limitar a 50 productos

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Obtener producto por ID
router.get('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Actualizar producto
router.put('/products/:id', async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    res.json(updatedProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Eliminar producto
router.delete('/products/:id', async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);

    if (!deletedProduct) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    res.json({ message: 'Producto eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
