// backend/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, checkRoles } = require('../middleware/authMiddleware');

// Rutas públicas
router.post('/register', userController.register);
router.post('/login', userController.login);

// Rutas protegidas
router.get('/profile', 
  authenticateToken, 
  userController.getProfile
);

router.put('/profile', 
  authenticateToken, 
  userController.updateProfile
);

// Rutas de administrador
router.get('/admin/users', 
  authenticateToken, 
  checkRoles(['admin']), 
  async (req, res) => {
    // Lógica de listado de usuarios (implementar)
    res.json({ message: 'Listado de usuarios' });
  }
);

module.exports = router;