/*
  Verificación rápida de conexión a DB (Prisma/Supabase).
  No imprime DATABASE_URL ni credenciales.
*/

require('dotenv').config();

const { getPrisma } = require('../config/prismaClient');

async function main() {
  const hasUrl = Boolean(process.env.DATABASE_URL);
  if (!hasUrl) {
    console.error('DATABASE_URL no está configurada.');
    console.error('Crea un .env en la raíz con DATABASE_URL=... (cadena Postgres de Supabase)');
    process.exit(2);
  }

  const prisma = getPrisma();

  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;

    const [userCount, pointCount, operatorCount, submissionCount, txCount, ledgerCount] = await Promise.all([
      prisma.user.count().catch(() => -1),
      prisma.recyclingPoint.count().catch(() => -1),
      prisma.recyclingPointOperator.count().catch(() => -1),
      prisma.recyclingSubmission.count().catch(() => -1),
      prisma.transaction.count().catch(() => -1),
      prisma.ecoCoinLedger?.count ? prisma.ecoCoinLedger.count().catch(() => -1) : Promise.resolve(-1),
    ]);

    console.log('✅ DB OK (Prisma)');
    console.log(JSON.stringify({
      users: userCount,
      recyclingPoints: pointCount,
      recyclingPointOperators: operatorCount,
      recyclingSubmissions: submissionCount,
      transactions: txCount,
      ecoCoinLedger: ledgerCount,
    }, null, 2));

    process.exit(0);
  } catch (err) {
    console.error('❌ DB FAIL (Prisma)');
    console.error(String(err && err.message ? err.message : err));
    process.exit(1);
  } finally {
    try {
      await prisma.$disconnect();
    } catch (_) {
      // ignore
    }
  }
}

main();
