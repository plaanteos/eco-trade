/* eslint-disable no-console */
require('dotenv').config();

const { getPrisma } = require('../config/prismaClient');

function parseArgs(argv) {
  const args = new Set(argv.slice(2));
  return {
    dryRun: args.has('--dry-run'),
    batchSize: Math.max(50, Math.min(5000, Number(process.env.BACKFILL_BATCH_SIZE) || 500)),
  };
}

function normalizePaymentMethod(pm) {
  return String(pm || '').trim().toLowerCase();
}

function isApprovedSubmission(status) {
  const s = String(status || '').trim().toLowerCase();
  return s === 'approved' || s === 'partially_approved';
}

async function ensureLedgerAvailable(prisma) {
  if (typeof prisma.ecoCoinLedger?.count !== 'function') {
    throw new Error(
      'Prisma client no expone ecoCoinLedger. ' +
        'Asegurate de correr `npx prisma generate` después de actualizar el schema y ' +
        'de tener la tabla aplicada en DB (`npx prisma db push` o migración).'
    );
  }

  // Verificar que la tabla existe
  await prisma.ecoCoinLedger.count().catch((err) => {
    const msg = String(err?.message || err);
    throw new Error(
      'No se pudo acceder a EcoCoinLedger en la DB. ' +
        '¿Aplicaste el schema? (ej: `npx prisma db push`)\n' +
        `Detalle: ${msg}`
    );
  });
}

async function backfillTransactions(prisma, { batchSize, dryRun }) {
  console.log('➡️  Backfill: transactions → EcoCoinLedger');

  let cursor = null;
  let processed = 0;
  let inserted = 0;

  // Iteración por cursor para evitar skip en tablas grandes
  // (orden por id asciende; id es cuid -> lexicográfico estable).
  while (true) {
    const txs = await prisma.transaction.findMany({
      take: batchSize,
      ...(cursor
        ? {
            cursor: { id: cursor },
            skip: 1,
          }
        : {}),
      orderBy: { id: 'asc' },
      select: {
        id: true,
        createdAt: true,
        paymentMethod: true,
        ecoCoinsBuyer: true,
        ecoCoinsSeller: true,
        ecoCoinsTotal: true,
        buyerId: true,
        sellerId: true,
        product: { select: { id: true, name: true } },
      },
    });

    if (!txs || txs.length === 0) break;

    cursor = txs[txs.length - 1].id;

    const rows = [];

    for (const t of txs) {
      const pm = normalizePaymentMethod(t.paymentMethod);
      const buyerDelta = Number(t.ecoCoinsBuyer) || 0;
      const sellerDelta = Number(t.ecoCoinsSeller) || 0;

      // No backfillear entradas que no cambian ecoCoins
      if (buyerDelta === 0 && sellerDelta === 0) {
        processed += 1;
        continue;
      }

      const txId = String(t.id);
      const baseMeta = {
        productId: t.product?.id,
        productName: t.product?.name,
        ecoCoinsTotal: Number(t.ecoCoinsTotal) || undefined,
        backfill: true,
      };

      if (buyerDelta !== 0) {
        rows.push({
          userId: String(t.buyerId),
          delta: buyerDelta,
          reason: pm === 'ecocoins' ? 'transaction:ecocoins:spend' : 'transaction:fiat:reward:buyer',
          transactionId: txId,
          metadata: { ...baseMeta, role: 'buyer' },
          createdAt: t.createdAt,
        });
      }

      if (sellerDelta !== 0) {
        rows.push({
          userId: String(t.sellerId),
          delta: sellerDelta,
          reason: pm === 'ecocoins' ? 'transaction:ecocoins:earn' : 'transaction:fiat:reward:seller',
          transactionId: txId,
          metadata: { ...baseMeta, role: 'seller' },
          createdAt: t.createdAt,
        });
      }

      processed += 1;
    }

    if (rows.length > 0) {
      if (dryRun) {
        inserted += rows.length;
      } else {
        const res = await prisma.ecoCoinLedger.createMany({
          data: rows,
          skipDuplicates: true,
        });
        inserted += Number(res?.count) || 0;
      }
    }

    if (processed % (batchSize * 5) === 0) {
      console.log(`   … ${processed} tx procesadas, ${inserted} entries insertadas`);
    }
  }

  console.log(`✅ Transactions backfill: ${processed} tx procesadas, ${inserted} entries insertadas${dryRun ? ' (dry-run)' : ''}`);
}

async function backfillRecyclingSubmissions(prisma, { batchSize, dryRun }) {
  console.log('➡️  Backfill: recyclingSubmissions → EcoCoinLedger');

  let cursor = null;
  let processed = 0;
  let inserted = 0;

  while (true) {
    const subs = await prisma.recyclingSubmission.findMany({
      take: batchSize,
      ...(cursor
        ? {
            cursor: { id: cursor },
            skip: 1,
          }
        : {}),
      orderBy: { id: 'asc' },
      select: {
        id: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
        submissionCode: true,
        verificationStatus: true,
        verificationDate: true,
        rewards: true,
        recyclingPoint: { select: { id: true, name: true, city: true } },
      },
    });

    if (!subs || subs.length === 0) break;

    cursor = subs[subs.length - 1].id;

    const rows = [];

    for (const s of subs) {
      processed += 1;

      if (!isApprovedSubmission(s.verificationStatus)) continue;

      const totalEcoCoins = Number(s.rewards?.totalEcoCoins) || 0;
      if (totalEcoCoins <= 0) continue;

      rows.push({
        userId: String(s.userId),
        delta: totalEcoCoins,
        reason: 'recycling:reward',
        recyclingSubmissionId: String(s.id),
        metadata: {
          submissionCode: s.submissionCode,
          recyclingPointId: s.recyclingPoint?.id,
          recyclingPointName: s.recyclingPoint?.name,
          recyclingPointCity: s.recyclingPoint?.city,
          backfill: true,
        },
        // El reward se acredita al verificar; si hay verificationDate, usarlo.
        createdAt: s.verificationDate || s.updatedAt || s.createdAt,
      });
    }

    if (rows.length > 0) {
      if (dryRun) {
        inserted += rows.length;
      } else {
        const res = await prisma.ecoCoinLedger.createMany({
          data: rows,
          skipDuplicates: true,
        });
        inserted += Number(res?.count) || 0;
      }
    }

    if (processed % (batchSize * 5) === 0) {
      console.log(`   … ${processed} submissions procesadas, ${inserted} entries insertadas`);
    }
  }

  console.log(`✅ Recycling backfill: ${processed} submissions procesadas, ${inserted} entries insertadas${dryRun ? ' (dry-run)' : ''}`);
}

async function main() {
  const args = parseArgs(process.argv);
  const prisma = getPrisma();

  console.log('🧾 Backfill EcoCoinLedger');
  console.log(`   dryRun=${args.dryRun} batchSize=${args.batchSize}`);

  await ensureLedgerAvailable(prisma);

  await backfillTransactions(prisma, args);
  await backfillRecyclingSubmissions(prisma, args);

  console.log('🎉 Backfill finalizado');
}

if (require.main === module) {
  main()
    .catch((err) => {
      console.error('❌ Backfill falló:', err);
      process.exitCode = 1;
    })
    .finally(async () => {
      try {
        const prisma = getPrisma();
        await prisma.$disconnect();
      } catch (e) {
        // ignore
      }
    });
}
