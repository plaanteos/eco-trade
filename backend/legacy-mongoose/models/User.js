const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido']
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  accountType: {
    type: String,
    enum: ['individual', 'company'],
    default: 'individual'
  },
  country: {
    type: String,
    trim: true,
    uppercase: true,
    minlength: 2,
    maxlength: 2
  },
  recyclingCode: {
    type: String,
    unique: true,
    index: true,
    trim: true
  },
  profileImage: {
    type: String,
    default: function() {
      return `https://api.dicebear.com/7.x/avataaars/svg?seed=${this.username}`;
    }
  },
  ecoCoins: {
    type: Number,
    default: 0
  },
  totalTransactions: {
    type: Number,
    default: 0
  },
  sustainabilityScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 }
  },
  productsSold: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  productsBought: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  roles: {
    type: [String],
    enum: ['user', 'seller', 'admin'],
    default: ['user']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationDocuments: {
    dniNumber: String,
    dniImage: String,
    selfieImage: String,
    verifiedAt: Date
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0]
    },
    address: String,
    city: String,
    province: String
  },
  preferences: {
    categories: [String],
    maxDeliveryDistance: { type: Number, default: 50 }, // km
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    }
  }
}, {
  timestamps: true
});

// Índice para búsqueda geoespacial
UserSchema.index({ location: '2dsphere' });

// Pre-save middleware para hashear contraseña
UserSchema.pre('save', async function(next) {
  // Generar código de identificación para reciclaje si falta
  if (!this.recyclingCode) {
    // 16 chars base32-ish: timestamp base36 + random hex (reduce colisiones)
    const ts = Date.now().toString(36).toUpperCase();
    const rnd = crypto.randomBytes(6).toString('hex').toUpperCase();
    this.recyclingCode = `ET-${ts}-${rnd}`;
  }

  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar contraseñas
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Método para calcular sustainability score
UserSchema.methods.updateSustainabilityScore = function() {
  // Lógica de cálculo basada en ecoCoins, transacciones y rating
  const ecoCoinsScore = Math.min(50, this.ecoCoins / 20); // Máximo 50 puntos por ecoCoins
  const transactionScore = Math.min(30, this.totalTransactions * 2); // Máximo 30 puntos por transacciones
  const ratingScore = this.rating.average * 4; // Máximo 20 puntos por rating
  
  this.sustainabilityScore = Math.round(ecoCoinsScore + transactionScore + ratingScore);
  return this.sustainabilityScore;
};

// Método para añadir ecoCoins
UserSchema.methods.addEcoCoins = function(amount, reason = 'transaction') {
  this.ecoCoins += amount;
  this.updateSustainabilityScore();
  return this.ecoCoins;
};

// Método para actualizar rating
UserSchema.methods.updateRating = function(newRating) {
  const totalRating = (this.rating.average * this.rating.count) + newRating;
  this.rating.count += 1;
  this.rating.average = totalRating / this.rating.count;
  this.updateSustainabilityScore();
  return this.rating;
};

const User = mongoose.model('User', UserSchema);
module.exports = User;
