const { isConnected } = require('../config/database-config');
const { getPrisma } = require('../config/prismaClient');

function loadRecyclingPoint(paramKey = 'id') {
  return async (req, res, next) => {
    try {
      if (!isConnected()) {
        return res.status(503).json({ success: false, message: 'Base de datos no disponible' });
      }

      const pointId = req.params[paramKey];
      if (!pointId) {
        return res.status(400).json({
          success: false,
          message: 'Falta el id del punto de reciclaje'
        });
      }

      const prisma = getPrisma();
      const point = await prisma.recyclingPoint.findUnique({
        where: { id: String(pointId) },
        include: {
          operators: { select: { userId: true } },
        },
      });
      if (!point) {
        return res.status(404).json({
          success: false,
          message: 'Punto de reciclaje no encontrado'
        });
      }

      req.recyclingPoint = {
        ...point,
        _id: point.id,
        operatorIds: Array.isArray(point.operators) ? point.operators.map((o) => o.userId) : [],
      };
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error cargando punto de reciclaje'
      });
    }
  };
}

function resolvePointRole(userId, point) {
  if (!userId || !point) return 'none';
  const uid = String(userId);

  if (point.administratorId && String(point.administratorId) === uid) {
    return 'admin';
  }

  const operators = Array.isArray(point.operatorIds) ? point.operatorIds : [];
  if (operators.some((opId) => String(opId) === uid)) {
    return 'operator';
  }

  return 'none';
}

function requirePointOperatorOrAdmin() {
  return (req, res, next) => {
    const point = req.recyclingPoint;
    const role = resolvePointRole(req.userId, point);
    req.pointRole = role;

    if (role === 'admin' || role === 'operator') return next();

    return res.status(403).json({
      success: false,
      message: 'No tienes permisos para operar en este punto'
    });
  };
}

function requirePointOperator() {
  return (req, res, next) => {
    const point = req.recyclingPoint;
    const role = resolvePointRole(req.userId, point);
    req.pointRole = role;

    if (role === 'operator') return next();

    return res.status(403).json({
      success: false,
      message: 'Solo un operador asignado puede registrar entregas en este punto'
    });
  };
}

function requirePointAdmin() {
  return (req, res, next) => {
    const point = req.recyclingPoint;
    const role = resolvePointRole(req.userId, point);
    req.pointRole = role;

    if (role === 'admin') return next();

    return res.status(403).json({
      success: false,
      message: 'Solo el administrador del punto puede realizar esta acción'
    });
  };
}

module.exports = {
  loadRecyclingPoint,
  requirePointOperatorOrAdmin,
  requirePointOperator,
  requirePointAdmin,
  resolvePointRole
};
