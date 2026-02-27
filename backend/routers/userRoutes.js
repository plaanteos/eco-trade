const express = require('express');
const router = express.Router();

const isDemoMode = String(process.env.DEMO_MODE || '').toLowerCase() === 'true';
const userController = isDemoMode
	? require('../controllers/userController_demo')
	: require('../controllers/userController');

const { authenticate, authorize } = isDemoMode
	? require('../middleware/authMiddleware_demo')
	: require('../middleware/authMiddleware');

// Rutas públicas
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/oauth/supabase', userController.loginWithSupabase);

// Rutas protegidas
router.get('/profile', authenticate, userController.getProfile);
router.put('/profile', authenticate, userController.updateProfile);
router.put('/onboarding', authenticate, userController.completeOnboarding);
router.get('/stats', authenticate, userController.getStats);

// Rutas de administrador
router.get('/', authenticate, authorize('admin'), userController.getAllUsers);

module.exports = router;
