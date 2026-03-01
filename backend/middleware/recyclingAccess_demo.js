const { store } = require('../utils/demoStore');

const isDemoMode = String(process.env.DEMO_MODE || '').toLowerCase() === 'true';
if (!isDemoMode) {
  throw new Error('recyclingAccess_demo.js cargado con DEMO_MODE=false. Esto no debe ocurrir fuera de DEMO_MODE.');
}

function loadRecyclingPoint(paramKey = 'id') {
  return (req, res, next) => {
    const pointId = req.params[paramKey];
    if (!pointId) {
      return res.status(400).json({ success: false, message: 'Falta el id del punto de reciclaje' });
    }

    const point = store.getPoint(pointId);
    if (!point) {
      return res.status(404).json({ success: false, message: 'Punto de reciclaje no encontrado' });
    }

    req.recyclingPoint = point;
    next();
  };
}

function resolvePointRole(userId, point) {
  if (!userId || !point) return 'none';
  const uid = String(userId);
  if (String(point.administrator) === uid) return 'admin';
  const ops = Array.isArray(point.operators) ? point.operators : [];
  if (ops.some((id) => String(id) === uid)) return 'operator';
  return 'none';
}

function requirePointAdmin() {
  return (req, res, next) => {
    const role = resolvePointRole(req.userId, req.recyclingPoint);
    req.pointRole = role;
    if (role === 'admin') return next();
    return res.status(403).json({ success: false, message: 'Solo el administrador del punto puede realizar esta acción' });
  };
}

function requirePointOperatorOrAdmin() {
  return (req, res, next) => {
    const role = resolvePointRole(req.userId, req.recyclingPoint);
    req.pointRole = role;
    if (role === 'admin' || role === 'operator') return next();
    return res.status(403).json({ success: false, message: 'No tienes permisos para operar en este punto' });
  };
}

function requirePointOperator() {
  return (req, res, next) => {
    const role = resolvePointRole(req.userId, req.recyclingPoint);
    req.pointRole = role;
    if (role === 'operator') return next();
    return res.status(403).json({ success: false, message: 'Solo un operador asignado puede registrar entregas en este punto' });
  };
}

module.exports = {
  loadRecyclingPoint,
  resolvePointRole,
  requirePointAdmin,
  requirePointOperatorOrAdmin,
  requirePointOperator,
};
