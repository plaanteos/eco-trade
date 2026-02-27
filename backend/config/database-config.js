require('dotenv').config();
const { getPrisma } = require('./prismaClient');

let connected = false;

const connectDB = async () => {
  try {
    const isVercel = String(process.env.VERCEL || '').toLowerCase() === '1'
      || String(process.env.VERCEL || '').toLowerCase() === 'true';

    if (!process.env.DATABASE_URL) {
      const nodeEnv = (process.env.NODE_ENV || '').toLowerCase();
      const msg = 'DATABASE_URL no está configurado (Prisma/PostgreSQL)';
      if (nodeEnv === 'production') {
        throw new Error(msg);
      }
      console.warn(`⚠️  ${msg}. Continuando sin base de datos (dev).`);
      connected = false;
      return null;
    }

    console.log('🔌 Conectando a PostgreSQL (Prisma)...');
    const prisma = getPrisma();
    await prisma.$connect();

    // ping simple
    await prisma.$queryRaw`SELECT 1`;

    connected = true;
    console.log('✅ PostgreSQL conectado exitosamente (Prisma)');
    return prisma;
  } catch (error) {
    connected = false;
    console.error('❌ Error conectando a PostgreSQL (Prisma):', error.message);
    console.log('⚠️  Revisa tu cadena de conexión DATABASE_URL en el archivo .env');

    const nodeEnv = (process.env.NODE_ENV || '').toLowerCase();
    if (nodeEnv === 'production') {
      console.error('🚨 Producción requiere conexión a base de datos');
      if (isVercel) {
        throw error;
      }
      process.exit(1);
    }

    console.log('🧪 Modo no-productivo: Continuando sin base de datos');
    return null;
  }
};

const isConnected = () => connected === true;

const closeConnection = async () => {
  try {
    const prisma = getPrisma();
    await prisma.$disconnect();
    connected = false;
    console.log('📴 Conexión a PostgreSQL cerrada correctamente (Prisma)');
  } catch (error) {
    console.error('❌ Error cerrando conexión Prisma:', error);
  }
};

module.exports = { connectDB, isConnected, closeConnection };
