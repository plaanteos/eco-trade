// backend/config/firebase.js
const admin = require('firebase-admin');
require('dotenv').config();

// Parsear la clave de servicio desde una variable de entorno
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
