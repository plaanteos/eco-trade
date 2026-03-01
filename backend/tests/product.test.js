process.env.DEMO_MODE = 'true';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

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

describe('GET /api/products', () => {
  it('debe responder con un array de productos', async () => {
    const res = await request(app).get('/api/products');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('acepta paginación por query (page/limit) sin romper respuesta legacy (array)', async () => {
    const res = await request(app).get('/api/products?page=1&limit=1');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeLessThanOrEqual(1);
  });

  it('P0: no filtra PII en respuesta pública', async () => {
    const res = await request(app).get('/api/products');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    const bodyStr = JSON.stringify(res.body);
    expect(bodyStr).not.toMatch(/email/i);
    expect(bodyStr).not.toMatch(/password/i);
    expect(bodyStr).not.toMatch(/recyclingCode/i);
    expect(bodyStr).not.toMatch(/\"owner\"/i);
  });
});

describe('P0 - Productos public+optionalAuth no filtra datos sensibles', () => {
  it('GET /api/products/:id no expone PII', async () => {
    const tokenA = await login('sellerPublic@ecotrade.com');

    const createRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        title: 'Producto Público',
        description: 'Desc',
        price: 100,
        category: 'Otros',
        condition: 'Bueno',
        location: 'CDMX'
      });

    expect(createRes.statusCode).toBe(201);
    const productId = createRes.body.data?.product?._id;
    expect(productId).toBeTruthy();

    // Sin auth (optionalAuth)
    const res = await request(app).get(`/api/products/${productId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    const bodyStr = JSON.stringify(res.body);
    expect(bodyStr).not.toMatch(/email/i);
    expect(bodyStr).not.toMatch(/password/i);
    expect(bodyStr).not.toMatch(/recyclingCode/i);
    expect(bodyStr).not.toMatch(/\"owner\"/i);
  });
});

describe('P0 - IDOR productos (ownership guard)', () => {
  it('seller B no puede editar ni borrar producto de seller A', async () => {
    const tokenA = await login('sellerA@ecotrade.com');
    const tokenB = await login('sellerB@ecotrade.com');

    const createRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        title: 'Producto A',
        description: 'Desc',
        price: 100,
        category: 'Otros',
        condition: 'Bueno',
        location: 'CDMX'
      });

    expect(createRes.statusCode).toBe(201);
    expect(createRes.body.success).toBe(true);
    const productId = createRes.body.data?.product?._id;
    expect(productId).toBeTruthy();

    const updateRes = await request(app)
      .put(`/api/products/${productId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ title: 'Hacked' });

    expect(updateRes.statusCode).toBe(403);
    expect(updateRes.body.success).toBe(false);

    const getRes = await request(app).get(`/api/products/${productId}`);
    expect(getRes.statusCode).toBe(200);
    expect(getRes.body.success).toBe(true);
    expect(getRes.body.data?.product?.name).toBe('Producto A');

    const delRes = await request(app)
      .delete(`/api/products/${productId}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(delRes.statusCode).toBe(403);
    expect(delRes.body.success).toBe(false);

    const getRes2 = await request(app).get(`/api/products/${productId}`);
    expect(getRes2.statusCode).toBe(200);
    expect(getRes2.body.success).toBe(true);
  });
});