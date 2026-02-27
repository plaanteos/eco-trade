const jwt = require('jsonwebtoken');

/**
 * Middleware de autenticación simplificado para demo
 */
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Token de acceso requerido',
        code: 'NO_TOKEN'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
    
    // Simulación sin base de datos
    req.userId = decoded.userId;
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      username: decoded.username || 'demo_user'
    };
    
    next();
  } catch (error) {
    console.error('Error en autenticación:', error);
    return res.status(401).json({ 
      success: false,
      message: 'Token inválido',
      code: 'INVALID_TOKEN'
    });
  }
};

/**
 * Middleware de autorización simplificado
 */
const authorize = (roles = []) => {
  return (req, res, next) => {
    // En modo demo, permitir todo
    next();
  };
};

/**
 * Middleware de autenticación opcional simplificado
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
      req.userId = decoded.userId;
      req.user = {
        id: decoded.userId,
        email: decoded.email,
        username: decoded.username || 'demo_user'
      };
    }
    
    next();
  } catch (error) {
    // En autenticación opcional, continúa sin usuario autenticado
    next();
  }
};

module.exports = {
  authenticate,
  authorize,
  optionalAuth
};