const { isConnected } = require('../config/database-config');
const { getPrisma } = require('../config/prismaClient');

function ensureDb(res) {
  if (!isConnected()) {
    res.status(503).json({ success: false, message: 'Base de datos no disponible' });
    return false;
  }
  return true;
}

function normalizeMaterialName(materialType) {
  return String(materialType || '').trim();
}

function generateSubmissionCode() {
  return `SUB-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(16).slice(2, 10).toUpperCase()}`;
}

function canMaterial(point, materialType) {
  const accepted = point?.acceptedMaterials;
  if (!Array.isArray(accepted)) return true;
  const mt = normalizeMaterialName(materialType);
  return accepted.some((m) => String(m?.materialType) === mt);
}

function calcRewards(acceptedMaterials, materials) {
  const rates = new Map();
  for (const m of Array.isArray(acceptedMaterials) ? acceptedMaterials : []) {
    if (m?.materialType) rates.set(String(m.materialType), Number(m.rewardPerKg) || 0);
  }

  let totalEcoCoins = 0;
  let actualTotalWeight = 0;

  const items = (Array.isArray(materials) ? materials : []).map((m) => {
    const materialType = normalizeMaterialName(m.materialType);
    const weight = Number(
      m.weight ?? m.estimatedWeight ?? m.actualWeight ?? m.estimatedWeightKg ?? 0
    ) || 0;
    const rewardPerKg = rates.get(materialType) ?? 0;
    const ecoCoins = Math.max(0, weight) * Math.max(0, rewardPerKg);

    totalEcoCoins += ecoCoins;
    actualTotalWeight += Math.max(0, weight);

    return {
      materialType,
      weight,
      rewardPerKg,
      ecoCoins,
      quality: m.quality || 'standard',
      notes: m.notes || '',
    };
  });

  return {
    totalEcoCoins: Math.round(totalEcoCoins),
    actualTotalWeight: Number(actualTotalWeight.toFixed(3)),
    items,
  };
}

async function resolveUserByRecyclingCode(prisma, recyclingCode) {
  const code = String(recyclingCode || '').trim();
  if (!code) return null;
  return prisma.user.findUnique({ where: { recyclingCode: code }, select: { id: true, username: true, email: true, ecoCoins: true, isActive: true } });
}

async function createUniqueSubmissionCode(prisma) {
  let code = generateSubmissionCode();
  for (let i = 0; i < 5; i++) {
    const exists = await prisma.recyclingSubmission
      .findUnique({ where: { submissionCode: code }, select: { id: true } })
      .catch(() => null);
    if (!exists) return code;
    code = generateSubmissionCode();
  }
  return code;
}

function appendTracking(tracking, nextStatus, userId, details) {
  const base = tracking && typeof tracking === 'object' ? tracking : {};
  const history = Array.isArray(base.history) ? base.history : [];
  return {
    ...base,
    currentStatus: String(nextStatus),
    history: [
      ...history,
      {
        status: String(nextStatus),
        at: new Date().toISOString(),
        by: userId ? String(userId) : undefined,
        details: details || undefined,
      },
    ],
  };
}

async function isPointStaff(prisma, pointId, userId) {
  if (!pointId || !userId) return false;
  const pid = String(pointId);
  const uid = String(userId);

  const point = await prisma.recyclingPoint.findUnique({
    where: { id: pid },
    select: { administratorId: true },
  }).catch(() => null);
  if (point?.administratorId && String(point.administratorId) === uid) return true;

  const membership = await prisma.recyclingPointOperator.findUnique({
    where: { pointId_userId: { pointId: pid, userId: uid } },
    select: { id: true },
  }).catch(() => null);
  return Boolean(membership);
}

function getRewardFlags(rewards) {
  const r = rewards && typeof rewards === 'object' ? rewards : {};
  return {
    rewardDistributed: Boolean(r.rewardDistributed),
    distributedEcoCoins: Number(r.distributedEcoCoins ?? r.totalEcoCoins ?? 0) || 0,
  };
}

