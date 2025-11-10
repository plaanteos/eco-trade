// backend/controllers/productController.js
const Product = require('../models/Product');
const User = require('../models/User');

class ProductController {
  // Crear nuevo producto
  async createProduct(req, res) {
    try {
      const productData = {
        ...req.body,
        seller: req.user.id,
        originalPrice: req.body.price
      };

      const newProduct = new Product(productData);
      
      // Calcular impacto ecológico
      newProduct.calculateEcologicalImpact();

      await newProduct.save();

      // Actualizar productos vendidos del usuario
      await User.findByIdAndUpdate(req.user.id, {
        $push: { productsSold: newProduct._id }
      });

      res.status(201).json({
        message: 'Producto creado exitosamente',
        product: newProduct
      });
    } catch (error) {
      res.status(400).json({ 
        message: 'Error al crear producto', 
        error: error.message 
      });
    }
  }

  // Buscar productos con filtros avanzados
  async searchProducts(req, res) {
    try {
      const { 
        category, 
        minPrice, 
        maxPrice, 
        condition, 
        maxEcologicalImpact,
        location,
        radius 
      } = req.query;

      let query = {};

      // Filtros dinámicos
      if (category) query.category = category;
      if (condition) query.condition = condition;
      if (minPrice) query.price = { $gte: parseFloat(minPrice) };
      if (maxPrice) query.price = { 
        ...query.price, 
        $lte: parseFloat(maxPrice) 
      };
      if (maxEcologicalImpact) {
        query.ecologicalImpact = { $lte: parseFloat(maxEcologicalImpact) };
      }

      // Filtro de geolocalización
      if (location && radius) {
        const [lon, lat] = location.split(',').map(parseFloat);
        query.location = {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [lon, lat]
            },
            $maxDistance: radius * 1000 // Convertir km a metros
          }
        };
      }

      const products = await Product.find(query)
        .populate('seller', 'username sustainabilityScore')
        .sort({ ecologicalImpact: -1 })
        .limit(50);

      res.json({
        total: products.length,
        products
      });
    } catch (error) {
      res.status(500).json({ 
        message: 'Error en la búsqueda', 
        error: error.message 
      });
    }
  }

  // Detalles de un producto
  async getProductDetails(req, res) {
    try {
      const product = await Product.findById(req.params.id)
        .populate('seller', 'username sustainabilityScore profileImage');

      if (!product) {
        return res.status(404).json({ 
          message: 'Producto no encontrado' 
        });
      }

      res.json({
        product,
        estimatedCO2Saved: product.estimatedCO2Saved,
        sellerDetails: product.seller
      });
    } catch (error) {
      res.status(500).json({ 
        message: 'Error al obtener detalles', 
        error: error.message 
      });
    }
  }

  // Comprar producto
  async purchaseProduct(req, res) {
    try {
      const product = await Product.findById(req.params.id);
      
      if (!product) {
        return res.status(404).json({ 
          message: 'Producto no encontrado' 
        });
      }

      if (product.status !== 'Disponible') {
        return res.status(400).json({ 
          message: 'Producto no disponible' 
        });
      }

      // Lógica de compra (simplificada)
      product.status = 'Vendido';
      await product.save();

      // Actualizar EcoCoins
      const seller = await User.findById(product.seller);
      seller.ecoCoins += product.ecoCoinsGenerated;
      seller.totalTransactions += 1;
      seller.updateSustainabilityScore();
      await seller.save();

      res.json({
        message: 'Compra realizada exitosamente',
        ecoCoinsEarned: product.ecoCoinsGenerated
      });
    } catch (error) {
      res.status(500).json({ 
        message: 'Error en la compra', 
        error: error.message 
      });
    }
  }
}

module.exports = new ProductController();