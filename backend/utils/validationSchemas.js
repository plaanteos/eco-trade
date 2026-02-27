const Joi = require('joi');

class ValidationSchemas {
  // Esquema de validación para registro de usuario
  static userRegister = Joi.object({
    username: Joi.string()
      .alphanum()
      .min(3)
      .max(20)
      .required()
      .messages({
        'string.alphanum': 'El nombre de usuario solo puede contener letras y números',
        'string.min': 'El nombre de usuario debe tener al menos 3 caracteres',
        'string.max': 'El nombre de usuario no puede exceder 20 caracteres'
      }),
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Formato de email inválido'
      }),
    password: Joi.string()
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$'))
      .required()
      .messages({
        'string.pattern.base': 'La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial'
      }),
    location: Joi.object({
      coordinates: Joi.array().items(Joi.number()).length(2),
      address: Joi.string().max(200),
      city: Joi.string().max(100),
      province: Joi.string().max(100)
    }).optional()
  });

  // Esquema de validación para login
  static userLogin = Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Formato de email inválido'
      }),
    password: Joi.string()
      .min(1)
      .required()
      .messages({
        'string.min': 'La contraseña es requerida'
      })
  });

  // Esquema de validación para creación de producto
  static productCreate = Joi.object({
    name: Joi.string()
      .min(3)
      .max(100)
      .required()
      .messages({
        'string.min': 'El nombre del producto debe tener al menos 3 caracteres',
        'string.max': 'El nombre del producto no puede exceder 100 caracteres'
      }),
    description: Joi.string()
      .min(10)
      .max(500)
      .required()
      .messages({
        'string.min': 'La descripción debe tener al menos 10 caracteres',
        'string.max': 'La descripción no puede exceder 500 caracteres'
      }),
    price: Joi.number()
      .positive()
      .min(1)
      .required()
      .messages({
        'number.positive': 'El precio debe ser un número positivo',
        'number.min': 'El precio mínimo es $1'
      }),
    originalPrice: Joi.number()
      .positive()
      .optional()
      .messages({
        'number.positive': 'El precio original debe ser un número positivo'
      }),
    category: Joi.string()
      .valid('Electrónica', 'Muebles', 'Ropa', 'Herramientas', 'Libros', 'Deportes', 'Hogar', 'Vehículos', 'Otros')
      .required(),
    condition: Joi.string()
      .valid('Nuevo', 'Como nuevo', 'Bueno', 'Aceptable', 'Reparar')
      .required(),
    images: Joi.array()
      .items(Joi.string().uri())
      .min(1)
      .max(8)
      .required()
      .messages({
        'array.min': 'Debe incluir al menos una imagen',
        'array.max': 'Máximo 8 imágenes permitidas'
      }),
    tags: Joi.array()
      .items(Joi.string().max(20))
      .max(10)
      .optional(),
    location: Joi.object({
      coordinates: Joi.array().items(Joi.number()).length(2).required(),
      address: Joi.string().max(200),
      city: Joi.string().max(100),
      province: Joi.string().max(100)
    }).optional(),
    deliveryOptions: Joi.object({
      pickup: Joi.boolean().default(true),
      delivery: Joi.boolean().default(false),
      shipping: Joi.boolean().default(false),
      deliveryRadius: Joi.number().min(1).max(100).default(10)
    }).optional(),
    specifications: Joi.object({
      brand: Joi.string().max(50),
      model: Joi.string().max(50),
      year: Joi.number().integer().min(1900).max(new Date().getFullYear()),
      color: Joi.string().max(30),
      size: Joi.string().max(30),
      weight: Joi.number().positive(),
      dimensions: Joi.object({
        length: Joi.number().positive(),
        width: Joi.number().positive(),
        height: Joi.number().positive()
      })
    }).optional()
  });

  // Esquema de validación para actualización de producto
  static productUpdate = Joi.object({
    name: Joi.string().min(3).max(100).optional(),
    description: Joi.string().min(10).max(500).optional(),
    price: Joi.number().positive().min(1).optional(),
    originalPrice: Joi.number().positive().optional(),
    condition: Joi.string()
      .valid('Nuevo', 'Como nuevo', 'Bueno', 'Aceptable', 'Reparar')
      .optional(),
    images: Joi.array()
      .items(Joi.string().uri())
      .min(1)
      .max(8)
      .optional(),
    tags: Joi.array()
      .items(Joi.string().max(20))
      .max(10)
      .optional(),
    status: Joi.string()
      .valid('Disponible', 'Pausado')
      .optional(),
    deliveryOptions: Joi.object({
      pickup: Joi.boolean(),
      delivery: Joi.boolean(),
      shipping: Joi.boolean(),
      deliveryRadius: Joi.number().min(1).max(100)
    }).optional(),
    specifications: Joi.object({
      brand: Joi.string().max(50),
      model: Joi.string().max(50),
      year: Joi.number().integer().min(1900).max(new Date().getFullYear()),
      color: Joi.string().max(30),
      size: Joi.string().max(30),
      weight: Joi.number().positive(),
      dimensions: Joi.object({
        length: Joi.number().positive(),
        width: Joi.number().positive(),
        height: Joi.number().positive()
      })
    }).optional()
  });

  // Esquema de validación para transacciones
  static transactionCreate = Joi.object({
    productId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'ID de producto inválido'
      }),
    paymentMethod: Joi.string()
      .valid('Efectivo', 'Transferencia', 'MercadoPago', 'EcoCoins', 'Mixto')
      .required(),
    paymentDetails: Joi.object({
      ecoCoinsUsed: Joi.number().min(0).default(0),
      cashAmount: Joi.number().min(0).default(0),
      digitalAmount: Joi.number().min(0).default(0),
      transactionId: Joi.string().optional()
    }).optional(),
    delivery: Joi.object({
      method: Joi.string()
        .valid('Retiro_en_persona', 'Envio_domicilio', 'Punto_encuentro', 'Correo')
        .default('Retiro_en_persona'),
      address: Joi.string().max(200).optional(),
      estimatedDate: Joi.date().min('now').optional()
    }).optional(),
    message: Joi.string().max(500).optional()
  });

  // Esquema para búsqueda de productos
  static productSearch = Joi.object({
    query: Joi.string().max(100).optional(),
    category: Joi.string()
      .valid('Electrónica', 'Muebles', 'Ropa', 'Herramientas', 'Libros', 'Deportes', 'Hogar', 'Vehículos', 'Otros')
      .optional(),
    condition: Joi.array()
      .items(Joi.string().valid('Nuevo', 'Como nuevo', 'Bueno', 'Aceptable', 'Reparar'))
      .optional(),
    minPrice: Joi.number().min(0).optional(),
    maxPrice: Joi.number().min(0).optional(),
    location: Joi.object({
      coordinates: Joi.array().items(Joi.number()).length(2),
      radius: Joi.number().min(1).max(500).default(50) // km
    }).optional(),
    sortBy: Joi.string()
      .valid('relevance', 'price_asc', 'price_desc', 'date_desc', 'date_asc', 'eco_impact_desc')
      .default('relevance'),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(20)
  });

  // Esquema para calificaciones
  static rating = Joi.object({
    transactionId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'ID de transacción inválido'
      }),
    score: Joi.number()
      .integer()
      .min(1)
      .max(5)
      .required()
      .messages({
        'number.min': 'La calificación mínima es 1',
        'number.max': 'La calificación máxima es 5'
      }),
    comment: Joi.string()
      .max(300)
      .optional()
  });

  // Esquema para mensajes en transacciones
  static transactionMessage = Joi.object({
    transactionId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'ID de transacción inválido'
      }),
    message: Joi.string()
      .min(1)
      .max(500)
      .required()
      .messages({
        'string.min': 'El mensaje no puede estar vacío',
        'string.max': 'El mensaje no puede exceder 500 caracteres'
      }),
    attachments: Joi.array()
      .items(Joi.string().uri())
      .max(5)
      .optional()
  });

  // Esquema para actualización de perfil
  static profileUpdate = Joi.object({
    username: Joi.string()
      .alphanum()
      .min(3)
      .max(20)
      .optional(),
    profileImage: Joi.string().uri().optional(),
    location: Joi.object({
      coordinates: Joi.array().items(Joi.number()).length(2),
      address: Joi.string().max(200),
      city: Joi.string().max(100),
      province: Joi.string().max(100)
    }).optional(),
    preferences: Joi.object({
      categories: Joi.array()
        .items(Joi.string().max(50)),
      maxDeliveryDistance: Joi.number().min(1).max(200),
      notifications: Joi.object({
        email: Joi.boolean(),
        push: Joi.boolean(),
        sms: Joi.boolean()
      })
    }).optional()
  });

  // Esquema para completar onboarding
  static onboardingUpdate = Joi.object({
    accountType: Joi.string().valid('individual', 'company').required(),
    location: Joi.object({
      city: Joi.string().max(100).allow(''),
      province: Joi.string().max(100).allow(''),
      address: Joi.string().max(200).allow(''),
      coordinates: Joi.array().items(Joi.number()).length(2).optional(),
    }).optional(),
    preferences: Joi.object({
      categories: Joi.array().items(Joi.string().max(50)).max(10).default([]),
      notifications: Joi.object({
        email: Joi.boolean().default(true),
        push: Joi.boolean().default(false),
        sms: Joi.boolean().default(false),
      }).optional(),
    }).optional(),
  });

  // Middleware de validación
  static validateRequest(schema) {
    return (req, res, next) => {
      const { error, value } = schema.validate(req.body, {
        abortEarly: false, // Mostrar todos los errores
        stripUnknown: true // Remover campos no definidos
      });
      
      if (error) {
        const errorDetails = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }));
        
        return res.status(400).json({
          status: 'error',
          message: 'Error de validación',
          errors: errorDetails
        });
      }
      
      // Reemplazar req.body con los valores validados y limpios
      req.body = value;
      next();
    };
  }

  // Middleware de validación para query parameters
  static validateQuery(schema) {
    return (req, res, next) => {
      const { error, value } = schema.validate(req.query, {
        abortEarly: false,
        stripUnknown: true
      });
      
      if (error) {
        const errorDetails = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }));
        
        return res.status(400).json({
          status: 'error',
          message: 'Error de validación en parámetros',
          errors: errorDetails
        });
      }
      
      req.query = value;
      next();
    };
  }
}

module.exports = {
  ValidationSchemas,
  userValidationSchemas: {
    register: ValidationSchemas.userRegister,
    login: ValidationSchemas.userLogin,
    update: ValidationSchemas.profileUpdate,
    onboarding: ValidationSchemas.onboardingUpdate,
  },
  productValidationSchemas: {
    create: ValidationSchemas.productCreate,
    update: ValidationSchemas.productUpdate,
    search: ValidationSchemas.productSearch,
  },
  transactionValidationSchemas: {
    create: ValidationSchemas.transactionCreate,
  },
};