exports.getAllSubmissions = async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const prisma = getPrisma();
    const { status, recyclingPoint, userId, page = 1, limit = 20 } = req.query || {};

    const where = {};
    if (status) where.verificationStatus = String(status);
    if (recyclingPoint) where.recyclingPointId = String(recyclingPoint);
    if (userId) where.userId = String(userId);

    const take = Math.min(100, Math.max(1, Number(limit) || 20));
    const skip = (Math.max(1, Number(page) || 1) - 1) * take;

    const [total, submissions] = await Promise.all([
      prisma.recyclingSubmission.count({ where }),
      prisma.recyclingSubmission.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          user: { select: { id: true, username: true, email: true, recyclingCode: true } },
          recyclingPoint: { select: { id: true, name: true, city: true } },
        },
      }),
    ]);

    return res.json({
      success: true,
      data: {
        submissions: submissions.map((s) => ({ ...s, _id: s.id })),
        pagination: { total, page: Number(page) || 1, limit: take, pages: Math.ceil(total / take) || 1 },
      },
    });
  } catch (error) {
    console.error('Error en getAllSubmissions:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

exports.getSubmissionById = async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const prisma = getPrisma();
    const submission = await prisma.recyclingSubmission.findUnique({
      where: { id: String(req.params.id) },
      include: {
        user: { select: { id: true, username: true, email: true, recyclingCode: true } },
        recyclingPoint: { select: { id: true, name: true, city: true } },
        verifiedBy: { select: { id: true, username: true, email: true } },
      },
    });

    if (!submission) {
      return res.status(404).json({ success: false, message: 'Entrega no encontrada' });
    }

    return res.json({ success: true, data: { submission: { ...submission, _id: submission.id } } });
  } catch (error) {
    console.error('Error en getSubmissionById:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

// ============== Handlers esperados por el router ==============

exports.createRecyclingSubmission = async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const { recyclingPointId, materials, submissionNotes, submissionDetails } = req.body || {};

    if (!recyclingPointId) {
      return res.status(400).json({ success: false, message: 'recyclingPointId es obligatorio' });
    }

    if (!Array.isArray(materials) || materials.length === 0) {
      return res.status(400).json({ success: false, message: 'materials es obligatorio' });
    }

    const prisma = getPrisma();

    const point = await prisma.recyclingPoint.findUnique({
      where: { id: String(recyclingPointId) },
      select: { id: true, acceptedMaterials: true, status: true },
    });
    if (!point) {
      return res.status(404).json({ success: false, message: 'Punto de reciclaje no encontrado' });
    }

    if (String(point.status) !== 'active') {
      return res.status(400).json({ success: false, message: 'El punto no está activo' });
    }

    const invalid = materials.filter((m) => !canMaterial(point, m.materialType));
    if (invalid.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Materiales no aceptados por este punto: ${invalid.map((m) => m.materialType).join(', ')}`,
      });
    }

    const submissionCode = await createUniqueSubmissionCode(prisma);

    // Normalizar: soportar payloads que envían estimatedWeight
    const normalizedMaterials = (Array.isArray(materials) ? materials : []).map((m) => {
      const w = Number(m.weight ?? m.estimatedWeight ?? m.actualWeight ?? 0) || 0;
      return {
        ...m,
        materialType: normalizeMaterialName(m.materialType),
        estimatedWeight: m.estimatedWeight !== undefined ? m.estimatedWeight : w,
        weight: m.weight !== undefined ? m.weight : w,
      };
    });

    // Estimación simple con los pesos enviados
    const estimated = calcRewards(point.acceptedMaterials, normalizedMaterials);

    const created = await prisma.recyclingSubmission.create({
      data: {
        submissionCode,
        userId: String(req.userId),
        recyclingPointId: String(point.id),
        materials: normalizedMaterials,
        submissionDetails: { ...(submissionDetails || {}), submissionNotes: submissionNotes || '' },
        tracking: appendTracking({ currentStatus: 'submitted', history: [] }, 'submitted', req.userId),
        verificationStatus: 'pending',
      },
      include: {
        user: { select: { id: true, username: true, email: true, recyclingCode: true } },
        recyclingPoint: { select: { id: true, name: true, city: true } },
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Submission creada',
      data: {
        submission: { ...created, _id: created.id },
        submissionCode,
        estimatedReward: estimated.totalEcoCoins,
      },
    });
  } catch (error) {
    console.error('Error en createRecyclingSubmission:', error);
    return res.status(500).json({ success: false, message: 'Error al crear submission', details: error.message });
  }
};

exports.registerDeliveryByOperator = async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const pointId = String(req.params.pointId);
    const { userRecyclingCode, materials, submissionNotes, submissionDetails } = req.body || {};

    if (!userRecyclingCode) {
      return res.status(400).json({ success: false, message: 'Falta userRecyclingCode' });
    }
    if (!Array.isArray(materials) || materials.length === 0) {
      return res.status(400).json({ success: false, message: 'Debe incluir materiales' });
    }

    const prisma = getPrisma();

    const point = req.recyclingPoint && String(req.recyclingPoint.id) === pointId
      ? { id: String(req.recyclingPoint.id), acceptedMaterials: req.recyclingPoint.acceptedMaterials, status: req.recyclingPoint.status }
      : await prisma.recyclingPoint.findUnique({
          where: { id: pointId },
          select: { id: true, acceptedMaterials: true, status: true },
        });
    if (!point) {
      return res.status(404).json({ success: false, message: 'Punto de reciclaje no encontrado' });
    }

    const invalid = materials.filter((m) => !canMaterial(point, m.materialType));
    if (invalid.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Materiales no aceptados por este punto: ${invalid.map((m) => m.materialType).join(', ')}`,
      });
    }

    const user = await resolveUserByRecyclingCode(prisma, userRecyclingCode);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado para ese código' });
    }

    const submissionCode = await createUniqueSubmissionCode(prisma);

    const normalizedMaterials = (Array.isArray(materials) ? materials : []).map((m) => {
      const w = Number(m.weight ?? m.estimatedWeight ?? m.actualWeight ?? 0) || 0;
      return {
        ...m,
        materialType: normalizeMaterialName(m.materialType),
        estimatedWeight: m.estimatedWeight !== undefined ? m.estimatedWeight : w,
        weight: m.weight !== undefined ? m.weight : w,
      };
    });

    // Calcular recompensa en el momento del registro (flujo asistido)
    const rewards = calcRewards(point.acceptedMaterials, normalizedMaterials);

    const created = await prisma.$transaction(async (tx) => {
      const submission = await tx.recyclingSubmission.create({
        data: {
          userId: user.id,
          submissionCode,
          recyclingPointId: String(point.id),
          materials: normalizedMaterials,
          submissionDetails: {
            ...(submissionDetails || {}),
            submissionNotes: submissionNotes || '',
            actualTotalWeight: rewards.actualTotalWeight,
            verifiedMaterials: rewards.items,
          },
          verifiedById: String(req.userId),
          verificationDate: new Date(),
          verificationStatus: rewards.totalEcoCoins > 0 ? 'approved' : 'rejected',
          rewards: {
            totalEcoCoins: rewards.totalEcoCoins,
            breakdown: rewards.items,
            rewardDistributed: rewards.totalEcoCoins > 0,
            distributedEcoCoins: rewards.totalEcoCoins,
            rewardDistributionDate: rewards.totalEcoCoins > 0 ? new Date().toISOString() : null,
          },
          tracking: appendTracking({ currentStatus: 'arrived', history: [] }, 'completed', req.userId, { registeredByOperator: true }),
        },
        include: {
          user: { select: { id: true, username: true, email: true, recyclingCode: true } },
          recyclingPoint: { select: { id: true, name: true, city: true } },
        },
      });

      if (rewards.totalEcoCoins > 0) {
        await tx.user.update({
          where: { id: String(user.id) },
          data: { ecoCoins: { increment: rewards.totalEcoCoins } },
        });
      }

      return submission;
    });

    return res.status(201).json({
      success: true,
      message: 'Entrega registrada exitosamente',
      data: {
        submission: { ...created, _id: created.id },
        submissionCode,
        user: { id: user.id, username: user.username, recyclingCode: user.recyclingCode },
        ecoCoinsAwarded: Number(created.rewards?.totalEcoCoins) || rewards.totalEcoCoins,
      },
    });
  } catch (error) {
    console.error('Error en registerDeliveryByOperator:', error);
    return res.status(500).json({ success: false, message: 'Error al registrar entrega', details: error.message });
  }
};

