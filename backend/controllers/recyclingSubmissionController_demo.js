const { store } = require('../utils/demoStore');
const { computeTrustScoreForRecyclingSubmission } = require('../utils/trustScore');
const { buildRecyclingEvidencePayload, computeEvidenceHash } = require('../utils/evidenceHash');
const { calculateCO2AvoidedKg } = require('../utils/recyclingCO2');
const { deriveDeterministicOperatorId } = require('../utils/operatorId');

function envBool(name, fallback = false) {
  const v = String(process.env[name] ?? '').trim().toLowerCase();
  if (!v) return Boolean(fallback);
  return v === '1' || v === 'true' || v === 'yes' || v === 'on';
}

function fakeSolanaSignature(evidenceHash) {
  const h = String(evidenceHash || '').slice(0, 32);
  return `DEMO_SOL_${h || Date.now().toString(16)}`;
}

function canMaterial(point, materialType) {
  const accepted = point?.acceptedMaterials || [];
  return accepted.some((m) => m.materialType === materialType);
}

exports.createRecyclingSubmission = async (req, res) => {
  const { recyclingPointId, materials, submissionNotes } = req.body || {};

  if (!recyclingPointId || !Array.isArray(materials) || materials.length === 0) {
    return res.status(400).json({ success: false, message: 'Faltan datos obligatorios: punto de reciclaje y materiales' });
  }

  const point = store.getPoint(recyclingPointId);
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

  const submission = store.createSubmission({
    userId: req.userId,
    pointId: recyclingPointId,
    materials,
    trackingStatus: 'submitted',
    notes: submissionNotes,
  });

  return res.status(201).json({
    success: true,
    message: 'Submission creada (modo demo)',
    data: {
      submission,
      submissionCode: submission.submissionCode,
      estimatedReward: submission.rewards.estimatedEcoCoins,
    },
  });
};

