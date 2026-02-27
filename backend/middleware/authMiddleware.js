const jwt = require('jsonwebtoken');
const { getPrisma } = require('../config/prismaClient');

function requireJwtSecret() {
  const secret = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? undefined : 'default_secret');
  if (!secret) {
    const err = new Error('JWT_SECRET no está configurado');
    err.code = 'MISSING_JWT_SECRET';
    throw err;
  }
  return secret;
}

/**
 * Middleware de autenticación principal
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

    const decoded = jwt.verify(token, requireJwtSecret());

    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { id: String(decoded.userId) },
      select: {
        id: true,
        username: true,
        email: true,
        accountType: true,
        country: true,
        recyclingCode: true,
        profileImage: true,
        ecoCoins: true,
        sustainabilityScore: true,
        totalTransactions: true,
        roles: true,
        isActive: true,
        isVerified: true,
        location: true,
        preferences: true,
        createdAt: true,
      },
    });
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Usuario no encontrado',
        code: 'USER_NOT_FOUND'
      });
    }

    // Verificar si la cuenta está activa (si el campo existe)
    if (user.isActive === false) {
      return res.status(403).json({ 
        success: false,
        message: 'Cuenta desactivada',
        code: 'ACCOUNT_INACTIVE'
      });
    }

    // Normalizar para consumo consistente en controladores
    req.user = user;
    req.userId = user.id;
    req.user.id = user.id;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: 'Token inválido',
        code: 'INVALID_TOKEN'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: 'Token expirado',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    if (error.code === 'MISSING_JWT_SECRET') {
      return res.status(500).json({
        success: false,
        message: 'Configuración inválida del servidor: JWT_SECRET faltante',
        code: 'MISSING_JWT_SECRET'
      });
    }

    res.status(500).json({ 
      success: false,
      message: 'Error de autenticación',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Middleware para verificar roles específicos
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'Usuario no autenticado',
        code: 'NOT_AUTHENTICATED'
      });
    }

    const userRoles = Array.isArray(req.user.roles)
      ? req.user.roles
      : (req.user.role ? [req.user.role] : []);

    const hasAnyRequiredRole = roles.length === 0
      ? true
      : roles.some((role) => userRoles.includes(role));

    if (!hasAnyRequiredRole) {
      return res.status(403).json({ 
        success: false,
        message: `Acceso denegado. Roles requeridos: ${roles.join(', ')}`,
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  };
};

/**
 * Middleware opcional de autenticación (no falla si no hay token)
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (token) {
      const decoded = jwt.verify(token, requireJwtSecret());
      const prisma = getPrisma();
      const user = await prisma.user.findUnique({
        where: { id: String(decoded.userId) },
        select: {
          id: true,
          username: true,
          email: true,
          accountType: true,
          country: true,
          recyclingCode: true,
          profileImage: true,
          ecoCoins: true,
          sustainabilityScore: true,
          totalTransactions: true,
          roles: true,
          isActive: true,
          isVerified: true,
          location: true,
          preferences: true,
          createdAt: true,
        },
      });
      
      if (user && user.isActive !== false) {
        req.user = user;
        req.userId = user.id;
        req.user.id = user.id;
      }
    }
  } catch (error) {
    // Silenciosamente ignorar errores en auth opcional
  }
  
  next();
};

module.exports = {
  authenticate,
  authorize,
  optionalAuth
};