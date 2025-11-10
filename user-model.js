// backend/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
  profileImage: {
    type: String,
    default: 'https://default-avatar.com/user.png'
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
  productsSold: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  roles: {
    type: [String],
    enum: ['user', 'seller', 'admin'],
    default: ['user']
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Pre-save middleware para hashear contraseña
UserSchema.pre('save', async function(next) {
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
  // Lógica de cálculo de sustainability score
  const baseScore = this.ecoCoins / 10;
  const transactionMultiplier = Math.log(this.totalTransactions + 1);
  
  this.sustainabilityScore = Math.min(
    100, 
    Math.round(baseScore * transactionMultiplier)
  );
  
  return this.sustainabilityScore;
};

const User = mongoose.model('User', UserSchema);
module.exports = User;
