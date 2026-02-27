// backend/server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { connectDB, isConnected } = require('./backend/config/database-config');
const productRoutes = require('./backend/routers/productRoutes');
const userRoutes = require('./backend/routers/userRoutes');
const transactionRoutes = require('./backend/routers/transactionRoutes');
const recyclingRoutes = require('./backend/routers/recyclingRoutes');
const uploadRoutes = require('./backend/routers/uploadRoutes');
const errorHandler = require('./backend/middleware/errorHandler');
const swaggerSetup = require('./backend/swagger');

const app = express();
const PORT = process.env.PORT || 5000;

const nodeEnv = (process.env.NODE_ENV || 'development').toLowerCase();
const isDemoMode = String(process.env.DEMO_MODE || '').toLowerCase() === 'true';

// Middlewares base (siempre, incluso cuando el módulo se importa en tests)
app.disable('x-powered-by');
app.set('trust proxy', 1);

const corsOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: corsOrigins.length > 0 ? corsOrigins : true,
  credentials: true
}));

app.use(helmet());

// Rate limiting (global + auth)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api', apiLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Demasiados intentos. Intenta de nuevo más tarde.'
  }
});
app.use('/api/users/login', authLimiter);
app.use('/api/users/register', authLimiter);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Healthcheck simple (útil para balanceadores y uptime monitors)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    env: nodeEnv,
    demoMode: isDemoMode,
    db: isConnected() ? 'connected' : 'disconnected',
    uptime: process.uptime()
  });
});

// Rutas
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/recycling', recyclingRoutes);
app.use('/api/uploads', uploadRoutes);

// Swagger
swaggerSetup(app);

// Error handler (último)
app.use(errorHandler);

// Función para inicializar el servidor
const startServer = async () => {
  try {
    if (nodeEnv === 'production' && isDemoMode) {
      throw new Error('DEMO_MODE=true no está permitido en producción');
    }

    if (nodeEnv === 'production') {
      if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL es obligatorio en producción');
      }
      if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET es obligatorio en producción');
      }
      if (!process.env.CORS_ORIGINS) {
        throw new Error('CORS_ORIGINS es obligatorio en producción (lista separada por comas)');
      }
    }

    // Conectar a la base de datos
    await connectDB();

    // Iniciar servidor
    const server = app.listen(PORT, () => {
      console.log(`🚀 Servidor EcoTrade corriendo en puerto ${PORT}`);
      console.log(`📱 Frontend: http://localhost:3000`);
      console.log(`🔗 API: http://localhost:${PORT}`);
      console.log(`📚 Documentación: http://localhost:${PORT}/api-docs`);
    });

    // Manejo graceful de cierre del servidor
    const gracefulShutdown = () => {
      console.log('\n⏹️  Cerrando servidor...');
      server.close(() => {
        console.log('✅ Servidor cerrado correctamente');
        process.exit(0);
      });
    };

    // Manejo de señales de cierre
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

    // Manejo de errores no capturados
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      server.close(() => process.exit(1));
    });

  } catch (error) {
    console.error('❌ Error iniciando el servidor:', error);
    process.exit(1);
  }
};

// Inicializar el servidor
if (require.main === module) {
  startServer();
}

module.exports = app;
module.exports.startServer = startServer;
