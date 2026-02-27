const mongoose = require('mongoose');

const RecyclingPointSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  address: {
    type: String,
    required: true,
    maxlength: 200
  },
  city: {
    type: String,
    required: true,
    maxlength: 100
  },
  state: {
    type: String,
    required: true,
    maxlength: 100
  },
  country: {
    type: String,
    required: true,
    maxlength: 100
  },
  coordinates: {
    latitude: {
      type: Number,
      required: true,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180
    }
  },
  administrator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  operators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  contactInfo: {
    phone: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true
    },
    whatsapp: String,
    website: String
  },
  operatingHours: {
    monday: { open: String, close: String, closed: { type: Boolean, default: false } },
    tuesday: { open: String, close: String, closed: { type: Boolean, default: false } },
    wednesday: { open: String, close: String, closed: { type: Boolean, default: false } },
    thursday: { open: String, close: String, closed: { type: Boolean, default: false } },
    friday: { open: String, close: String, closed: { type: Boolean, default: false } },
    saturday: { open: String, close: String, closed: { type: Boolean, default: false } },
    sunday: { open: String, close: String, closed: { type: Boolean, default: false } }
  },
  acceptedMaterials: [{
    materialType: {
      type: String,
      enum: [
        'Plástico PET', 'Plástico HDPE', 'Plástico LDPE', 'Plástico PP', 'Plástico PS', 'Plástico Otros',
        'Papel Blanco', 'Papel Periódico', 'Cartón', 'Papel Mixto',
        'Vidrio Transparente', 'Vidrio Color', 'Vidrio Templado',
        'Aluminio', 'Acero', 'Cobre', 'Metal Mixto',
        'Electrónicos', 'Baterías', 'Aceite Usado', 'Textiles', 'Orgánico'
      ],
      required: true
    },
    rewardPerKg: {
      type: Number,
      required: true,
      min: 0
    },
    description: String,
    specialInstructions: String
  }],
  stats: {
    totalKgProcessed: { type: Number, default: 0 },
    totalSubmissions: { type: Number, default: 0 },
    totalUsersServed: { type: Number, default: 0 },
    totalEcoCoinsRewarded: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalRatings: { type: Number, default: 0 }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance', 'full'],
    default: 'active'
  },
  capacity: {
    maxDailySubmissions: { type: Number, default: 50 },
    currentDaySubmissions: { type: Number, default: 0 },
    lastResetDate: { type: Date, default: Date.now }
  },
  certifications: [{
    name: String,
    issuer: String,
    dateIssued: Date,
    expiryDate: Date,
    certificateUrl: String
  }],
  images: [{
    type: String,
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
      },
      message: 'URL de imagen inválida'
    }
  }],
  features: {
    weighingScale: { type: Boolean, default: true },
    materialSorting: { type: Boolean, default: true },
    qualityInspection: { type: Boolean, default: true },
    instantReward: { type: Boolean, default: true },
    pickupService: { type: Boolean, default: false },
    educationalPrograms: { type: Boolean, default: false }
  },
  specialPrograms: [{
    name: String,
    description: String,
    bonusMultiplier: { type: Number, default: 1, min: 1, max: 5 },
    startDate: Date,
    endDate: Date,
    isActive: { type: Boolean, default: true }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices para búsquedas geoespaciales
RecyclingPointSchema.index({ "coordinates.latitude": 1, "coordinates.longitude": 1 });
RecyclingPointSchema.index({ city: 1, state: 1 });
RecyclingPointSchema.index({ status: 1 });
RecyclingPointSchema.index({ "acceptedMaterials.materialType": 1 });

// Virtual para obtener distancia (se calcula en queries)
RecyclingPointSchema.virtual('distance').get(function() {
  return this._distance;
});

// Método para verificar si está abierto
RecyclingPointSchema.methods.isOpenNow = function() {
  const now = new Date();
  const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour * 100 + currentMinute;
  
  const todayHours = this.operatingHours[dayOfWeek];
  if (todayHours.closed) return false;
  
  const openTime = parseInt(todayHours.open.replace(':', ''));
  const closeTime = parseInt(todayHours.close.replace(':', ''));
  
  return currentTime >= openTime && currentTime <= closeTime;
};

// Método para resetear contador diario
RecyclingPointSchema.methods.resetDailyCounter = function() {
  const today = new Date();
  const lastReset = this.capacity.lastResetDate;
  
  if (today.toDateString() !== lastReset.toDateString()) {
    this.capacity.currentDaySubmissions = 0;
    this.capacity.lastResetDate = today;
    return this.save();
  }
  return Promise.resolve(this);
};

// Método para verificar si puede aceptar más submissions
RecyclingPointSchema.methods.canAcceptSubmissions = function() {
  return this.status === 'active' && 
         this.capacity.currentDaySubmissions < this.capacity.maxDailySubmissions;
};

// Método para actualizar estadísticas
RecyclingPointSchema.methods.updateStats = function(kg, ecoCoins, userId) {
  this.stats.totalKgProcessed += kg;
  this.stats.totalSubmissions += 1;
  this.stats.totalEcoCoinsRewarded += ecoCoins;
  this.capacity.currentDaySubmissions += 1;
  
  return this.save();
};

module.exports = mongoose.model('RecyclingPoint', RecyclingPointSchema);