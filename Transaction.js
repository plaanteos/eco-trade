// backend/models/Transaction.js
const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  ecoCoinsGenerated: {
    type: Number,
    default: 0
  },
  co2Saved: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Pendiente', 'Completada', 'Cancelada'],
    default: 'Pendiente'
  }
}, {
  timestamps: true
});

const Transaction = mongoose.model('Transaction', TransactionSchema);
module.exports = Transaction;