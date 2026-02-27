const { store } = require('../utils/demoStore');

exports.getAllRecyclingPoints = async (req, res) => {
  const { status } = req.query || {};
  const points = store.listPoints().filter((p) => (status ? p.status === status : true));
  return res.json({ success: true, data: { recyclingPoints: points, total: points.length } });
};

exports.findNearbyRecyclingPoints = async (req, res) => {
  // Demo: sin geocálculo real.
  const points = store.listPoints();
  return res.json({ success: true, data: { recyclingPoints: points, total: points.length } });
};

exports.getRecyclingPointById = async (req, res) => {
  const point = store.getPoint(req.params.id);
  if (!point) {
    return res.status(404).json({ success: false, message: 'Punto de reciclaje no encontrado' });
  }
  return res.json({ success: true, data: { recyclingPoint: point } });
};

exports.getAcceptedMaterials = async (req, res) => {
  const point = store.getPoint(req.params.id);
  if (!point) {
    return res.status(404).json({ success: false, message: 'Punto de reciclaje no encontrado' });
  }
  return res.json({ success: true, data: { acceptedMaterials: point.acceptedMaterials || [] } });
};

exports.getRecyclingPointStats = async (req, res) => {
  const point = store.getPoint(req.params.id);
  if (!point) {
    return res.status(404).json({ success: false, message: 'Punto de reciclaje no encontrado' });
  }

  const subs = store.listSubmissionsByPoint(point._id);
  const approved = subs.filter((s) => ['approved', 'partially_approved'].includes(s.verification?.status));

  const totalEcoCoins = approved.reduce((sum, s) => sum + (Number(s.rewards?.totalEcoCoins) || 0), 0);
  const totalKg = approved.reduce((sum, s) => sum + (Number(s.submissionDetails?.actualTotalWeight) || 0), 0);

  return res.json({
    success: true,
    data: {
      stats: {
        totalEcoCoins,
        totalKg,
        totalSubmissions: subs.length,
        approvedSubmissions: approved.length,
      },
    },
  });
};

exports.createRecyclingPoint = async (req, res) => {
  const { name, address, city, state, acceptedMaterials, status } = req.body || {};

  const point = store.createPoint({
    administratorId: req.userId,
    name,
    address,
    city,
    state,
    status: status || 'active',
    acceptedMaterials,
  });

  return res.status(201).json({ success: true, message: 'Punto de reciclaje creado (modo demo)', data: { recyclingPoint: point } });
};

exports.updateRecyclingPoint = async (req, res) => {
  const point = req.recyclingPoint;
  const updates = req.body || {};
  const next = { ...point, ...updates };
  store.pointsById.set(String(point._id), next);
  return res.json({ success: true, message: 'Punto actualizado (modo demo)', data: { recyclingPoint: next } });
};

exports.deleteRecyclingPoint = async (req, res) => {
  const pointId = String(req.params.id);
  const existed = store.pointsById.delete(pointId);
  if (!existed) {
    return res.status(404).json({ success: false, message: 'Punto de reciclaje no encontrado' });
  }
  return res.json({ success: true, message: 'Punto eliminado (modo demo)' });
};

exports.listPointOperators = async (req, res) => {
  const point = req.recyclingPoint;
  const ops = (point.operators || []).map((id) => store.usersById.get(String(id))).filter(Boolean);
  return res.json({ success: true, data: { operators: ops, total: ops.length } });
};

exports.createPointOperator = async (req, res) => {
  const point = req.recyclingPoint;
  const { username, email, password } = req.body || {};

  if (!username || !email || !password) {
    return res.status(400).json({ success: false, message: 'Faltan datos obligatorios: username, email, password' });
  }

  const operator = store.ensureUser({ email, username, country: 'MX' });

  const operatorId = String(operator.id);
  const current = Array.isArray(point.operators) ? point.operators : [];
  if (!current.some((id) => String(id) === operatorId)) {
    point.operators = [...current, operatorId];
    store.pointsById.set(String(point._id), point);
  }

  return res.status(201).json({
    success: true,
    message: 'Operador creado y asignado al punto (modo demo)',
    data: { operator },
  });
};

exports.removePointOperator = async (req, res) => {
  const point = req.recyclingPoint;
  const { operatorUserId } = req.params;
  const current = Array.isArray(point.operators) ? point.operators : [];
  point.operators = current.filter((id) => String(id) !== String(operatorUserId));
  store.pointsById.set(String(point._id), point);
  return res.json({ success: true, message: 'Operador removido (modo demo)' });
};

exports.getPointDashboard = async (req, res) => {
  const point = req.recyclingPoint;
  const subs = store.listSubmissionsByPoint(point._id);

  const statusCounts = subs.reduce((acc, s) => {
    const st = s.verification?.status || 'pending';
    acc[st] = (acc[st] || 0) + 1;
    return acc;
  }, {});

  const approved = subs.filter((s) => ['approved', 'partially_approved'].includes(s.verification?.status));
  const totals = {
    totalSubmissions: approved.length,
    totalEcoCoins: approved.reduce((sum, s) => sum + (Number(s.rewards?.totalEcoCoins) || 0), 0),
    totalKg: approved.reduce((sum, s) => sum + (Number(s.submissionDetails?.actualTotalWeight) || 0), 0),
  };

  const recent = subs
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 20)
    .map((s) => {
      const u = store.usersById.get(String(s.user));
      return {
        ...s,
        user: u ? { id: u.id, username: u.username, email: u.email, recyclingCode: u.recyclingCode } : s.user,
      };
    });

  return res.json({
    success: true,
    data: {
      point: { id: point._id, name: point.name, city: point.city, status: point.status },
      statusCounts,
      totals,
      recentSubmissions: recent,
    },
  });
};

exports.getPointDeliveryStats = async (req, res) => {
  const point = req.recyclingPoint;
  const subs = store.listSubmissionsByPoint(point._id);
  const stats = subs.reduce((acc, s) => {
    const st = s.tracking?.currentStatus || 'submitted';
    const row = acc.get(st) || { _id: st, count: 0, ecoCoins: 0, kg: 0 };
    row.count += 1;
    row.ecoCoins += Number(s.rewards?.totalEcoCoins) || 0;
    row.kg += Number(s.submissionDetails?.actualTotalWeight) || 0;
    acc.set(st, row);
    return acc;
  }, new Map());

  return res.json({ success: true, data: { stats: Array.from(stats.values()) } });
};
