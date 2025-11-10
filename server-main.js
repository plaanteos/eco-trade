// backend/server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./backend/config/database-config');
const productRoutes = require('./backend/routers/productRoutes');
const userRoutes = require('./backend/routers/userRoutes');
const transactionRoutes = require('./backend/routers/transactionRoutes');
const errorHandler = require('./backend/middleware/errorHandler');
const swaggerSetup = require('./backend/swagger');

const app = express();
const PORT = process.env.PORT || 5000;

// Conectar a la base de datos
connectDB();

// Middlewares
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/transactions', transactionRoutes);

// Middleware de manejo de errores
app.use(errorHandler);

// Configuración de Swagger
swaggerSetup(app);

// Iniciar servidor
const server = app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});

// Manejo de errores no capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  server.close(() => process.exit(1));
});

module.exports = app;