exports.registerDeliveryByOperator = async (req, res) => {
  const pointId = req.params.pointId;
  const { userRecyclingCode, materials, submissionNotes } = req.body || {};

  if (!userRecyclingCode) {
    return res.status(400).json({ success: false, message: 'Falta userRecyclingCode' });
  }
  if (!Array.isArray(materials) || materials.length === 0) {
    return res.status(400).json({ success: false, message: 'Debe incluir materiales' });
  }

  const point = store.getPoint(pointId);
  if (!point) {
    return res.status(404).json({ success: false, message: 'Punto de reciclaje no encontrado' });
  }

  const user = Array.from(store.usersById.values()).find((u) => String(u.recyclingCode) === String(userRecyclingCode).trim());
  if (!user) {
    return res.status(404).json({ success: false, message: 'Usuario no encontrado para ese código' });
  }

  const invalid = materials.filter((m) => !canMaterial(point, m.materialType));
  if (invalid.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Materiales no aceptados por este punto: ${invalid.map((m) => m.materialType).join(', ')}`,
    });
  }

  const submission = store.createSubmission({
    userId: user.id,
    pointId,
    materials,
    trackingStatus: 'arrived',
    notes: submissionNotes,
    createdByUserId: req.userId,
  });

  return res.status(201).json({
    success: true,
    message: 'Entrega registrada exitosamente (modo demo)',
    data: {
      submission,
      submissionCode: submission.submissionCode,
      user: { id: user.id, username: user.username, recyclingCode: user.recyclingCode },
    },
  });
};

exports.getUserSubmissions = async (req, res) => {
  const { status, limit = 20, page = 1 } = req.query || {};
  const all = store.listSubmissionsByUser(req.userId);
  const filtered = status ? all.filter((s) => String(s.verification?.status) === String(status)) : all;

  const lim = Math.max(1, Number(limit) || 20);
  const p = Math.max(1, Number(page) || 1);
  const skip = (p - 1) * lim;
  const paged = filtered
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(skip, skip + lim)
    .map((s) => {
      const point = store.getPoint(s.recyclingPoint);
      return {
        ...s,
        recyclingPoint: point ? { _id: point._id, name: point.name, address: point.address, city: point.city } : s.recyclingPoint,
      };
    });

  return res.json({
    success: true,
    data: {
      submissions: paged,
      pagination: { page: p, limit: lim, total: filtered.length, pages: Math.ceil(filtered.length / lim) },
    },
  });
};

exports.getUserRecyclingStats = async (req, res) => {
  const approved = store
    .listSubmissionsByUser(req.userId)
    .filter((s) => s.verification?.status === 'approved');

  const totalEcoCoinsEarned = approved.reduce((sum, s) => sum + (Number(s.rewards?.totalEcoCoins) || 0), 0);
  const totalKgRecycled = approved.reduce((sum, s) => sum + (Number(s.submissionDetails?.actualTotalWeight) || 0), 0);

  return res.json({
    success: true,
    data: {
      stats: {
        totalSubmissions: approved.length,
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
};

exports.cancelSubmission = async (req, res) => {
  const { submissionId } = req.params;
  const submission = store.getSubmission(submissionId);
  if (!submission) {
    return res.status(404).json({ success: false, message: 'Submission no encontrada' });
  }

  if (String(submission.user) !== String(req.userId)) {
    return res.status(403).json({ success: false, message: 'No autorizado' });
  }

  submission.tracking.currentStatus = 'cancelled';
  submission.verification.status = 'rejected';
  store.submissionsById.set(String(submissionId), submission);

  return res.json({ success: true, message: 'Submission cancelada (modo demo)', data: { submission } });
};

exports.getSubmissionByCode = async (req, res) => {
  const { code } = req.params;
  const submission = Array.from(store.submissionsById.values()).find((s) => String(s.submissionCode) === String(code));
  if (!submission) {
    return res.status(404).json({ success: false, message: 'Submission no encontrada' });
  }

  const tracking = submission.tracking && typeof submission.tracking === 'object' ? submission.tracking : {};
  const history = Array.isArray(tracking.statusHistory)
    ? tracking.statusHistory.map((h) => ({ status: h?.status, at: h?.timestamp })).filter((h) => h.status && h.at)
    : [];
  const point = store.getPoint(submission.recyclingPoint);

  return res.json({
    success: true,
    data: {
      submission: {
        submissionCode: submission.submissionCode,
        createdAt: submission.createdAt,
        verificationStatus: submission.verification?.status,
        recyclingPoint: point ? { name: point.name, city: point.city } : undefined,
        trust: submission.trustScore !== undefined
          ? {
              score: submission.trustScore,
              signals: submission.trustSignals || [],
              algorithmVersion: submission.trustAlgorithmVersion || undefined,
              computedAt: submission.trustComputedAt || undefined,
            }
          : undefined,
        receipt: submission.receiptStatus && submission.receiptStatus !== 'none'
          ? {
              status: submission.receiptStatus,
              issuedAt: submission.receiptIssuedAt || undefined,
              network: 'solana',
              cluster: submission.solanaCluster || 'devnet',
              signature: submission.solanaSignature || undefined,
              explorerUrl: submission.solanaExplorerUrl || undefined,
              evidenceHash: submission.evidenceHash || undefined,
            }
          : undefined,
        tracking: {
          currentStatus: tracking.currentStatus,
          history,
        },
      },
    },
  });
};

exports.updateSubmissionStatus = async (req, res) => {
  const { submissionId } = req.params;
  const { status, notes } = req.body || {};
  const submission = store.getSubmission(submissionId);
  if (!submission) {
    return res.status(404).json({ success: false, message: 'Submission no encontrada' });
  }
  submission.tracking.currentStatus = status || submission.tracking.currentStatus;
  submission.tracking.statusHistory.push({ status, timestamp: new Date().toISOString(), notes: notes || '', updatedBy: req.userId });
  store.submissionsById.set(String(submissionId), submission);
  return res.json({ success: true, message: 'Status actualizado (modo demo)', data: { submission } });
};

exports.getPendingSubmissions = async (req, res) => {
  const { recyclingPointId, status = 'pending', limit = 50, page = 1 } = req.query || {};
  if (!recyclingPointId) {
    return res.status(400).json({ success: false, message: 'recyclingPointId es obligatorio' });
  }

  const point = store.getPoint(recyclingPointId);
  if (!point) {
    return res.status(404).json({ success: false, message: 'Punto de reciclaje no encontrado' });
  }

  // Solo admin del punto
  if (String(point.administrator) !== String(req.userId)) {
    return res.status(403).json({ success: false, message: 'Solo el administrador del punto puede verificar' });
  }

  const lim = Math.max(1, Number(limit) || 50);
  const p = Math.max(1, Number(page) || 1);
  const skip = (p - 1) * lim;

  const all = store
    .listSubmissionsByPoint(recyclingPointId)
    .filter((s) => String(s.verification?.status) === String(status));

  const subs = all
    .slice(skip, skip + lim)
    .map((s) => {
      const u = store.usersById.get(String(s.user));
      const p = store.getPoint(String(s.recyclingPoint));
      return {
        ...s,
        user: u ? { id: u.id, name: u.username, email: u.email, recyclingCode: u.recyclingCode } : s.user,
        recyclingPoint: p ? { _id: p._id, name: p.name, address: p.address, city: p.city } : s.recyclingPoint,
      };
    });

  return res.json({
    success: true,
    data: {
      submissions: subs,
      total: subs.length,
      statusFilter: status,
      pagination: { page: p, limit: lim, total: all.length, pages: Math.ceil(all.length / lim) || 1 },
    },
  });
};

exports.verifySubmission = async (req, res) => {
  const { submissionId } = req.params;
  const { verificationStatus, actualWeights, verificationNotes } = req.body || {};

  const submission = store.getSubmission(submissionId);
  if (!submission) {
    return res.status(404).json({ success: false, message: 'Submission no encontrada' });
  }

  const point = store.getPoint(submission.recyclingPoint);
  if (!point) {
    return res.status(404).json({ success: false, message: 'Punto de reciclaje no encontrado' });
  }

  if (String(point.administrator) !== String(req.userId)) {
    return res.status(403).json({ success: false, message: 'Solo el administrador del punto puede verificar' });
  }

  // Idempotencia: si ya fue verificada o ya se distribuyó la recompensa, no volver a acreditar.
  const alreadyVerified = String(submission.verification?.status || 'pending') !== 'pending';
  const alreadyDistributed = Boolean(submission.rewards?.rewardDistributed);
  if (alreadyVerified || alreadyDistributed) {
    return res.json({
      success: true,
      message: 'Submission ya verificada (idempotente)',
      data: {
        submission,
        rewardDistributed: submission.rewards?.totalEcoCoins || 0,
        environmentalImpact: {},
      },
    });
  }

  submission.verification.status = verificationStatus;
  submission.verification.verifiedBy = req.userId;
  const verificationDate = new Date();
  submission.verification.verificationDate = verificationDate.toISOString();
  submission.verification.verificationNotes = verificationNotes || '';

  if (Array.isArray(actualWeights)) {
    submission.submissionDetails.actualTotalWeight = 0;
    submission.materials.forEach((m, idx) => {
      if (actualWeights[idx] !== undefined) {
        m.actualWeight = Number(actualWeights[idx]);
      }
      submission.submissionDetails.actualTotalWeight += Number(m.actualWeight ?? m.estimatedWeight) || 0;
    });
  } else {
    submission.submissionDetails.actualTotalWeight = submission.materials.reduce((sum, m) => sum + (Number(m.actualWeight ?? m.estimatedWeight) || 0), 0);
  }

  if (verificationStatus === 'approved' || verificationStatus === 'partially_approved') {
    const totalEcoCoins = Math.floor(
      submission.materials.reduce((sum, m) => {
        const w = Number(m.actualWeight ?? m.estimatedWeight) || 0;
        const r = Number(m.rewardPerKg ?? 1) || 1;
        return sum + w * r;
      }, 0)
    );

    submission.rewards.totalEcoCoins = totalEcoCoins;
    submission.rewards.rewardDistributed = true;
    submission.tracking.currentStatus = 'completed';

    // Trust + evidencia (modo demo)
    const verifiedMaterials = submission.materials.map((m) => ({
      materialType: m.materialType,
      weight: Number(m.actualWeight ?? m.estimatedWeight) || 0,
      rewardPerKg: Number(m.rewardPerKg ?? 0) || 0,
    }));

    const trust = computeTrustScoreForRecyclingSubmission({
      verificationStatus,
      actualTotalWeight: submission.submissionDetails.actualTotalWeight,
      verifiedMaterials,
      isPointAdmin: true,
      isPlatformAdmin: false,
      hasRegisteredBy: Boolean(submission.createdByUserId),
    });

    const operatorId = deriveDeterministicOperatorId(req.userId);
    const co2AvoidedKg = calculateCO2AvoidedKg(verifiedMaterials);

    const evidencePayload = buildRecyclingEvidencePayload({
      submissionCode: submission.submissionCode,
      recyclingPointId: submission.recyclingPoint,
      verificationStatus,
      verificationDate,
      verifiedMaterials,
      actualTotalWeight: submission.submissionDetails.actualTotalWeight,
      operatorId,
      co2AvoidedKg,
    });

    submission.trustScore = trust.score;
    submission.trustSignals = trust.signals;
    submission.trustAlgorithmVersion = trust.algorithmVersion;
    submission.trustComputedAt = verificationDate.toISOString();
    submission.evidenceHash = computeEvidenceHash(evidencePayload);

    if (envBool('SOLANA_RECEIPTS_ENABLED', false)) {
      const sig = fakeSolanaSignature(submission.evidenceHash);
      submission.receiptStatus = 'issued';
      submission.receiptIssuedAt = new Date().toISOString();
      submission.solanaCluster = String(process.env.SOLANA_CLUSTER || 'devnet');
      submission.solanaSignature = sig;
      submission.solanaExplorerUrl = `https://explorer.solana.com/tx/${encodeURIComponent(sig)}?cluster=${encodeURIComponent(submission.solanaCluster)}`;
    } else {
      submission.receiptStatus = 'none';
    }

    store.addEcoCoins(submission.user, totalEcoCoins, {
      reason: 'recycling:reward',
      recyclingSubmissionId: submissionId,
      metadata: {
        submissionCode: submission.submissionCode,
        recyclingPointId: submission.recyclingPoint,
      },
    });
  }

  if (verificationStatus === 'rejected') {
    submission.tracking.currentStatus = 'cancelled';
  }

  store.submissionsById.set(String(submissionId), submission);

  return res.json({
    success: true,
    message: 'Verificación completada (modo demo)',
    data: {
      submission,
      rewardDistributed: submission.rewards.totalEcoCoins,
      environmentalImpact: {},
    },
  });
};

