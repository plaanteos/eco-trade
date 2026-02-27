const crypto = require('crypto');

function randomId24() {
  // 24 hex chars (similar to Mongo ObjectId string)
  return crypto.randomBytes(12).toString('hex');
}

function generateRecyclingCode() {
  const ts = Date.now().toString(36);
  const rand = crypto.randomBytes(4).toString('hex');
  return `${ts}${rand}`;
}

const store = {
  usersById: new Map(),
  usersByEmail: new Map(),
  pointsById: new Map(),
  submissionsById: new Map(),

  ensureUser({ id, email, username, country }) {
    const normalizedEmail = String(email || '').toLowerCase().trim();
    if (!id) id = randomId24();

    const existingById = this.usersById.get(id);
    if (existingById) return existingById;

    if (normalizedEmail) {
      const existingByEmail = this.usersByEmail.get(normalizedEmail);
      if (existingByEmail) return existingByEmail;
    }

    const user = {
      id,
      _id: id,
      username: username || (normalizedEmail ? normalizedEmail.split('@')[0] : 'demo_user'),
      email: normalizedEmail || `demo_${id}@ecotrade.local`,
      country: (country || 'MX').toUpperCase(),
      accountType: 'individual',
      recyclingCode: generateRecyclingCode(),
      ecoCoins: 50,
      sustainabilityScore: 50,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    this.usersById.set(user.id, user);
    this.usersByEmail.set(user.email, user);
    return user;
  },

  setUser(user) {
    const normalizedEmail = String(user.email || '').toLowerCase().trim();
    const normalized = { ...user, email: normalizedEmail };
    this.usersById.set(normalized.id, normalized);
    if (normalizedEmail) this.usersByEmail.set(normalizedEmail, normalized);
    return normalized;
  },

  addEcoCoins(userId, amount) {
    const user = this.usersById.get(String(userId));
    if (!user) return null;
    const inc = Number(amount) || 0;
    user.ecoCoins = (Number(user.ecoCoins) || 0) + inc;
    user.sustainabilityScore = Math.min(100, Math.floor(user.ecoCoins / 10));
    this.setUser(user);
    return user;
  },

  createPoint({ administratorId, name, address, city, state, status, acceptedMaterials }) {
    const id = randomId24();
    const point = {
      _id: id,
      id,
      name: name || 'Punto Demo',
      address: address || 'Dirección Demo',
      city: city || 'Ciudad',
      state: state || 'Estado',
      status: status || 'active',
      administrator: String(administratorId),
      operators: [],
      acceptedMaterials: Array.isArray(acceptedMaterials) && acceptedMaterials.length > 0
        ? acceptedMaterials
        : [
            { materialType: 'Plástico PET', rewardPerKg: 2 },
            { materialType: 'Cartón', rewardPerKg: 1 },
            { materialType: 'Vidrio Transparente', rewardPerKg: 1 },
          ],
      createdAt: new Date().toISOString(),
    };

    this.pointsById.set(id, point);
    return point;
  },

  getPoint(pointId) {
    return this.pointsById.get(String(pointId));
  },

  listPoints() {
    return Array.from(this.pointsById.values());
  },

  createSubmission({ userId, pointId, materials, trackingStatus, notes, createdByUserId }) {
    const id = randomId24();
    const submissionCode = `REC${Date.now()}${Math.floor(Math.random() * 1000)}`;

    const point = this.getPoint(pointId);
    const processedMaterials = (materials || []).map((m) => {
      const pointMat = point?.acceptedMaterials?.find((pm) => pm.materialType === m.materialType);
      const rewardPerKg = pointMat?.rewardPerKg ?? 1;
      const estimatedWeight = Number(m.estimatedWeight) || 0;
      const calculatedReward = estimatedWeight * rewardPerKg;
      return {
        materialType: m.materialType,
        estimatedWeight,
        actualWeight: undefined,
        condition: m.condition || 'Bueno',
        rewardPerKg,
        calculatedReward,
      };
    });

    const estimatedEcoCoins = Math.floor(
      processedMaterials.reduce((sum, m) => sum + (Number(m.calculatedReward) || 0), 0)
    );

    const submission = {
      _id: id,
      id,
      submissionCode,
      user: String(userId),
      recyclingPoint: String(pointId),
      materials: processedMaterials,
      submissionDetails: {
        estimatedTotalWeight: processedMaterials.reduce((sum, m) => sum + (Number(m.estimatedWeight) || 0), 0),
        actualTotalWeight: undefined,
        submissionNotes: notes || '',
      },
      verification: {
        status: 'pending',
        verifiedBy: undefined,
        verificationDate: undefined,
        verificationNotes: '',
      },
      rewards: {
        estimatedEcoCoins,
        totalEcoCoins: 0,
        rewardDistributed: false,
      },
      tracking: {
        currentStatus: trackingStatus || 'submitted',
        statusHistory: [
          {
            status: trackingStatus || 'submitted',
            timestamp: new Date().toISOString(),
            notes: createdByUserId ? 'Creada por staff' : 'Creada por usuario',
            updatedBy: createdByUserId ? String(createdByUserId) : undefined,
          },
        ],
      },
      createdAt: new Date().toISOString(),
    };

    this.submissionsById.set(id, submission);
    return submission;
  },

  listSubmissionsByUser(userId) {
    const uid = String(userId);
    return Array.from(this.submissionsById.values()).filter((s) => String(s.user) === uid);
  },

  listSubmissionsByPoint(pointId) {
    const pid = String(pointId);
    return Array.from(this.submissionsById.values()).filter((s) => String(s.recyclingPoint) === pid);
  },

  getSubmission(submissionId) {
    return this.submissionsById.get(String(submissionId));
  },
};

module.exports = { store, generateRecyclingCode, randomId24 };
