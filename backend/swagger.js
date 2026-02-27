// Documentación Swagger básica para EcoTrade
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'EcoTrade API',
    version: '1.0.0',
    description: 'API para la plataforma EcoTrade'
  },
  paths: {
    '/api/products': {
      get: { summary: 'Listar productos', responses: { 200: { description: 'OK' } } },
      post: { summary: 'Crear producto', responses: { 201: { description: 'Creado' } } }
    },
    '/api/users': {
      get: { summary: 'Listar usuarios', responses: { 200: { description: 'OK' } } },
      post: { summary: 'Crear usuario', responses: { 201: { description: 'Creado' } } }
    },
    '/api/transactions': {
      get: { summary: 'Listar transacciones', responses: { 200: { description: 'OK' } } },
      post: { summary: 'Crear transacción', responses: { 201: { description: 'Creada' } } }
    }
  }
};

module.exports = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
};