exports.retrySubmissionReceipt = async (req, res) => {
  const { submissionId } = req.params;
  const submission = store.getSubmission(submissionId);
  if (!submission) {
    return res.status(404).json({ success: false, message: 'Submission no encontrada' });
  }

  if (!envBool('SOLANA_RECEIPTS_ENABLED', false)) {
    return res.status(400).json({ success: false, message: 'Receipts Solana deshabilitados por configuración' });
  }

  if (submission.solanaSignature) {
    return res.json({ success: true, message: 'Receipt ya emitido', data: { submission } });
  }

  if (!submission.evidenceHash) {
    return res.status(400).json({ success: false, message: 'No hay evidenceHash para emitir receipt' });
  }

  const sig = fakeSolanaSignature(submission.evidenceHash);
  submission.receiptStatus = 'issued';
  submission.receiptIssuedAt = new Date().toISOString();
  submission.solanaCluster = String(process.env.SOLANA_CLUSTER || 'devnet');
  submission.solanaSignature = sig;
  submission.solanaExplorerUrl = `https://explorer.solana.com/tx/${encodeURIComponent(sig)}?cluster=${encodeURIComponent(submission.solanaCluster)}`;
  store.submissionsById.set(String(submissionId), submission);
  return res.json({ success: true, message: 'Receipt emitido (demo)', data: { submission } });
};
