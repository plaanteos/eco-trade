// Middleware de manejo de errores
module.exports = (err, req, res, next) => {
  const status = err.statusCode || err.status || 500;
  const isDev = (process.env.NODE_ENV || 'development').toLowerCase() !== 'production';

  if (isDev) {
    console.error(err);
  } else {
    console.error(err?.message || 'Unhandled error');
  }

  res.status(status).json({
    success: false,
    message: status === 500 ? 'Error interno del servidor' : (err.message || 'Error') ,
    details: isDev ? err?.stack : undefined
  });
};
