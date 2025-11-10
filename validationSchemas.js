// backend/utils/validationSchemas.js
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
        'string.pattern.base': 'Contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial'
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
      .min(0)
      .required()
      .messages({
        'number.positive': 'El precio debe ser un número positivo',
        'number.min': 'El precio no puede ser negativo'
      }),
    category: Joi.string()
      .valid('Electrónica', 'Muebles', 'Ropa', 'Herramientas', 'Libros', 'Deportes', 'Otros')
      .required(),
    condition: Joi.string()
      .valid('Nuevo', 'Como nuevo', 'Bueno', 'Aceptable')
      .required()
  });

  // Middleware de validación
  static validateRequest(schema) {
    return (req, res, next) => {
      const { error } = schema.validate(req.body);
      
      if (error) {
        return res.status(400).json({
          message: 'Error de validación',
          details: error.details.map(detail => detail.message)
        });
      }
      
      next();
    };
  }
}

module.exports = ValidationSchemas;