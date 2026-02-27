// backend/models/Product.js
const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    minlength: 10,
    maxlength: 500
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  originalPrice: {
    type: Number
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Electrónica', 
      'Muebles', 
      'Ropa', 
      'Herramientas', 
      'Libros', 
      'Deportes', 
      'Otros'
    ]
  },
  condition: {
    type: String,
    required: true,
    enum: ['Nuevo', 'Como nuevo', 'Bueno', 'Aceptable']
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  images: [{
    type: String,
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+\.(jpg|jpeg|png|gif)$/i.test(v);
      },
      message: props => `${props.value} no es una URL de imagen válida!`
    }
  }],
  ecologicalImpact: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  ecoCoinsGenerated: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Disponible', 'Reservado', 'Vendido'],
    default: 'Disponible'
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },
  tags: [{
    type: String,
    trim: true
  }],
  estimatedCO2Saved: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Índice para búsqueda geoespacial
ProductSchema.index({ location: '2dsphere' });

// Método para calcular impacto ecológico
ProductSchema.methods.calculateEcologicalImpact = function() {
  const impactFactors = {
    'Electrónica': 0.8,
    'Muebles': 0.7,
    'Ropa': 0.6,
    'Herramientas': 0.75,
    'Libros': 0.5,
    'Deportes': 0.65,
    'Otros': 0.5
  };

  const conditionFactors = {
    'Nuevo': 0.2,
    'Como nuevo': 0.4,
    'Bueno': 0.6,
    'Aceptable': 0.8
  };

  const baseImpact = impactFactors[this.category] || 0.5;
  const conditionFactor = conditionFactors[this.condition] || 0.5;
  
  // Calcular porcentaje de descuento del precio original
  const discountPercentage = this.originalPrice 
    ? ((this.originalPrice - this.price) / this.originalPrice) * 100 
    : 0;

  this.ecologicalImpact = Math.round(
    (1 - baseImpact * conditionFactor) * 100
  );

  // Generar EcoCoins basado en impacto y descuento
  this.ecoCoinsGenerated = Math.round(
    this.ecologicalImpact * (1 + discountPercentage / 100)
  );

  return this.ecologicalImpact;
};

const Product = mongoose.model('Product', ProductSchema);
module.exports = Product;
