const express = require('express');
const router = express.Router();

const isDemoMode = String(process.env.DEMO_MODE || '').toLowerCase() === 'true';
const { authenticate, authorize, optionalAuth } = isDemoMode
	? require('../middleware/authMiddleware_demo')
	: require('../middleware/authMiddleware');

const recyclingPointController = isDemoMode
	? require('../controllers/recyclingPointController_demo')
	: require('../controllers/recyclingPointController');

const recyclingSubmissionController = isDemoMode
	? require('../controllers/recyclingSubmissionController_demo')
	: require('../controllers/recyclingSubmissionController');

const {
	loadRecyclingPoint,
	requirePointAdmin,
	requirePointOperatorOrAdmin
} = isDemoMode ? require('../middleware/recyclingAccess_demo') : require('../middleware/recyclingAccess');

// =================== RUTAS DE PUNTOS DE RECICLAJE ===================

// Rutas públicas (búsqueda y consulta)
router.get('/points', optionalAuth, recyclingPointController.getAllRecyclingPoints);
router.get('/points/nearby', optionalAuth, recyclingPointController.findNearbyRecyclingPoints);
router.get('/points/:id', optionalAuth, recyclingPointController.getRecyclingPointById);
router.get('/points/:id/materials', optionalAuth, recyclingPointController.getAcceptedMaterials);
router.get('/points/:id/stats', optionalAuth, recyclingPointController.getRecyclingPointStats);

// Rutas administrativas (requieren autenticación)
router.post('/points', authenticate, recyclingPointController.createRecyclingPoint);
router.put('/points/:id', authenticate, loadRecyclingPoint('id'), requirePointAdmin(), recyclingPointController.updateRecyclingPoint);
router.delete('/points/:id', authenticate, loadRecyclingPoint('id'), requirePointAdmin(), recyclingPointController.deleteRecyclingPoint);

// Dashboard y operadores (Admin del punto)
router.get('/points/:id/dashboard', authenticate, loadRecyclingPoint('id'), requirePointAdmin(), recyclingPointController.getPointDashboard);
router.get('/points/:id/operators', authenticate, loadRecyclingPoint('id'), requirePointAdmin(), recyclingPointController.listPointOperators);
router.post('/points/:id/operators', authenticate, loadRecyclingPoint('id'), requirePointAdmin(), recyclingPointController.createPointOperator);
router.delete('/points/:id/operators/:operatorUserId', authenticate, loadRecyclingPoint('id'), requirePointAdmin(), recyclingPointController.removePointOperator);

// Stats (Operador o Admin)
router.get('/points/:id/deliveries/stats', authenticate, loadRecyclingPoint('id'), requirePointOperatorOrAdmin(), recyclingPointController.getPointDeliveryStats);

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
router.get('/submissions/code/:code', recyclingSubmissionController.getSubmissionByCode);

// Rutas administrativas (verificación y gestión)
router.get('/submissions/pending', authenticate, recyclingSubmissionController.getPendingSubmissions);
router.patch('/submissions/:submissionId/status', authenticate, recyclingSubmissionController.updateSubmissionStatus);
router.patch('/submissions/:submissionId/verify', authenticate, recyclingSubmissionController.verifySubmission);

module.exports = router;