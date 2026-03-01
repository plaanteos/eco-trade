process.env.DEMO_MODE = 'true';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

const request = require('supertest');
const app = require('../../server-main');

describe('Users API (demo mode)', () => {
  it('debe permitir login y obtener profile', async () => {
    const loginRes = await request(app)
      .post('/api/users/login')
      .send({ email: 'demo@ecotrade.com', password: 'demo1234' });

    expect(loginRes.statusCode).toBe(200);
    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.data?.token).toBeTruthy();

    const token = loginRes.body.data.token;

    const profileRes = await request(app)
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(profileRes.statusCode).toBe(200);
    expect(profileRes.body.success).toBe(true);
    expect(profileRes.body.data?.user).toBeTruthy();
  });

  it('P0: GET /api/users/stats devuelve shape esperado por frontend', async () => {
    const loginRes = await request(app)
      .post('/api/users/login')
      .send({ email: 'demo@ecotrade.com', password: 'demo1234' });

    expect(loginRes.statusCode).toBe(200);
    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.data?.token).toBeTruthy();

    const token = loginRes.body.data.token;

    const statsRes = await request(app)
      .get('/api/users/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(statsRes.statusCode).toBe(200);
    expect(statsRes.body.success).toBe(true);

    const data = statsRes.body.data;
    expect(data).toBeTruthy();
    expect(typeof data.ecoCoins).toBe('number');
    expect(typeof data.transactionsCount).toBe('number');
    expect(typeof data.sustainabilityScore).toBe('number');
    expect(typeof data.monthlyGrowth).toBe('number');
  });

  it('debe listar usuarios (ruta admin en demo)', async () => {
    const loginRes = await request(app)
      .post('/api/users/login')
      .send({ email: 'demo@ecotrade.com', password: 'demo1234' });

    const token = loginRes.body.data.token;
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
