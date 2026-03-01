process.env.DEMO_MODE = 'true';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

// Forzar rate limit bajo SOLO para este worker/test-file
process.env.RECYCLING_PUBLIC_TRACKING_RL_WINDOW_MS = '60000';
process.env.RECYCLING_PUBLIC_TRACKING_RL_MAX = '3';

const request = require('supertest');
const app = require('../../server-main');

async function login(email) {
  const res = await request(app)
    .post('/api/users/login')
    .send({ email, password: 'demo1234' });

  expect(res.statusCode).toBe(200);
  expect(res.body.success).toBe(true);
  expect(res.body.data?.token).toBeTruthy();
  return res.body.data.token;
}

async function getEcoCoins(token) {
  const res = await request(app)
    .get('/api/users/profile')
    .set('Authorization', `Bearer ${token}`);

  expect(res.statusCode).toBe(200);
  expect(res.body.success).toBe(true);

  const user = res.body.data?.user || res.body.data?.profile || res.body.data;
  const ecoCoins = Number(user?.ecoCoins);
  expect(Number.isFinite(ecoCoins)).toBe(true);
  return ecoCoins;
}

async function getEcoCoinsHistory(token) {
  const res = await request(app)
    .get('/api/users/ecocoins/history')
    .set('Authorization', `Bearer ${token}`);

  expect(res.statusCode).toBe(200);
  expect(res.body.success).toBe(true);
  expect(Array.isArray(res.body.data?.history)).toBe(true);
  return res.body.data.history;
}

