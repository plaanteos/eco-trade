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

async function getHistory(token) {
  const res = await request(app)
    .get('/api/users/ecocoins/history')
    .set('Authorization', `Bearer ${token}`);

  expect(res.statusCode).toBe(200);
  expect(res.body.success).toBe(true);
  expect(Array.isArray(res.body.data?.history)).toBe(true);
  return res.body.data.history;
}

describe('P1 - EcoCoins ledger (demo mode)', () => {
  it('registra una entrada de ledger para pago con ecoCoins', async () => {
    const tokenSeller = await login('seller_ledger_tx@ecotrade.com');
    const tokenBuyer = await login('buyer_ledger_tx@ecotrade.com');

    const createProductRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${tokenSeller}`)
      .send({
        title: 'Producto ledger ecoCoins',
        description: 'Desc',
        price: 100,
        category: 'Otros',
        condition: 'Bueno',
        location: 'CDMX',
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
      });

    expect(txRes.statusCode).toBe(201);
    expect(txRes.body.success).toBe(true);

    const txId = txRes.body.data?.transaction?.id;
    expect(txId).toBeTruthy();

    const history = await getHistory(tokenBuyer);

    const entry = history.find(
      (h) => h?.metadata?.transactionId === txId && Number(h.ecoCoinsDelta) === -10
    );
    expect(entry).toBeTruthy();
    expect(entry.type).toBe('ecoCoins_payment');
  });

  it('Idempotency-Key no duplica entradas de ledger', async () => {
    const tokenSeller = await login('seller_ledger_idem@ecotrade.com');
    const tokenBuyer = await login('buyer_ledger_idem@ecotrade.com');

    const createProductRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${tokenSeller}`)
      .send({
        title: 'Producto ledger idem',
        description: 'Desc',
        price: 100,
        category: 'Otros',
        condition: 'Bueno',
        location: 'CDMX',
      });

    expect(createProductRes.statusCode).toBe(201);
    const productId = createProductRes.body.data?.product?._id;
    expect(productId).toBeTruthy();

    const r1 = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${tokenBuyer}`)
      .set('Idempotency-Key', 'ledger-key-1')
      .send({ product: productId, paymentMethod: 'ecoCoins' });

    expect(r1.statusCode).toBe(201);
    const txId = r1.body.data?.transaction?.id;
    expect(txId).toBeTruthy();

    const h1 = await getHistory(tokenBuyer);
    const c1 = h1.filter((h) => h?.metadata?.transactionId === txId).length;
    expect(c1).toBe(1);

    const r2 = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${tokenBuyer}`)
      .set('Idempotency-Key', 'ledger-key-1')
      .send({ product: productId, paymentMethod: 'ecoCoins' });

    expect(r2.statusCode).toBe(200);

    const h2 = await getHistory(tokenBuyer);
    const c2 = h2.filter((h) => h?.metadata?.transactionId === txId).length;
    expect(c2).toBe(1);
  });
});
