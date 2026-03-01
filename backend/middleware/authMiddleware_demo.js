const jwt = require('jsonwebtoken');

const isDemoMode = String(process.env.DEMO_MODE || '').toLowerCase() === 'true';
if (!isDemoMode) {
  throw new Error('authMiddleware_demo.js cargado con DEMO_MODE=false. Esto no debe ocurrir fuera de DEMO_MODE.');
}

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
      username: decoded.username || 'demo_user',
      roles: Array.isArray(decoded.roles) ? decoded.roles : []
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
        username: decoded.username || 'demo_user',
        roles: Array.isArray(decoded.roles) ? decoded.roles : []
      };
    }
    
    next();
  } catch (error) {
    // En autenticación opcional, continúa sin usuario autenticado
    next();
  }
};

/**
 * Middleware RBAC por permiso (demo): no restringe.
 * En DEMO_MODE la seguridad real la aplican los controllers/mocks de test.
 */
const requirePermission = (_permission) => {
  return (_req, _res, next) => next();
};

module.exports = {
  authenticate,
  authorize,
  optionalAuth,
  requirePermission,
};