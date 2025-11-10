// backend/routes/productRoutes.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticateToken, checkRoles } = require('../middleware/authMiddleware');

// Rutas públicas
router.get('/search', productController.searchProducts);
router.get('/:id', productController.getProductDetails);

// Rutas protegidas
router.post('/', 
  authenticateToken, 
  checkRoles(['user', 'seller']), 
  productController.createProduct
);

router.post('/:id/purchase', 
  authenticateToken, 
  productController.purchaseProduct
);

// Rutas de administrador
router.delete('/:id', 
  authenticateToken, 
  checkRoles(['admin']), 
  async (req, res) => {
    try {
      // Lógica de eliminación de producto
      res.json({ message: 'Producto eliminado' });
    } catch (error) {
      res.status(500).json({ message: 'Error al eliminar producto' });
    }
  }
);

module.exports = router;