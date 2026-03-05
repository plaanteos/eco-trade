// backend/middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  // Loguear el error
  console.error(err.stack);

  // Determinar el código de estado
  const statusCode = err.statusCode || 500;

  // Respuesta de error
  res.status(statusCode).json({
    status: 'error',
    statusCode: statusCode,
    message: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
