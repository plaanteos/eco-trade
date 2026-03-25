const crypto = require('crypto');
const { stableStringify } = require('./stableStringify');

function sha256Hex(input) {
  return crypto.createHash('sha256').update(String(input)).digest('hex');
}

function buildRecyclingEvidencePayload({
  submissionCode,
  recyclingPointId,
  verificationStatus,
  verificationDate,
  verifiedMaterials,
 actualTotalWeight,
 operatorId,
 co2AvoidedKg,
}) {
  const materials = Array.isArray(verifiedMaterials)
    ? verifiedMaterials.map((m) => ({
        materialType: String(m?.materialType || '').trim(),
        weight: Number(m?.weight ?? m?.actualWeight ?? m?.estimatedWeight ?? 0) || 0,
        rewardPerKg: Number(m?.rewardPerKg ?? 0) || 0,
      }))
    : [];

  return {
    type: 'recycling_submission_verification',
    v: 1,
    // Hackathon spec: on-chain payload uses `sessionNumber`
    // We keep `submissionCode` for backwards compatibility inside our system.
    sessionNumber: String(submissionCode),
    submissionCode: String(submissionCode),
    recyclingPointId: String(recyclingPointId),
    verificationStatus: String(verificationStatus),
    verificationDate: verificationDate ? new Date(verificationDate).toISOString() : null,
    operatorId: operatorId ? String(operatorId) : undefined,
    totalKg: Number(actualTotalWeight ?? 0) || 0,
    actualTotalWeight: Number(actualTotalWeight ?? 0) || 0,
    co2Avoided: Number(co2AvoidedKg ?? 0) || 0,
    verifiedMaterials: materials,
  };
}

function computeEvidenceHash(payload) {
  const canonical = stableStringify(payload);
  return sha256Hex(canonical);
}

module.exports = {
  buildRecyclingEvidencePayload,
  computeEvidenceHash,
  sha256Hex,
};
