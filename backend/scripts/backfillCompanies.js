require('dotenv').config();

const { getPrisma } = require('../config/prismaClient');

function pickLegalName(user) {
  const profile = user?.preferences?.companyProfile;
  return String(profile?.legalName || profile?.name || user?.username || 'Empresa').trim();
}

async function main() {
  const prisma = getPrisma();

  const companyUsers = await prisma.user.findMany({
    where: { accountType: 'company' },
    select: { id: true, username: true, email: true, country: true, preferences: true },
  });

  let createdCompanies = 0;
  let createdMemberships = 0;
  let linkedPoints = 0;
  let linkedProducts = 0;

  for (const u of companyUsers) {
    // 1) Ensure membership exists
    const existing = await prisma.companyMember.findFirst({
      where: { userId: String(u.id), status: 'active' },
      select: { companyId: true },
      orderBy: { createdAt: 'asc' },
    });

    let companyId = existing?.companyId ? String(existing.companyId) : null;

    if (!companyId) {
      const company = await prisma.company.create({
        data: {
          legalName: pickLegalName(u),
          country: u.country || undefined,
          status: 'active',
          profile: u?.preferences?.companyProfile || undefined,
          members: {
            create: {
              userId: String(u.id),
              role: 'owner',
              status: 'active',
            },
          },
        },
        select: { id: true },
      });

      companyId = String(company.id);
      createdCompanies++;
      createdMemberships++;
    }

    // 2) Link points administered by this company-user
    const points = await prisma.recyclingPoint.findMany({
      where: { administratorId: String(u.id) },
      select: { id: true, companyId: true, ownerType: true },
    });

    for (const p of points) {
      const needsLink = !p.companyId || String(p.ownerType || '').toLowerCase() !== 'company';
      if (!needsLink) continue;
      await prisma.recyclingPoint.update({
        where: { id: String(p.id) },
        data: { ownerType: 'company', companyId },
      });
      linkedPoints++;
    }

    // 3) Link products sold by this company-user
    const products = await prisma.product.findMany({
      where: { sellerId: String(u.id) },
      select: { id: true, companyId: true },
    });

    for (const prod of products) {
      if (prod.companyId) continue;
      await prisma.product.update({
        where: { id: String(prod.id) },
        data: { companyId },
      });
      linkedProducts++;
    }
  }

  console.log('[backfillCompanies] OK');
  console.log(
    JSON.stringify(
      {
        companyUsers: companyUsers.length,
        createdCompanies,
        createdMemberships,
        linkedPoints,
        linkedProducts,
      },
      null,
      2
    )
  );
}

main()
  .catch((err) => {
    console.error('[backfillCompanies] ERROR:', err?.code || err?.message || err);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      const prisma = getPrisma();
      await prisma.$disconnect();
    } catch {
      // ignore
    }
  });
