// backend/routes/transactionRoutes.js
const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Rutas protegidas
router.post('/', 
  authenticateToken, 
  transactionController.createTransaction
);

router.get('/my-transactions', 
  authenticateToken, 
  transactionController.getUserTransactions
);

module.exports = router;