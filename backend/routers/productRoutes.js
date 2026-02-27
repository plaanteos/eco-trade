const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

const isDemoMode = String(process.env.DEMO_MODE || '').toLowerCase() === 'true';
const { authenticate, authorize, optionalAuth } = isDemoMode
	? require('../middleware/authMiddleware_demo')
	: require('../middleware/authMiddleware');

// Rutas públicas
router.get('/', optionalAuth, productController.getAllProducts);
router.get('/search', optionalAuth, productController.searchProducts);
router.get('/:id', optionalAuth, productController.getProductById);

// Rutas protegidas
router.post('/', authenticate, authorize('seller'), productController.createProduct);
router.put('/:id', authenticate, authorize('seller'), productController.updateProduct);
router.delete('/:id', authenticate, authorize('seller'), productController.deleteProduct);
router.get('/user/my-products', authenticate, authorize('seller'), productController.getMyProducts);
router.post('/:id/interest', authenticate, productController.showInterest);

module.exports = router;
