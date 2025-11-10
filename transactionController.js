// backend/controllers/transactionController.js
const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const User = require('../models/User');

class TransactionController {
  // Crear transacción
  async createTransaction(req, res) {
    try {
      const { productId } = req.body;
      const product = await Product.findById(productId);

      if (!product) {
        return res.status(404).json({ message: 'Producto no encontrado' });
      }

      const transaction = new Transaction({
        buyer: req.user.id,
        seller: product.seller,
        product: productId,
        price: product.price,
        ecoCoinsGenerated: product.ecoCoinsGenerated,
        co2Saved: product.estimatedCO2Saved
      });

      await transaction.save();

      // Actualizar estado del producto
      product.status = 'Reservado';
      await product.save();

      res.status(201).json({
        message: 'Transacción iniciada',
        transaction
      });
    } catch (error) {
      res.status(500).json({ 
        message: 'Error al crear transacción', 
        error: error.message 
      });
    }
  }

  // Obtener transacciones de un usuario
  async getUserTransactions(req, res) {
    try {
      const transactions = await Transaction.find({
        $or: [
          { buyer: req.user.id },
          { seller: req.user.id }
        ]
      })
      .populate('product')
      .populate('buyer', 'username')
      .populate('seller', 'username');

      res.json({
        transactions,
        totalEcoCoins: transactions.reduce((sum, t) => sum + t.ecoCoinsGenerated, 0),
        totalCO2Saved: transactions.reduce((sum, t) => sum + t.co2Saved, 0)
      });
    } catch (error) {
      res.status(500).json({ 
        message: 'Error al obtener transacciones', 
        error: error.message 
      });
    }
  }
}

module.exports = new TransactionController();