describe('P0 - Reciclaje: tracking público sin PII + rate limit', () => {
  it('tracking público por code no expone PII ni IDs internos', async () => {
    const adminToken = await login('admin@ecotrade.com');
    const userToken = await login('user@ecotrade.com');

    // Normal user no puede crear puntos
    const deniedPointRes = await request(app)
      .post('/api/recycling/points')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Punto 1', address: 'Dir', city: 'CDMX' });

    expect(deniedPointRes.statusCode).toBe(403);
    expect(deniedPointRes.body.success).toBe(false);

    // Admin sí puede crear puntos
    const pointRes = await request(app)
      .post('/api/recycling/points')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Punto Admin',
        address: 'Dir',
        city: 'CDMX',
        acceptedMaterials: [{ materialType: 'Plástico PET', rewardPerKg: 2 }],
      });

    expect(pointRes.statusCode).toBe(201);
    expect(pointRes.body.success).toBe(true);
    const pointId = pointRes.body.data?.recyclingPoint?._id || pointRes.body.data?.recyclingPoint?.id;
    expect(pointId).toBeTruthy();

    // Crear submission (autenticado)
    const subRes = await request(app)
      .post('/api/recycling/submissions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        recyclingPointId: pointId,
        materials: [{ materialType: 'Plástico PET', estimatedWeight: 1 }],
        submissionNotes: 'ok',
      });

    expect(subRes.statusCode).toBe(201);
    expect(subRes.body.success).toBe(true);
    const code = subRes.body.data?.submissionCode;
    expect(code).toBeTruthy();

    // Tracking público
    const trackRes = await request(app)
      .get(`/api/recycling/submissions/code/${code}`)
      .set('X-Forwarded-For', '2.2.2.2');
    expect(trackRes.statusCode).toBe(200);
    expect(trackRes.body.success).toBe(true);

    const payload = trackRes.body.data?.submission;
    expect(payload).toBeTruthy();

    // No PII ni ids internos
    expect(JSON.stringify(payload)).not.toMatch(/email/i);
    expect(JSON.stringify(payload)).not.toMatch(/recyclingCode/i);
    expect(JSON.stringify(payload)).not.toMatch(/userId/i);
    expect(JSON.stringify(payload)).not.toMatch(/\b_id\b/i);
  });

  it('aplica rate limit en tracking público por code (429)', async () => {
    const adminToken = await login('admin2@ecotrade.com');
    const userToken = await login('user2@ecotrade.com');

    const pointRes = await request(app)
      .post('/api/recycling/points')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Punto Admin 2',
        address: 'Dir',
        city: 'CDMX',
        acceptedMaterials: [{ materialType: 'Plástico PET', rewardPerKg: 2 }],
      });

    expect(pointRes.statusCode).toBe(201);
    expect(pointRes.body.success).toBe(true);

    const pointId = pointRes.body.data?.recyclingPoint?._id || pointRes.body.data?.recyclingPoint?.id;

    const subRes = await request(app)
      .post('/api/recycling/submissions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        recyclingPointId: pointId,
        materials: [{ materialType: 'Plástico PET', estimatedWeight: 1 }],
      });

    expect(subRes.statusCode).toBe(201);
    expect(subRes.body.success).toBe(true);

    const code = subRes.body.data?.submissionCode;

    // max=3 por ventana en este test-file
    const reqOpts = (r) => r.set('X-Forwarded-For', '1.1.1.1');
    const r1 = await reqOpts(request(app).get(`/api/recycling/submissions/code/${code}`));
    const r2 = await reqOpts(request(app).get(`/api/recycling/submissions/code/${code}`));
    const r3 = await reqOpts(request(app).get(`/api/recycling/submissions/code/${code}`));
    const r4 = await reqOpts(request(app).get(`/api/recycling/submissions/code/${code}`));

    expect([r1.statusCode, r2.statusCode, r3.statusCode]).toEqual([200, 200, 200]);
    expect(r4.statusCode).toBe(429);
    expect(r4.body.success).toBe(false);
  });

  it('bloquea parámetros peligrosos de rewards (rewardPerKg) en puntos', async () => {
    const adminToken = await login('admin3@ecotrade.com');

    const badCreate = await request(app)
      .post('/api/recycling/points')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Punto Malo',
        address: 'Dir',
        city: 'CDMX',
        acceptedMaterials: [{ materialType: 'Plástico PET', rewardPerKg: 999999 }],
      });

    expect(badCreate.statusCode).toBe(400);
    expect(badCreate.body.success).toBe(false);

    // Crear uno válido y luego intentar actualizarlo con rewardPerKg inválido
    const goodCreate = await request(app)
      .post('/api/recycling/points')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Punto Bueno',
        address: 'Dir',
        city: 'CDMX',
        acceptedMaterials: [{ materialType: 'Plástico PET', rewardPerKg: 2 }],
      });

    expect(goodCreate.statusCode).toBe(201);
    const pointId = goodCreate.body.data?.recyclingPoint?._id || goodCreate.body.data?.recyclingPoint?.id;
    expect(pointId).toBeTruthy();

    const badUpdate = await request(app)
      .put(`/api/recycling/points/${pointId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ acceptedMaterials: [{ materialType: 'Plástico PET', rewardPerKg: -1 }] });

    expect(badUpdate.statusCode).toBe(400);
    expect(badUpdate.body.success).toBe(false);
  });

  it('registerDelivery/verify no permite doble acreditación (idempotente)', async () => {
    const adminToken = await login('admin4@ecotrade.com');
    const userToken = await login('user4@ecotrade.com');

    const pointRes = await request(app)
      .post('/api/recycling/points')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Punto Idem',
        address: 'Dir',
        city: 'CDMX',
        acceptedMaterials: [{ materialType: 'Plástico PET', rewardPerKg: 2 }],
      });

    expect(pointRes.statusCode).toBe(201);
    const pointId = pointRes.body.data?.recyclingPoint?._id || pointRes.body.data?.recyclingPoint?.id;
    expect(pointId).toBeTruthy();

    const subRes = await request(app)
      .post('/api/recycling/submissions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        recyclingPointId: pointId,
        materials: [{ materialType: 'Plástico PET', estimatedWeight: 3 }],
      });

    expect(subRes.statusCode).toBe(201);
    const submissionId = subRes.body.data?.submission?._id || subRes.body.data?.submission?.id;
    expect(submissionId).toBeTruthy();

    const before = await getEcoCoins(userToken);

    const v1 = await request(app)
      .patch(`/api/recycling/submissions/${submissionId}/verify`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ verificationStatus: 'approved' });

    expect(v1.statusCode).toBe(200);
    expect(v1.body.success).toBe(true);

    const afterFirst = await getEcoCoins(userToken);
    expect(afterFirst).toBeGreaterThan(before);

    const h1 = await getEcoCoinsHistory(userToken);
    const c1 = h1.filter((h) => h?.metadata?.recyclingSubmissionId === submissionId).length;
    expect(c1).toBe(1);

    const v2 = await request(app)
      .patch(`/api/recycling/submissions/${submissionId}/verify`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ verificationStatus: 'approved' });

    expect(v2.statusCode).toBe(200);
    expect(v2.body.success).toBe(true);

    const afterSecond = await getEcoCoins(userToken);
    expect(afterSecond).toBe(afterFirst);

    const h2 = await getEcoCoinsHistory(userToken);
    const c2 = h2.filter((h) => h?.metadata?.recyclingSubmissionId === submissionId).length;
    expect(c2).toBe(1);
  });

  it('my-submissions acepta page/limit y devuelve pagination', async () => {
    const adminToken = await login('admin_pagination@ecotrade.com');
    const userToken = await login('user_pagination@ecotrade.com');

    const pointRes = await request(app)
      .post('/api/recycling/points')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Punto Pagination',
        address: 'Dir',
        city: 'CDMX',
        acceptedMaterials: [{ materialType: 'Plástico PET', rewardPerKg: 2 }],
      });

    expect(pointRes.statusCode).toBe(201);
    const pointId = pointRes.body.data?.recyclingPoint?._id || pointRes.body.data?.recyclingPoint?.id;
    expect(pointId).toBeTruthy();

    const subRes = await request(app)
      .post('/api/recycling/submissions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        recyclingPointId: pointId,
        materials: [{ materialType: 'Plástico PET', estimatedWeight: 1 }],
      });

    expect(subRes.statusCode).toBe(201);
    expect(subRes.body.success).toBe(true);

    const listRes = await request(app)
      .get('/api/recycling/submissions/my-submissions?page=1&limit=1')
      .set('Authorization', `Bearer ${userToken}`);

    expect(listRes.statusCode).toBe(200);
    expect(listRes.body.success).toBe(true);
    expect(Array.isArray(listRes.body.data?.submissions)).toBe(true);
    expect(listRes.body.data?.submissions?.length).toBeLessThanOrEqual(1);
    expect(listRes.body.data?.pagination?.page).toBe(1);
    expect(listRes.body.data?.pagination?.limit).toBe(1);
  });
});
