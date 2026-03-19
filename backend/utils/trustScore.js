function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

const TRUST_ALGORITHM_VERSION = 'trust-v1';

function computeTrustScoreForRecyclingSubmission({
  verificationStatus,
  actualTotalWeight,
  verifiedMaterials,
  isPointAdmin,
  isPlatformAdmin,
  hasRegisteredBy,
}) {
  const signals = [];

  const status = String(verificationStatus || 'pending');
  const weight = Number(actualTotalWeight ?? 0) || 0;

  const materials = Array.isArray(verifiedMaterials) ? verifiedMaterials : [];
  const materialsCount = materials.length;
  const allWeightsPositive = materialsCount === 0
    ? false
    : materials.every((m) => (Number(m?.weight ?? m?.actualWeight ?? m?.estimatedWeight ?? 0) || 0) > 0);

  signals.push({ key: 'status', label: 'Estado de verificación', value: status });
  signals.push({ key: 'materials_count', label: 'Cantidad de materiales', value: materialsCount });
  signals.push({ key: 'weight_kg', label: 'Peso total (kg)', value: Number(weight.toFixed(3)) });
  signals.push({ key: 'weights_positive', label: 'Pesos positivos', value: allWeightsPositive });
  signals.push({ key: 'verified_by_point_admin', label: 'Verificado por admin del punto', value: Boolean(isPointAdmin) });
  signals.push({ key: 'verified_by_platform_admin', label: 'Verificado por admin de plataforma', value: Boolean(isPlatformAdmin) });
  signals.push({ key: 'registered_by_staff', label: 'Registrado por staff', value: Boolean(hasRegisteredBy) });

  let score = 50;

  if (status === 'approved' || status === 'partially_approved') score += 20;
  if (status === 'rejected') score -= 20;

  if (materialsCount >= 1) score += 10;
  if (materialsCount >= 3) score += 5;
  if (allWeightsPositive) score += 5;

  // Peso razonable: evita outliers absurdos
  if (weight > 0 && weight <= 200) score += 5;
  if (weight > 200 && weight <= 1000) score += 2;
  if (weight > 1000) score -= 10;

  if (isPointAdmin) score += 5;
  if (isPlatformAdmin) score += 5;
  if (hasRegisteredBy) score += 3;

  return {
    score: clamp(Math.round(score), 0, 100),
    signals,
    algorithmVersion: TRUST_ALGORITHM_VERSION,
  };
}

module.exports = {
  TRUST_ALGORITHM_VERSION,
  computeTrustScoreForRecyclingSubmission,
};
