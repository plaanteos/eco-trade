const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  product: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true 
  },
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
  amount: { 
    type: Number, 
    required: true,
    min: 0
  },
  ecoCoinsGenerated: {
    buyer: { type: Number, default: 0 },
    seller: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  co2Saved: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Pendiente', 'Confirmada', 'En_proceso', 'Completada', 'Cancelada', 'Disputada'],
    default: 'Pendiente'
  },
  paymentMethod: {
    type: String,
    enum: ['Efectivo', 'Transferencia', 'MercadoPago', 'EcoCoins', 'Mixto'],
    required: true
  },
  paymentDetails: {
    ecoCoinsUsed: { type: Number, default: 0 },
    cashAmount: { type: Number, default: 0 },
    digitalAmount: { type: Number, default: 0 },
    transactionId: String // ID de pago externo (MercadoPago, etc.)
  },
  delivery: {
    method: {
      type: String,
      enum: ['Retiro_en_persona', 'Envio_domicilio', 'Punto_encuentro', 'Correo'],
      default: 'Retiro_en_persona'
    },
    address: String,
    estimatedDate: Date,
    actualDate: Date,
    trackingNumber: String,
    cost: { type: Number, default: 0 }
  },
  timeline: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    description: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  communication: {
    messages: [{
      sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      message: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
      attachments: [String] // URLs de archivos adjuntos
    }],
    lastMessageAt: Date
  },
  ratings: {
    buyerRating: {
      score: { type: Number, min: 1, max: 5 },
      comment: String,
      ratedAt: Date
    },
    sellerRating: {
      score: { type: Number, min: 1, max: 5 },
      comment: String,
      ratedAt: Date
    }
  },
  metadata: {
    platform: { type: String, default: 'web' }, // web, mobile, api
    userAgent: String,
    ipAddress: String,
    source: String // referrer, campaign, etc.
  }
}, {
  timestamps: true
});

// Índices para consultas eficientes
TransactionSchema.index({ buyer: 1, status: 1 });
TransactionSchema.index({ seller: 1, status: 1 });
TransactionSchema.index({ product: 1 });
TransactionSchema.index({ status: 1, createdAt: -1 });
TransactionSchema.index({ createdAt: -1 });

// Middleware pre-save para calcular ecoCoins automáticamente
TransactionSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('amount')) {
    // Calcular ecoCoins según la lógica: 1 ecoCoin por cada $10
    const baseEcoCoins = Math.floor(this.amount / 10);
    
    // Distribuir ecoCoins: 60% al vendedor, 40% al comprador
    this.ecoCoinsGenerated.seller = Math.round(baseEcoCoins * 0.6);
    this.ecoCoinsGenerated.buyer = Math.round(baseEcoCoins * 0.4);
    this.ecoCoinsGenerated.total = this.ecoCoinsGenerated.seller + this.ecoCoinsGenerated.buyer;
  }
  next();
});

// Método para añadir mensaje al chat
TransactionSchema.methods.addMessage = function(senderId, message, attachments = []) {
  this.communication.messages.push({
    sender: senderId,
    message,
    attachments
  });
  this.communication.lastMessageAt = new Date();
  return this.save();
};

// Método para actualizar estado y timeline
TransactionSchema.methods.updateStatus = function(newStatus, description, updatedBy) {
  this.status = newStatus;
  this.timeline.push({
    status: newStatus,
    description,
    updatedBy
  });
  return this.save();
};

// Método para procesar calificación
TransactionSchema.methods.addRating = function(ratingType, score, comment, userId) {
  if (ratingType === 'buyer' && this.buyer.toString() === userId.toString()) {
    this.ratings.buyerRating = {
      score,
      comment,
      ratedAt: new Date()
    };
  } else if (ratingType === 'seller' && this.seller.toString() === userId.toString()) {
    this.ratings.sellerRating = {
      score,
      comment,
      ratedAt: new Date()
    };
  } else {
    throw new Error('No autorizado para calificar esta transacción');
  }
  
  return this.save();
};

// Método para completar transacción y distribuir ecoCoins
TransactionSchema.methods.complete = async function() {
  if (this.status !== 'En_proceso') {
    throw new Error('La transacción debe estar en proceso para completarse');
  }

  // Cargar modelos necesarios
  const User = mongoose.model('User');
  const Product = mongoose.model('Product');

  // Actualizar estado
  await this.updateStatus('Completada', 'Transacción completada exitosamente');

  // Distribuir ecoCoins
  await User.findByIdAndUpdate(this.seller, {
    $inc: { 
      ecoCoins: this.ecoCoinsGenerated.seller,
      totalTransactions: 1
    }
  });

  await User.findByIdAndUpdate(this.buyer, {
    $inc: { 
      ecoCoins: this.ecoCoinsGenerated.buyer,
      totalTransactions: 1
    }
  });

  // Actualizar producto como vendido
  await Product.findByIdAndUpdate(this.product, {
    status: 'Vendido'
  });

  // Actualizar sustainability scores
  const [seller, buyer] = await Promise.all([
    User.findById(this.seller),
    User.findById(this.buyer)
  ]);

  seller.updateSustainabilityScore();
  buyer.updateSustainabilityScore();

  await Promise.all([seller.save(), buyer.save()]);

  return this;
};

// Método estático para estadísticas de usuario
TransactionSchema.statics.getUserStats = function(userId) {
  return this.aggregate([
    {
      $match: {
        $or: [{ buyer: userId }, { seller: userId }],
        status: 'Completada'
      }
    },
    {
      $group: {
        _id: userId,
        totalTransactions: { $sum: 1 },
        totalEcoCoinsEarned: { 
          $sum: {
            $cond: [
              { $eq: ['$seller', userId] },
              '$ecoCoinsGenerated.seller',
              '$ecoCoinsGenerated.buyer'
            ]
          }
        },
        totalCO2Saved: { $sum: '$co2Saved' },
        totalAmount: { $sum: '$amount' },
        asBuyer: {
          $sum: {
            $cond: [{ $eq: ['$buyer', userId] }, 1, 0]
          }
        },
        asSeller: {
          $sum: {
            $cond: [{ $eq: ['$seller', userId] }, 1, 0]
          }
        }
      }
    }
  ]);
};

const Transaction = mongoose.model('Transaction', TransactionSchema);
module.exports = Transaction;
