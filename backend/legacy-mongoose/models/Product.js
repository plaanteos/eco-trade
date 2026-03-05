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
    type: Number,
    validate: {
      validator: function(v) {
        return !v || v >= this.price;
      },
      message: 'El precio original debe ser mayor o igual al precio actual'
    }
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Electrónicos', 
      'Ropa y Accesorios', 
      'Hogar y Jardín', 
      'Libros y Medios', 
      'Deportes y Recreación', 
      'Automóvil',
      'Arte y Artesanías',
      'Otros'
    ]
  },
  condition: {
    type: String,
    required: true,
    enum: ['Nuevo', 'Como nuevo', 'Usado - Excelente', 'Usado - Bueno', 'Usado - Regular', 'Para reparar']
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Hacer opcional para demo
  },
  owner: {
    type: String, // Para compatibilidad con datos demo
    default: 'demo_user'
  },
  images: [{
    type: String,
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
      },
      message: props => `${props.value} no es una URL de imagen válida!`
    }
  }],
  ecologicalImpact: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
    get: v => Math.round(v * 100) / 100 // Redondear a 2 decimales
  },
  ecoCoinsGenerated: {
    type: Number,
    default: 0,
    min: 0
  },
  estimatedCO2Saved: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['available', 'reserved', 'sold', 'paused'],
    default: 'available'
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
  locationText: {
    type: String, // Campo simple para ubicación de texto
    default: 'No especificada'
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  views: {
    type: Number,
    default: 0
  },
  favorites: {
    type: Number,
    default: 0
  },
  favoredBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  specifications: {
    brand: String,
    model: String,
    year: Number,
    color: String,
    size: String,
    weight: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    }
  },
  deliveryOptions: {
    pickup: { type: Boolean, default: true },
    delivery: { type: Boolean, default: false },
    shipping: { type: Boolean, default: false },
    deliveryRadius: { type: Number, default: 10 } // km
  },
  promotions: {
    featured: { type: Boolean, default: false },
    featuredUntil: Date,
    discount: {
      percentage: { type: Number, min: 0, max: 100 },
      validUntil: Date
    }
  }
}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true }
});

// Índices para búsquedas eficientes
ProductSchema.index({ location: '2dsphere' });
ProductSchema.index({ category: 1, status: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ condition: 1 });
ProductSchema.index({ seller: 1 });
ProductSchema.index({ tags: 1 });
ProductSchema.index({ createdAt: -1 });

// Índice de texto para búsqueda
ProductSchema.index({ 
  name: 'text', 
  description: 'text', 
  tags: 'text' 
}, {
  weights: {
    name: 10,
    description: 5,
    tags: 3
  }
});

// Método para calcular impacto ecológico
ProductSchema.methods.calculateEcologicalImpact = function() {
  // Factores de impacto por categoría (0-1, donde 1 es máximo impacto ambiental)
  const categoryImpactFactors = {
    'Electrónica': 0.9,
    'Vehículos': 0.95,
    'Muebles': 0.7,
    'Ropa': 0.6,
    'Herramientas': 0.75,
    'Libros': 0.3,
    'Deportes': 0.65,
    'Hogar': 0.5,
    'Otros': 0.5
  };

  // Factores por condición (mejor condición = mayor reutilización = menor impacto)
  const conditionFactors = {
    'Nuevo': 0.2,          // Producto nuevo pero reutilizado
    'Como nuevo': 0.15,    // Excelente condición
    'Bueno': 0.25,         // Buena condición
    'Aceptable': 0.4,      // Condición regular
    'Reparar': 0.6         // Necesita reparación
  };

  const categoryFactor = categoryImpactFactors[this.category] || 0.5;
  const conditionFactor = conditionFactors[this.condition] || 0.3;
  
  // Calcular porcentaje de descuento respecto al precio original
  const discountFactor = this.originalPrice && this.originalPrice > 0
    ? (this.originalPrice - this.price) / this.originalPrice
    : 0.3; // Asumir 30% si no hay precio original

  // Calcular impacto: mayor descuento y mejor condición = mayor impacto positivo
  this.ecologicalImpact = Math.round(
    (1 - (categoryFactor * conditionFactor)) * 
    (1 + discountFactor * 0.5) * 100
  );

  // Calcular ecoCoins basado en impacto y precio
  this.ecoCoinsGenerated = Math.max(1, Math.round(
    (this.price / 100) * (this.ecologicalImpact / 100) * 10
  ));

  // Calcular CO2 estimado ahorrado (kg)
  this.estimatedCO2Saved = Math.round(
    this.price * categoryFactor * 0.05 // 5% del precio como estimación de kg CO2
  );

  return this.ecologicalImpact;
};

// Middleware pre-save para calcular impacto automáticamente
ProductSchema.pre('save', function(next) {
  if (this.isModified('price') || this.isModified('originalPrice') || 
      this.isModified('category') || this.isModified('condition') ||
      this.isNew) {
    this.calculateEcologicalImpact();
  }
  next();
});

// Método para incrementar vistas
ProductSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save({ validateBeforeSave: false });
};

// Método para toggle favorito
ProductSchema.methods.toggleFavorite = function(userId) {
  const index = this.favoredBy.indexOf(userId);
  if (index > -1) {
    this.favoredBy.splice(index, 1);
    this.favorites = Math.max(0, this.favorites - 1);
  } else {
    this.favoredBy.push(userId);
    this.favorites += 1;
  }
  return this.save({ validateBeforeSave: false });
};

// Método para marcar como destacado
ProductSchema.methods.feature = function(days = 7) {
  this.promotions.featured = true;
  this.promotions.featuredUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return this.save();
};

const Product = mongoose.model('Product', ProductSchema);
module.exports = Product;
