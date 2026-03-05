const { store } = require('../utils/demoStore');

function normalizeAcceptedMaterials(acceptedMaterials) {
  const defaults = [
    { materialType: 'Plástico PET', rewardPerKg: 2 },
    { materialType: 'Cartón', rewardPerKg: 1 },
    { materialType: 'Vidrio Transparente', rewardPerKg: 1 },
  ];

  const maxRewardPerKg = Math.max(0, Number(process.env.RECYCLING_MAX_REWARD_PER_KG) || 50);
  const list = Array.isArray(acceptedMaterials) && acceptedMaterials.length > 0 ? acceptedMaterials : defaults;

  const normalized = list.map((m) => {
    const materialType = String(m?.materialType || '').trim();
    const rewardPerKg = Number(m?.rewardPerKg);
    if (!materialType) return null;
    if (!Number.isFinite(rewardPerKg) || rewardPerKg < 0 || rewardPerKg > maxRewardPerKg) return null;
    return { materialType, rewardPerKg };
  });

  if (normalized.some((x) => x === null)) {
    const err = new Error(`acceptedMaterials inválido: rewardPerKg debe estar entre 0 y ${maxRewardPerKg}`);
    err.code = 'INVALID_ACCEPTED_MATERIALS';
    throw err;
  }

  return normalized;
}

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
  try {
    const userRoles = Array.isArray(req.user?.roles) ? req.user.roles : [];
    const isAdmin = userRoles.includes('admin');
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Solo un administrador puede crear puntos de reciclaje'
      });
    }

    const { name, address, city, state, acceptedMaterials, status } = req.body || {};

    const point = store.createPoint({
      administratorId: req.userId,
      name,
      address,
      city,
      state,
      status: status || 'active',
      acceptedMaterials: normalizeAcceptedMaterials(acceptedMaterials),
    });

    return res.status(201).json({ success: true, message: 'Punto de reciclaje creado (modo demo)', data: { recyclingPoint: point } });
  } catch (error) {
    if (error?.code === 'INVALID_ACCEPTED_MATERIALS') {
      return res.status(400).json({ success: false, message: error.message });
    }
    console.error('Error en createRecyclingPoint (DEMO):', error);
    return res.status(500).json({ success: false, message: 'Error al crear punto de reciclaje', details: error.message });
  }
};

exports.updateRecyclingPoint = async (req, res) => {
  try {
    const point = req.recyclingPoint;
    const updates = req.body || {};
    const next = { ...point, ...updates };

    if (Object.prototype.hasOwnProperty.call(updates, 'acceptedMaterials')) {
      next.acceptedMaterials = normalizeAcceptedMaterials(updates.acceptedMaterials);
    }

    store.pointsById.set(String(point._id), next);
    return res.json({ success: true, message: 'Punto actualizado (modo demo)', data: { recyclingPoint: next } });
  } catch (error) {
    if (error?.code === 'INVALID_ACCEPTED_MATERIALS') {
      return res.status(400).json({ success: false, message: error.message });
    }
    console.error('Error en updateRecyclingPoint (DEMO):', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
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
  const { username, email, password, userId } = req.body || {};

  const normalizedEmail = email ? String(email).toLowerCase().trim() : '';
  const normalizedUserId = userId ? String(userId).trim() : '';

  let operator = null;
  if (normalizedUserId) {
    operator = store.usersById.get(normalizedUserId) || null;
  } else if (normalizedEmail) {
    operator = store.usersByEmail.get(normalizedEmail) || null;
  }

  const isExisting = Boolean(operator);
  if (!operator) {
    if (!username || !normalizedEmail) {
      return res.status(400).json({ success: false, message: 'Faltan datos obligatorios: username, email' });
    }
    operator = store.ensureUser({ email: normalizedEmail, username, country: 'MX' });
  }

  const generatedPassword = isExisting ? undefined : (password ? undefined : 'demoPass1234');

  const operatorId = String(operator.id);
  const current = Array.isArray(point.operators) ? point.operators : [];
  if (!current.some((id) => String(id) === operatorId)) {
    point.operators = [...current, operatorId];
    store.pointsById.set(String(point._id), point);
  }

  return res.status(isExisting ? 200 : 201).json({
    success: true,
    message: isExisting ? 'Operador asignado al punto (modo demo)' : 'Operador creado y asignado al punto (modo demo)',
    data: { operator, generatedPassword },
  });
};

exports.setOperatorStatus = async (req, res) => {
  const point = req.recyclingPoint;
  const { operatorUserId } = req.params;
  const { isActive } = req.body || {};

  if (typeof isActive !== 'boolean') {
    return res.status(400).json({ success: false, message: 'isActive debe ser boolean' });
  }

  const current = Array.isArray(point.operators) ? point.operators : [];
  if (!current.some((id) => String(id) === String(operatorUserId))) {
    return res.status(404).json({ success: false, message: 'El usuario no es operador de este punto' });
  }

  const u = store.usersById.get(String(operatorUserId));
  if (u) {
    u.isActive = isActive;
    store.usersById.set(String(operatorUserId), u);
  }

  return res.json({
    success: true,
    message: isActive ? 'Operador activado (modo demo)' : 'Operador desactivado (modo demo)',
    data: { operator: u || { id: operatorUserId, isActive } },
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
