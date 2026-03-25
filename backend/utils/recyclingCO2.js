/**
 * Cálculo de CO2 evitado para reciclaje (kg CO2 por kg de material).
 *
 * Basado en los factores del hackathon:
 * - Plástico: 1.5 kg CO2 / kg
 * - Papel y cartón: 0.9 kg CO2 / kg
 * - Vidrio: 0.3 kg CO2 / kg
 * - Metal: 4.0 kg CO2 / kg
 * - Electrónicos (RAEE): 20.0 kg CO2 / kg
 */

function normalizeText(input) {
  return String(input ?? '')
    // Quitar tildes/diacríticos
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function getCO2FactorKgForMaterialType(materialType) {
  const t = normalizeText(materialType);

  if (t.includes('plastico')) return 1.5;
  if (t.includes('papel') || t.includes('carton')) return 0.9;
  if (t.includes('vidrio')) return 0.3;

  // Metales (incluye categorías típicas del repo)
  if (t.includes('aluminio') || t.includes('acero') || t.includes('cobre') || t.includes('metal')) return 4.0;

  // Electrónicos / RAEE (en el repo se guardan como "Electrónicos", "Baterías", etc.)
  if (t.includes('electron') || t.includes('raee') || t.includes('bateria')) return 20.0;

  return 0;
}

function calculateCO2AvoidedKg(verifiedMaterials) {
  const items = Array.isArray(verifiedMaterials) ? verifiedMaterials : [];

  let total = 0;
  for (const item of items) {
    const materialType = item?.materialType;
    const weight = Number(item?.weight ?? item?.actualWeight ?? item?.estimatedWeight ?? 0) || 0;
    const factor = getCO2FactorKgForMaterialType(materialType);
    total += weight * factor;
  }

  // Evitar decimales infinitos: redondeo a 3 decimales para estabilidad en hashes/logs.
  return Math.round(total * 1000) / 1000;
}

module.exports = {
  getCO2FactorKgForMaterialType,
  calculateCO2AvoidedKg,
};

