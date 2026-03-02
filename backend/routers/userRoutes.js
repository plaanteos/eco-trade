const express = require('express');
const router = express.Router();

const isDemoMode = String(process.env.DEMO_MODE || '').toLowerCase() === 'true';
const userController = isDemoMode
	? require('../controllers/userController_demo')
	: require('../controllers/userController');

const { authenticate, authorize, requirePermission } = isDemoMode
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

// EcoCoins
router.get('/ecocoins/history', authenticate, userController.getEcoCoinsHistory);

// Activar rol seller (sin cambiar accountType)
router.post('/seller/activate', authenticate, userController.becomeSeller);

// Convertir una cuenta a empresa (solo super_admin). Mantiene compatibilidad, pero NO es auto-servicio.
router.post('/company/activate-seller', authenticate, requirePermission('users:manage'), userController.becomeCompanySeller);

// Crear cuentas empresa (Opción A) - solo super_admin.
router.post('/admin/companies', authenticate, requirePermission('users:manage'), userController.createCompanyAccount);

// Rutas de administrador
router.get('/', authenticate, requirePermission('users:list'), userController.getAllUsers);

module.exports = router;
