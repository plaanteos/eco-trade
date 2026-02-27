process.env.DEMO_MODE = 'true';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

const request = require('supertest');
const app = require('../../server-main');

describe('GET /api/transactions', () => {
  it('debe responder con un array de transacciones', async () => {
    const loginRes = await request(app)
      .post('/api/users/login')
      .send({ email: 'demo@ecotrade.com', password: 'demo1234' });

    const token = loginRes.body.data.token;

    const res = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.transactions)).toBe(true);
  });
});
