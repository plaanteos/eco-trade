let prisma;

function getPrisma() {
  if (!prisma) {
    // Lazy require para evitar problemas de resolución en Jest/demo mode.
    // Prisma solo debe cargarse cuando realmente se usa la base de datos.
    // eslint-disable-next-line global-require
    const { PrismaClient } = require('@prisma/client');
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
  }
  return prisma;
}

module.exports = { getPrisma };
