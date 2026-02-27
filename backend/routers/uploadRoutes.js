const express = require('express');
const router = express.Router();

const isDemoMode = String(process.env.DEMO_MODE || '').toLowerCase() === 'true';
const { authenticate } = isDemoMode
  ? require('../middleware/authMiddleware_demo')
  : require('../middleware/authMiddleware');

const uploadController = require('../controllers/uploadController');

// Sube una imagen a Supabase Storage.
// Requiere multipart/form-data con field `file`.
router.post('/image', authenticate, uploadController.uploadMiddleware, uploadController.uploadImage);

module.exports = router;
