/* eslint-disable no-console */

const base = process.env.BASE_URL || 'http://localhost:5050';

async function j(method, path, body, token) {
  const res = await fetch(base + path, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }

  if (!res.ok) {
    throw new Error(`${method} ${path} -> ${res.status} ${JSON.stringify(json)}`);
  }

  return json;
}

(async () => {
  const adminEmail = 'admin1@demo.local';
  const operatorEmail = 'op1@demo.local';
  const userEmail = 'user1@demo.local';

  const adminReg = await j('POST', '/api/users/register', {
    username: 'admin1',
    email: adminEmail,
    password: 'pass',
    country: 'MX',
  });
  const adminToken = adminReg.data.token;

  const pointRes = await j(
    'POST',
    '/api/recycling/points',
    {
      name: 'Punto Centro Demo',
      address: 'Av. Demo 123',
      city: 'CDMX',
      state: 'CDMX',
      acceptedMaterials: [
        { materialType: 'Plástico PET', rewardPerKg: 2 },
        { materialType: 'Cartón', rewardPerKg: 1 },
      ],
    },
    adminToken
  );

  const pointId = pointRes.data.recyclingPoint._id;

  await j(
    'POST',
    `/api/recycling/points/${encodeURIComponent(pointId)}/operators`,
    { username: 'op1', email: operatorEmail, password: 'pass' },
    adminToken
  );

  const opLogin = await j('POST', '/api/users/login', { email: operatorEmail, password: 'pass' });
  const opToken = opLogin.data.token;

  const userReg = await j('POST', '/api/users/register', {
    username: 'user1',
    email: userEmail,
    password: 'pass',
    country: 'MX',
  });
  const userToken = userReg.data.token;
  const recyclingCode = userReg.data.user.recyclingCode;

  const before = await j('GET', '/api/users/stats', null, userToken);

  const deliveryRes = await j(
    'POST',
    `/api/recycling/points/${encodeURIComponent(pointId)}/submissions/register`,
    {
      userRecyclingCode: recyclingCode,
      materials: [{ materialType: 'Plástico PET', estimatedWeight: 10, condition: 'Bueno' }],
      submissionNotes: 'Entrega demo',
    },
    opToken
  );

  const submissionId = deliveryRes.data.submission._id;

  const pendingRes = await j(
    'GET',
    `/api/recycling/submissions/pending?recyclingPointId=${encodeURIComponent(pointId)}&status=pending`,
    null,
    adminToken
  );

  const verifyRes = await j(
    'PATCH',
    `/api/recycling/submissions/${encodeURIComponent(submissionId)}/verify`,
    {
      verificationStatus: 'approved',
      actualWeights: [10],
      verificationNotes: 'OK',
    },
    adminToken
  );

  const after = await j('GET', '/api/users/stats', null, userToken);

  console.log(
    JSON.stringify(
      {
        base,
        pointId,
        recyclingCode,
        ecoCoinsBefore: before.data.ecoCoins,
        ecoCoinsAfter: after.data.ecoCoins,
        pendingCount: pendingRes.data.total,
        verifiedStatus: verifyRes.data.submission.verification.status,
        reward: verifyRes.data.submission.rewards.totalEcoCoins,
      },
      null,
      2
    )
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
