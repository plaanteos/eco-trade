const app = require('../server-main');
const { connectDB, isConnected } = require('../backend/config/database-config');

let connectPromise;

module.exports = async (req, res) => {
  try {
    const isVercel = String(process.env.VERCEL || '').toLowerCase() === '1'
      || String(process.env.VERCEL || '').toLowerCase() === 'true';
    const isProd = String(process.env.NODE_ENV || '').toLowerCase() === 'production';
    const isDemoMode = String(process.env.DEMO_MODE || '').toLowerCase() === 'true';

    if (isVercel && isProd) {
      const missing = [];
      if (!process.env.DATABASE_URL) missing.push('DATABASE_URL');
      if (!process.env.JWT_SECRET) missing.push('JWT_SECRET');
      if (!process.env.CORS_ORIGINS) missing.push('CORS_ORIGINS');

      if (isDemoMode) {
        return res.status(500).json({
          success: false,
          message: 'DEMO_MODE=true no está permitido en producción (Vercel)',
        });
      }

      if (missing.length > 0) {
        return res.status(500).json({
          success: false,
          message: 'Faltan variables de entorno en producción (Vercel)',
          missing,
        });
      }
    }

    if (!isConnected()) {
      connectPromise ||= connectDB();
      await connectPromise;
    }

    return app(req, res);
  } catch (error) {
    // Evita process.exit en serverless y devuelve un error claro
    console.error('❌ API error (Vercel):', error);
    return res.status(500).json({
      success: false,
      message: 'Error del servidor',
      error: error?.message || 'Unknown error',
    });
  }
};
