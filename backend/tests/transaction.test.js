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

async function getEcoCoins(token) {
  const res = await request(app)
    .get('/api/users/profile')
    .set('Authorization', `Bearer ${token}`);

  expect(res.statusCode).toBe(200);
  expect(res.body.success).toBe(true);
  expect(res.body.data?.user).toBeTruthy();
  return Number(res.body.data.user.ecoCoins) || 0;
}

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

  it('acepta page/limit y devuelve metadata de paginación', async () => {
    const token = await login('demo_pagination_tx@ecotrade.com');

    const res = await request(app)
      .get('/api/transactions?page=2&limit=5')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data?.transactions)).toBe(true);
    expect(res.body.data?.pagination?.page).toBe(2);
    expect(res.body.data?.pagination?.limit).toBe(5);
  });
});

describe('P1 - Validación de request (Joi) en transacciones', () => {
  it('rechaza product con ID inválido (400) antes de tocar lógica de negocio', async () => {
    const tokenBuyer = await login('buyer_tx@ecotrade.com');

    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${tokenBuyer}`)
      .send({
        product: 'not-an-id',
        paymentMethod: 'ecoCoins',
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(Array.isArray(res.body.errors)).toBe(true);
  });
});

describe('P0 - Pago con ecoCoins (antisubpago)', () => {
  it('rechaza ecoCoinsAmount menor y NO marca el producto como sold', async () => {
    const tokenSeller = await login('seller_tx@ecotrade.com');
    const tokenBuyer = await login('buyer_tx@ecotrade.com');

    const createProductRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${tokenSeller}`)
      .send({
        title: 'Producto para ecoCoins',
        description: 'Desc',
        price: 100,
        category: 'Otros',
        condition: 'Bueno',
        location: 'CDMX'
      });

    expect(createProductRes.statusCode).toBe(201);
    const productId = createProductRes.body.data?.product?._id;
    expect(productId).toBeTruthy();

    const txRes = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${tokenBuyer}`)
      .send({
        product: productId,
        paymentMethod: 'ecoCoins',
        ecoCoinsAmount: 1,
      });

    expect(txRes.statusCode).toBe(400);
    expect(txRes.body.success).toBe(false);

    const productRes = await request(app).get(`/api/products/${productId}`);
    expect(productRes.statusCode).toBe(200);
    expect(productRes.body.success).toBe(true);
    expect(productRes.body.data?.product?.status).toBe('available');
  });

  it('usa ceil para precios no múltiplos de 10 (101 -> 11)', async () => {
    const tokenSeller = await login('seller_ceil@ecotrade.com');
    const tokenBuyer = await login('buyer_ceil@ecotrade.com');

    const createProductRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${tokenSeller}`)
      .send({
        title: 'Producto ceil',
        description: 'Desc',
        price: 101,
        category: 'Otros',
        condition: 'Bueno',
        location: 'CDMX'
      });

    expect(createProductRes.statusCode).toBe(201);
    const productId = createProductRes.body.data?.product?._id;
    expect(productId).toBeTruthy();

    const before = await getEcoCoins(tokenBuyer);

    const bad = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${tokenBuyer}`)
      .send({
        product: productId,
        paymentMethod: 'ecoCoins',
        ecoCoinsAmount: 10,
      });

    expect(bad.statusCode).toBe(400);
    expect(bad.body.success).toBe(false);

    const ok = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${tokenBuyer}`)
      .send({
        product: productId,
        paymentMethod: 'ecoCoins',
        ecoCoinsAmount: 11,
      });

    expect(ok.statusCode).toBe(201);
    expect(ok.body.success).toBe(true);

    const after = await getEcoCoins(tokenBuyer);
    expect(after).toBe(before - 11);
  });
});