exports.verifySubmission = async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const submissionId = String(req.params.submissionId || req.params.id);
    const { verificationStatus, actualWeights, verificationNotes, verifiedMaterials } = req.body || {};

    const prisma = getPrisma();

    const submission = await prisma.recyclingSubmission.findUnique({
      where: { id: submissionId },
      include: {
        recyclingPoint: { select: { id: true, acceptedMaterials: true, administratorId: true } },
        user: { select: { id: true, ecoCoins: true } },
      },
    });

    if (!submission) {
      return res.status(404).json({ success: false, message: 'Entrega no encontrada' });
    }

    // Permiso: admin del punto o operador asignado al punto
    const staff = await isPointStaff(prisma, submission.recyclingPointId, req.userId);
    if (!staff) {
      return res.status(403).json({ success: false, message: 'Solo el staff del punto (admin u operador) puede verificar' });
    }

    let usedMaterials = null;
    if (Array.isArray(verifiedMaterials) && verifiedMaterials.length > 0) {
      usedMaterials = verifiedMaterials;
    } else if (Array.isArray(actualWeights) && Array.isArray(submission.materials)) {
      usedMaterials = submission.materials.map((m, idx) => ({
        materialType: m.materialType,
        weight: actualWeights[idx] !== undefined ? Number(actualWeights[idx]) : Number(m.weight),
      }));
    } else if (Array.isArray(submission.materials)) {
      usedMaterials = submission.materials;
    }

    if (!Array.isArray(usedMaterials) || usedMaterials.length === 0) {
      return res.status(400).json({ success: false, message: 'No hay materiales para verificar' });
    }

    const rewards = calcRewards(submission.recyclingPoint.acceptedMaterials, usedMaterials);

    const allowed = new Set(['pending', 'approved', 'partially_approved', 'rejected']);
    const desired = verificationStatus ? String(verificationStatus) : null;
    const status = desired && allowed.has(desired) ? desired : rewards.totalEcoCoins > 0 ? 'approved' : 'rejected';

    const updated = await prisma.$transaction(async (tx) => {
      const newSubmission = await tx.recyclingSubmission.update({
        where: { id: submissionId },
        data: {
          verifiedById: String(req.userId),
          verificationDate: new Date(),
          verificationStatus: status,
          verificationNotes: verificationNotes || '',
          submissionDetails: { ...(submission.submissionDetails || {}), actualTotalWeight: rewards.actualTotalWeight, verifiedMaterials: rewards.items },
          rewards: { totalEcoCoins: rewards.totalEcoCoins, breakdown: rewards.items },
          tracking: {
            ...appendTracking(submission.tracking, 'verified', req.userId),
          },
        },
        include: {
          user: { select: { id: true, username: true, email: true, recyclingCode: true, ecoCoins: true } },
          recyclingPoint: { select: { id: true, name: true, city: true } },
          verifiedBy: { select: { id: true, username: true, email: true } },
        },
      });

      // Evitar doble distribución si la entrega ya acreditó ecoCoins.
      const flags = getRewardFlags(submission.rewards);
      const shouldDistribute = (status === 'approved' || status === 'partially_approved')
        && rewards.totalEcoCoins > 0
        && flags.rewardDistributed !== true;

      if (shouldDistribute) {
        await tx.user.update({ where: { id: submission.userId }, data: { ecoCoins: { increment: rewards.totalEcoCoins } } });
        await tx.recyclingSubmission.update({
          where: { id: submissionId },
          data: {
            rewards: {
              totalEcoCoins: rewards.totalEcoCoins,
              breakdown: rewards.items,
              rewardDistributed: true,
              distributedEcoCoins: rewards.totalEcoCoins,
              rewardDistributionDate: new Date().toISOString(),
            },
          },
        });
      }

      return newSubmission;
    });

    return res.json({ success: true, message: 'Entrega verificada', data: { submission: { ...updated, _id: updated.id } } });
  } catch (error) {
    console.error('Error en verifySubmission:', error);
    return res.status(500).json({ success: false, message: 'Error al verificar entrega', details: error.message });
  }
};

