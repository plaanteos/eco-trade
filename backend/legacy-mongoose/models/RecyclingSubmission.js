const mongoose = require('mongoose');

const RecyclingSubmissionSchema = new mongoose.Schema({
  submissionCode: {
    type: String,
    unique: true,
    required: true,
    default: function() {
      return 'REC' + Date.now() + Math.floor(Math.random() * 1000);
    }
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recyclingPoint: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RecyclingPoint',
    required: true
  },
  materials: [{
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
    estimatedWeight: {
      type: Number,
      required: true,
      min: 0.01,
      max: 1000 // kg máximo por material
    },
    actualWeight: {
      type: Number,
      min: 0,
      max: 1000
    },
    description: {
      type: String,
      maxlength: 200
    },
    condition: {
      type: String,
      enum: ['Excelente', 'Bueno', 'Regular', 'Necesita Limpieza'],
      required: true
    },
    images: [{
      type: String,
      validate: {
        validator: function(v) {
          return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
        },
        message: 'URL de imagen inválida'
      }
    }],
    rewardPerKg: Number,
    calculatedReward: Number,
    actualReward: Number
  }],
  submissionDetails: {
    estimatedTotalWeight: {
      type: Number,
      required: true,
      min: 0.01
    },
    actualTotalWeight: Number,
    transportMethod: {
      type: String,
      enum: ['Entrega Personal', 'Transporte Público', 'Vehículo Propio', 'Bicicleta', 'Caminando'],
      required: true
    },
    submissionNotes: {
      type: String,
      maxlength: 500
    },
    scheduledDate: {
      type: Date,
      required: true
    },
    preferredTimeSlot: {
      type: String,
      enum: ['08:00-10:00', '10:00-12:00', '12:00-14:00', '14:00-16:00', '16:00-18:00'],
      required: true
    }
  },
  verification: {
    status: {
      type: String,
      enum: ['pending', 'in_review', 'approved', 'rejected', 'partially_approved'],
      default: 'pending'
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verificationDate: Date,
    verificationNotes: String,
    qualityAssessment: {
      overallGrade: {
        type: String,
        enum: ['A+', 'A', 'B+', 'B', 'C', 'D', 'F']
      },
      cleanliness: {
        type: Number,
        min: 1,
        max: 10
      },
      separation: {
        type: Number,
        min: 1,
        max: 10
      },
      completeness: {
        type: Number,
        min: 1,
        max: 10
      }
    },
    rejectionReasons: [{
      type: String,
      enum: [
        'Material Contaminado',
        'Separación Incorrecta',
        'Material No Aceptado',
        'Peso Insuficiente',
        'Condición Inaceptable',
        'Documentación Incompleta',
        'Duplicado',
        'Otro'
      ]
    }],
    photos: [{
      description: String,
      url: String,
      timestamp: { type: Date, default: Date.now }
    }]
  },
  rewards: {
    estimatedEcoCoins: {
      type: Number,
      required: true,
      min: 0
    },
    actualEcoCoins: {
      type: Number,
      default: 0,
      min: 0
    },
    bonusEcoCoins: {
      type: Number,
      default: 0,
      min: 0
    },
    totalEcoCoins: {
      type: Number,
      default: 0,
      min: 0
    },
    rewardCalculation: {
      baseReward: Number,
      qualityBonus: Number,
      programBonus: Number,
      firstTimeBonus: Number,
      loyaltyBonus: Number
    },
    rewardDistributed: {
      type: Boolean,
      default: false
    },
    rewardDistributionDate: Date
  },
  environmentalImpact: {
    co2Saved: {
      type: Number,
      default: 0 // kg de CO2 ahorrados
    },
    energySaved: {
      type: Number,
      default: 0 // kWh ahorrados
    },
    waterSaved: {
      type: Number,
      default: 0 // litros ahorrados
    },
    treesEquivalent: {
      type: Number,
      default: 0 // árboles equivalentes salvados
    }
  },
  tracking: {
    submittedAt: {
      type: Date,
      default: Date.now
    },
    arrivedAt: Date,
    processingStartedAt: Date,
    verificationCompletedAt: Date,
    rewardDistributedAt: Date,
    currentStatus: {
      type: String,
      enum: ['submitted', 'in_transit', 'arrived', 'processing', 'verified', 'completed', 'cancelled'],
      default: 'submitted'
    },
    statusHistory: [{
      status: String,
      timestamp: { type: Date, default: Date.now },
      notes: String,
      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }]
  },
  feedback: {
    userRating: {
      type: Number,
      min: 1,
      max: 5
    },
    userComments: String,
    adminResponse: String,
    improvementSuggestions: [String]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices para consultas eficientes
RecyclingSubmissionSchema.index({ user: 1, createdAt: -1 });
RecyclingSubmissionSchema.index({ recyclingPoint: 1, createdAt: -1 });
RecyclingSubmissionSchema.index({ 'verification.status': 1 });
RecyclingSubmissionSchema.index({ submissionCode: 1 });
RecyclingSubmissionSchema.index({ 'tracking.currentStatus': 1 });

// Virtual para calcular el progreso
RecyclingSubmissionSchema.virtual('progressPercentage').get(function() {
  const statusProgress = {
    'submitted': 10,
    'in_transit': 25,
    'arrived': 40,
    'processing': 60,
    'verified': 85,
    'completed': 100,
    'cancelled': 0
  };
  return statusProgress[this.tracking.currentStatus] || 0;
});

// Método para actualizar estado
RecyclingSubmissionSchema.methods.updateStatus = function(newStatus, notes = '', updatedBy = null) {
  this.tracking.currentStatus = newStatus;
  this.tracking.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
    notes,
    updatedBy
  });
  
  // Actualizar timestamps específicos
  const now = new Date();
  switch(newStatus) {
    case 'arrived':
      this.tracking.arrivedAt = now;
      break;
    case 'processing':
      this.tracking.processingStartedAt = now;
      break;
    case 'verified':
      this.tracking.verificationCompletedAt = now;
      break;
    case 'completed':
      this.tracking.rewardDistributedAt = now;
      this.rewards.rewardDistributed = true;
      this.rewards.rewardDistributionDate = now;
      break;
  }
  
  return this.save();
};

// Método para calcular impacto ambiental
RecyclingSubmissionSchema.methods.calculateEnvironmentalImpact = function() {
  const impactFactors = {
    'Plástico PET': { co2: 1.8, energy: 2.5, water: 15 },
    'Plástico HDPE': { co2: 1.5, energy: 2.2, water: 12 },
    'Papel Blanco': { co2: 1.2, energy: 1.8, water: 25 },
    'Cartón': { co2: 0.9, energy: 1.5, water: 20 },
    'Vidrio Transparente': { co2: 0.6, energy: 1.0, water: 8 },
    'Aluminio': { co2: 8.0, energy: 12.0, water: 5 }
  };
  
  let totalCO2 = 0;
  let totalEnergy = 0;
  let totalWater = 0;
  
  this.materials.forEach(material => {
    const weight = material.actualWeight || material.estimatedWeight;
    const factors = impactFactors[material.materialType] || { co2: 1, energy: 1, water: 10 };
    
    totalCO2 += weight * factors.co2;
    totalEnergy += weight * factors.energy;
    totalWater += weight * factors.water;
  });
  
  this.environmentalImpact.co2Saved = Math.round(totalCO2 * 100) / 100;
  this.environmentalImpact.energySaved = Math.round(totalEnergy * 100) / 100;
  this.environmentalImpact.waterSaved = Math.round(totalWater * 100) / 100;
  this.environmentalImpact.treesEquivalent = Math.round((totalCO2 / 22) * 100) / 100; // 1 árbol absorbe ~22kg CO2/año
  
  return this.save();
};

// Método para calcular recompensa final
RecyclingSubmissionSchema.methods.calculateFinalReward = function() {
  let baseReward = 0;
  
  this.materials.forEach(material => {
    const weight = material.actualWeight || material.estimatedWeight;
    const rewardPerKg = material.rewardPerKg || 1;
    baseReward += weight * rewardPerKg;
  });
  
  let qualityBonus = 0;
  if (this.verification.qualityAssessment.overallGrade) {
    const gradeBonus = { 'A+': 0.5, 'A': 0.3, 'B+': 0.2, 'B': 0.1, 'C': 0, 'D': -0.1, 'F': -0.2 };
    qualityBonus = baseReward * (gradeBonus[this.verification.qualityAssessment.overallGrade] || 0);
  }
  
  this.rewards.rewardCalculation = {
    baseReward,
    qualityBonus,
    programBonus: this.rewards.bonusEcoCoins || 0,
    firstTimeBonus: 0, // Se calcula en el controlador
    loyaltyBonus: 0    // Se calcula en el controlador
  };
  
  this.rewards.actualEcoCoins = Math.floor(baseReward + qualityBonus);
  this.rewards.totalEcoCoins = this.rewards.actualEcoCoins + this.rewards.bonusEcoCoins;
  
  return this.save();
};

module.exports = mongoose.model('RecyclingSubmission', RecyclingSubmissionSchema);