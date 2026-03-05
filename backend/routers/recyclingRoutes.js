const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const isDemoMode = String(process.env.DEMO_MODE || '').toLowerCase() === 'true';
const { authenticate, authorize, optionalAuth, requirePermission } = isDemoMode
	? require('../middleware/authMiddleware_demo')
	: require('../middleware/authMiddleware');

const recyclingPointController = isDemoMode
	? require('../controllers/recyclingPointController_demo')
	: require('../controllers/recyclingPointController');

const recyclingSubmissionController = isDemoMode
	? require('../controllers/recyclingSubmissionController_demo')
	: require('../controllers/recyclingSubmissionController');

const { hasPermission } = require('../utils/rbac');

const {
	loadRecyclingPoint,
	requirePointAdmin,
	requirePointOperatorOrAdmin,
	requirePointOperator
} = isDemoMode ? require('../middleware/recyclingAccess_demo') : require('../middleware/recyclingAccess');

function allowPlatformAdminOrPointAdmin() {
	return (req, res, next) => {
		if (req.user && hasPermission(req.user, 'recycling:point:manage:any')) return next();
		return requirePointAdmin()(req, res, next);
	};
}

function allowPlatformAdminOrPointOperatorOrAdmin() {
	return (req, res, next) => {
		if (req.user && hasPermission(req.user, 'recycling:point:manage:any')) return next();
		return requirePointOperatorOrAdmin()(req, res, next);
	};
}

// =================== RUTAS DE PUNTOS DE RECICLAJE ===================

// Rutas públicas (búsqueda y consulta)
router.get('/points', optionalAuth, recyclingPointController.getAllRecyclingPoints);
router.get('/points/nearby', optionalAuth, recyclingPointController.findNearbyRecyclingPoints);
router.get('/points/:id', optionalAuth, recyclingPointController.getRecyclingPointById);
router.get('/points/:id/materials', optionalAuth, recyclingPointController.getAcceptedMaterials);
router.get('/points/:id/stats', optionalAuth, recyclingPointController.getRecyclingPointStats);

// Crear punto: permitido a recycling_admin (crea su propio punto) Y a admin global (puede asignarlo a otro).
// recycling:point:create  → recycling_admin (empresa)
// recycling:point:manage:any → admin global de plataforma
function canCreateRecyclingPoint() {
	return (req, res, next) => {
		if (!req.user) {
			return res.status(401).json({ success: false, message: 'Usuario no autenticado', code: 'NOT_AUTHENTICATED' });
		}
		const canCreate = hasPermission(req.user, 'recycling:point:create') || hasPermission(req.user, 'recycling:point:manage:any');
		if (!canCreate) {
			return res.status(403).json({ success: false, message: 'Se requiere cuenta empresa o admin para crear puntos de reciclaje', code: 'INSUFFICIENT_PERMISSIONS' });
		}
		next();
	};
}

// Rutas administrativas (requieren autenticación)
router.post('/points', authenticate, canCreateRecyclingPoint(), recyclingPointController.createRecyclingPoint);
router.put('/points/:id', authenticate, loadRecyclingPoint('id'), allowPlatformAdminOrPointAdmin(), recyclingPointController.updateRecyclingPoint);
router.delete('/points/:id', authenticate, loadRecyclingPoint('id'), allowPlatformAdminOrPointAdmin(), recyclingPointController.deleteRecyclingPoint);

// Dashboard y operadores (Admin del punto)
router.get('/points/:id/dashboard', authenticate, loadRecyclingPoint('id'), allowPlatformAdminOrPointAdmin(), recyclingPointController.getPointDashboard);
router.get('/points/:id/operators', authenticate, loadRecyclingPoint('id'), allowPlatformAdminOrPointAdmin(), recyclingPointController.listPointOperators);
router.post('/points/:id/operators', authenticate, loadRecyclingPoint('id'), allowPlatformAdminOrPointAdmin(), recyclingPointController.createPointOperator);
router.delete('/points/:id/operators/:operatorUserId', authenticate, loadRecyclingPoint('id'), allowPlatformAdminOrPointAdmin(), recyclingPointController.removePointOperator);

// Activar / desactivar operadores
router.patch('/points/:id/operators/:operatorUserId/status', authenticate, loadRecyclingPoint('id'), allowPlatformAdminOrPointAdmin(), recyclingPointController.setOperatorStatus);

// Stats (Operador o Admin)
router.get('/points/:id/deliveries/stats', authenticate, loadRecyclingPoint('id'), allowPlatformAdminOrPointOperatorOrAdmin(), recyclingPointController.getPointDeliveryStats);

// =================== RUTAS DE SUBMISSIONS ===================

// Rutas de usuario (requieren autenticación)
router.post('/submissions', authenticate, recyclingSubmissionController.createRecyclingSubmission);
router.get('/submissions/my-submissions', authenticate, recyclingSubmissionController.getUserSubmissions);
router.get('/submissions/stats', authenticate, recyclingSubmissionController.getUserRecyclingStats);
router.patch('/submissions/:submissionId/cancel', authenticate, recyclingSubmissionController.cancelSubmission);

// Entrega asistida por operador (Operador o Admin)
router.post(
	'/points/:pointId/submissions/register',
	authenticate,
	loadRecyclingPoint('pointId'),
	requirePointOperatorOrAdmin(),
	recyclingSubmissionController.registerDeliveryByOperator
);

// Rutas públicas (por código de tracking)
const publicTrackingLimiter = rateLimit({
	windowMs: Math.max(1, Number(process.env.RECYCLING_PUBLIC_TRACKING_RL_WINDOW_MS) || 15 * 60 * 1000),
	max: Math.max(1, Number(process.env.RECYCLING_PUBLIC_TRACKING_RL_MAX) || 30),
	standardHeaders: true,
	legacyHeaders: false,
	message: {
		success: false,
		message: 'Demasiadas solicitudes. Intenta de nuevo más tarde.'
	}
});

router.get('/submissions/code/:code', publicTrackingLimiter, recyclingSubmissionController.getSubmissionByCode);

// Rutas administrativas (verificación y gestión)
router.get('/submissions/pending', authenticate, requirePermission('recycling:submission:verify'), recyclingSubmissionController.getPendingSubmissions);
router.patch('/submissions/:submissionId/status', authenticate, requirePermission('recycling:submission:verify'), recyclingSubmissionController.updateSubmissionStatus);
router.patch('/submissions/:submissionId/verify', authenticate, requirePermission('recycling:submission:verify'), recyclingSubmissionController.verifySubmission);

module.exports = router;