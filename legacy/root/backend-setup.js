// Estructura inicial del proyecto backend

// Instalación de dependencias
// npm init -y
// npm install express mongoose firebase-admin cors dotenv

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const connection = mongoose.connection;
connection.once('open', () => {
  console.log('Conexión a MongoDB establecida correctamente');
});

// Modelo base de Producto
const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  condition: { type: String, enum: ['Nuevo', 'Como nuevo', 'Bueno', 'Aceptable'], required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  ecological_impact: { type: Number, default: 0 },
  ecocoins_generated: { type: Number, default: 0 }
});

const Product = mongoose.model('Product', ProductSchema);

// Ruta inicial de prueba
app.get('/', (req, res) => {
  res.send('Backend de EcoTrade iniciado');
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto: ${PORT}`);
});

module.exports = { app, Product };