exports.getUserRecyclingStats = async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const prisma = getPrisma();
    const subs = await prisma.recyclingSubmission.findMany({
      where: { userId: String(req.userId), verificationStatus: { in: ['approved', 'partially_approved'] } },
      select: { rewards: true, submissionDetails: true },
    });

    const totalEcoCoinsEarned = subs.reduce((sum, s) => sum + (Number(s.rewards?.totalEcoCoins) || 0), 0);
    const totalKgRecycled = subs.reduce((sum, s) => sum + (Number(s.submissionDetails?.actualTotalWeight) || 0), 0);

    return res.json({
      success: true,
      data: {
        stats: {
          totalSubmissions: subs.length,
          totalEcoCoinsEarned,
          totalKgRecycled,
          totalCO2Saved: 0,
          totalEnergySaved: 0,
          totalWaterSaved: 0,
          treesEquivalent: 0,
        },
        materialBreakdown: [],
        impactMetrics: {},
      },
    });
  } catch (error) {
    console.error('Error en getUserRecyclingStats:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

exports.cancelSubmission = async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const { submissionId } = req.params;
    const prisma = getPrisma();

    const submission = await prisma.recyclingSubmission.findUnique({
      where: { id: String(submissionId) },
      select: { id: true, userId: true, verificationStatus: true, tracking: true },
    });

    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission no encontrada' });
    }

    if (String(submission.userId) !== String(req.userId)) {
      return res.status(403).json({ success: false, message: 'No autorizado' });
    }

    if (String(submission.verificationStatus) !== 'pending') {
      return res.status(400).json({ success: false, message: 'Solo se puede cancelar una submission pendiente' });
    }

    const updated = await prisma.recyclingSubmission.update({
      where: { id: String(submissionId) },
      data: {
        tracking: appendTracking(submission.tracking, 'cancelled', req.userId),
        verificationStatus: 'rejected',
        verificationNotes: 'Cancelada por el usuario',
      },
    });

    return res.json({ success: true, message: 'Submission cancelada', data: { submission: { ...updated, _id: updated.id } } });
  } catch (error) {
    console.error('Error en cancelSubmission:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

exports.getSubmissionByCode = async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const { code } = req.params;
    const prisma = getPrisma();
    const submission = await prisma.recyclingSubmission.findUnique({
      where: { submissionCode: String(code) },
      include: {
        user: { select: { id: true, username: true, email: true, recyclingCode: true } },
        recyclingPoint: { select: { id: true, name: true, city: true } },
      },
    });
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission no encontrada' });
    }
    return res.json({ success: true, data: { submission: { ...submission, _id: submission.id } } });
  } catch (error) {
    console.error('Error en getSubmissionByCode:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

exports.updateSubmissionStatus = async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const { submissionId } = req.params;
    const { status, notes } = req.body || {};
    if (!status) {
      return res.status(400).json({ success: false, message: 'status es obligatorio' });
    }

    const prisma = getPrisma();
    const submission = await prisma.recyclingSubmission.findUnique({
      where: { id: String(submissionId) },
      select: { id: true, tracking: true, recyclingPointId: true },
    });
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission no encontrada' });
    }

    const staff = await isPointStaff(prisma, submission.recyclingPointId || submission.recyclingPoint?.id, req.userId);
    if (!staff) {
      return res.status(403).json({ success: false, message: 'Solo el staff del punto (admin u operador) puede realizar esta acción' });
    }

    const updated = await prisma.recyclingSubmission.update({
      where: { id: String(submissionId) },
      data: { tracking: appendTracking(submission.tracking, status, req.userId, notes ? { notes } : undefined) },
    });

    return res.json({ success: true, message: 'Status actualizado', data: { submission: { ...updated, _id: updated.id } } });
  } catch (error) {
    console.error('Error en updateSubmissionStatus:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

exports.getPendingSubmissions = async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const { recyclingPointId, status = 'pending', limit = 50 } = req.query || {};
    if (!recyclingPointId) {
      return res.status(400).json({ success: false, message: 'recyclingPointId es obligatorio' });
    }

    const prisma = getPrisma();
    const point = await prisma.recyclingPoint.findUnique({
      where: { id: String(recyclingPointId) },
      select: { id: true, administratorId: true },
    });
    if (!point) {
      return res.status(404).json({ success: false, message: 'Punto de reciclaje no encontrado' });
    }

    const staff = await isPointStaff(prisma, point.id, req.userId);
    if (!staff) {
      return res.status(403).json({ success: false, message: 'Solo el staff del punto (admin u operador) puede revisar pendientes' });
    }

    const take = Math.min(200, Math.max(1, Number(limit) || 50));
    const subs = await prisma.recyclingSubmission.findMany({
      where: { recyclingPointId: String(recyclingPointId), verificationStatus: String(status) },
      orderBy: { createdAt: 'desc' },
      take,
      include: {
        user: { select: { id: true, username: true, email: true, recyclingCode: true } },
        recyclingPoint: { select: { id: true, name: true, address: true, city: true } },
      },
    });

    return res.json({ success: true, data: { submissions: subs.map((s) => ({ ...s, _id: s.id })), total: subs.length, statusFilter: String(status) } });
  } catch (error) {
    console.error('Error en getPendingSubmissions:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

// Alias internos (útiles para debug / expansión futura)
exports.createSubmission = exports.createRecyclingSubmission;

exports.updateTracking = async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const submissionId = String(req.params.id);
    const { status, details } = req.body || {};

    if (!status) {
      return res.status(400).json({ success: false, message: 'status es obligatorio' });
    }

    const prisma = getPrisma();
    const submission = await prisma.recyclingSubmission.findUnique({ where: { id: submissionId }, select: { id: true, tracking: true } });
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Entrega no encontrada' });
    }

    const tracking = submission.tracking || {};
    const history = Array.isArray(tracking.history) ? tracking.history : [];

    const updated = await prisma.recyclingSubmission.update({
      where: { id: submissionId },
      data: {
        tracking: {
          ...tracking,
          currentStatus: String(status),
          history: [...history, { status: String(status), at: new Date().toISOString(), by: String(req.userId), details: details || undefined }],
        },
      },
    });

    return res.json({ success: true, message: 'Tracking actualizado', data: { tracking: updated.tracking } });
  } catch (error) {
    console.error('Error en updateTracking:', error);
    return res.status(500).json({ success: false, message: 'Error al actualizar tracking' });
  }
};

