const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');

const isDemoMode = String(process.env.DEMO_MODE || '').toLowerCase() === 'true';
const { authenticate, authorize } = isDemoMode
	? require('../middleware/authMiddleware_demo')
	: require('../middleware/authMiddleware');

// Rutas protegidas
router.get('/', authenticate, transactionController.getAllTransactions);
router.post('/', authenticate, transactionController.createTransaction);

module.exports = router;