describe('P0 - Idempotencia + carreras (simulado)', () => {
  it('Idempotency-Key evita doble débito en reintentos', async () => {
    const tokenSeller = await login('seller_idem@ecotrade.com');
    const tokenBuyer = await login('buyer_idem@ecotrade.com');

    const createProductRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${tokenSeller}`)
      .send({
        title: 'Producto idem',
        description: 'Desc',
        price: 100,
        category: 'Otros',
        condition: 'Bueno',
        location: 'CDMX'
      });

    const productId = createProductRes.body.data?.product?._id;
    expect(productId).toBeTruthy();

    const before = await getEcoCoins(tokenBuyer);

    const r1 = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${tokenBuyer}`)
      .set('Idempotency-Key', 'key-1')
      .send({
        product: productId,
        paymentMethod: 'ecoCoins',
      });

    expect(r1.statusCode).toBe(201);
    expect(r1.body.success).toBe(true);
    const txId1 = r1.body.data?.transaction?.id;
    expect(txId1).toBeTruthy();

    const after1 = await getEcoCoins(tokenBuyer);
    expect(after1).toBe(before - 10);

    const r2 = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${tokenBuyer}`)
      .set('Idempotency-Key', 'key-1')
      .send({
        product: productId,
        paymentMethod: 'ecoCoins',
      });

    expect(r2.statusCode).toBe(200);
    expect(r2.body.success).toBe(true);
    expect(r2.body.data?.transaction?.id).toBe(txId1);

    const after2 = await getEcoCoins(tokenBuyer);
    expect(after2).toBe(after1);
  });

  it('segunda compra del mismo producto falla y no cambia el saldo', async () => {
    const tokenSeller = await login('seller_race@ecotrade.com');
    const tokenBuyer = await login('buyer_race@ecotrade.com');

    const createProductRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${tokenSeller}`)
      .send({
        title: 'Producto race',
        description: 'Desc',
        price: 100,
        category: 'Otros',
        condition: 'Bueno',
        location: 'CDMX'
      });

    const productId = createProductRes.body.data?.product?._id;
    expect(productId).toBeTruthy();

    const r1 = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${tokenBuyer}`)
      .set('Idempotency-Key', 'key-a')
      .send({ product: productId, paymentMethod: 'ecoCoins' });
    expect(r1.statusCode).toBe(201);
    expect(r1.body.success).toBe(true);

    const balanceAfter1 = await getEcoCoins(tokenBuyer);

    const r2 = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${tokenBuyer}`)
      .set('Idempotency-Key', 'key-b')
      .send({ product: productId, paymentMethod: 'ecoCoins' });

    expect(r2.statusCode).toBe(400);
    expect(r2.body.success).toBe(false);

    const balanceAfter2 = await getEcoCoins(tokenBuyer);
    expect(balanceAfter2).toBe(balanceAfter1);
  });
});

describe('P0/P1 - Acreditación de ecoCoins en transacción fiat', () => {
  it('acredita ecoCoins al buyer y seller en métodos no-ecoCoins', async () => {
    const tokenSeller = await login('seller_fiat@ecotrade.com');
    const tokenBuyer = await login('buyer_fiat@ecotrade.com');

    const beforeSeller = await getEcoCoins(tokenSeller);
    const beforeBuyer = await getEcoCoins(tokenBuyer);

    const createProductRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${tokenSeller}`)
      .send({
        title: 'Producto fiat rewards',
        description: 'Desc',
        price: 100,
        category: 'Otros',
        condition: 'Bueno',
        location: 'CDMX'
      });

    expect(createProductRes.statusCode).toBe(201);
    const productId = createProductRes.body.data?.product?._id;
    expect(productId).toBeTruthy();

    const txRes = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${tokenBuyer}`)
      .send({
        product: productId,
        paymentMethod: 'card',
      });

    expect(txRes.statusCode).toBe(201);
    expect(txRes.body.success).toBe(true);

    const afterSeller = await getEcoCoins(tokenSeller);
    const afterBuyer = await getEcoCoins(tokenBuyer);

    // baseEcoCoins = floor(100/10) = 10; seller 60% (6), buyer 40% (4)
    expect(afterSeller).toBe(beforeSeller + 6);
    expect(afterBuyer).toBe(beforeBuyer + 4);

    const productRes = await request(app).get(`/api/products/${productId}`);
    expect(productRes.statusCode).toBe(200);
    expect(productRes.body.success).toBe(true);
    expect(productRes.body.data?.product?.status).toBe('sold');
  });
});