exports.getUserSubmissions = async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const prisma = getPrisma();
    const subs = await prisma.recyclingSubmission.findMany({
      where: { userId: String(req.userId) },
      orderBy: { createdAt: 'desc' },
      include: { recyclingPoint: { select: { id: true, name: true, city: true } } },
      take: 50,
    });

    return res.json({ success: true, data: { submissions: subs.map((s) => ({ ...s, _id: s.id })) } });
  } catch (error) {
    console.error('Error en getUserSubmissions:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

exports.getRecyclingStats = async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const prisma = getPrisma();
    const subs = await prisma.recyclingSubmission.findMany({ select: { verificationStatus: true, rewards: true, submissionDetails: true } });

    const approved = subs.filter((s) => ['approved', 'partially_approved'].includes(String(s.verificationStatus)));
    const totalEcoCoins = approved.reduce((sum, s) => sum + (Number(s.rewards?.totalEcoCoins) || 0), 0);
    const totalKg = approved.reduce((sum, s) => sum + (Number(s.submissionDetails?.actualTotalWeight) || 0), 0);

    return res.json({
      success: true,
      data: {
        stats: {
          totalSubmissions: subs.length,
          approvedSubmissions: approved.length,
          totalEcoCoins,
          totalKg,
        },
      },
    });
  } catch (error) {
    console.error('Error en getRecyclingStats:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};
