const express = require('express');
const router = express.Router();
const solicitudMultipleController = require('../controllers/solicitudMultipleController');
const auth = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(auth);

// Crear solicitud múltiple de firma
router.post('/crear', solicitudMultipleController.crearSolicitudMultiple);

// Obtener solicitudes múltiples del usuario (como solicitante)
router.get('/mis-solicitudes', solicitudMultipleController.obtenerSolicitudesMultiples);

// Obtener solicitudes múltiples pendientes del usuario (como firmante)
router.get('/pendientes', solicitudMultipleController.obtenerSolicitudesPendientes);

// Obtener detalles de una solicitud múltiple específica
router.get('/:solicitudId', solicitudMultipleController.obtenerSolicitudMultiple);

// Firmar documento de solicitud múltiple
router.post('/:solicitudId/firmar', solicitudMultipleController.firmarSolicitudMultiple);

// Rechazar solicitud múltiple
router.post('/:solicitudId/rechazar', solicitudMultipleController.rechazarSolicitudMultiple);

// Cancelar solicitud múltiple
router.post('/:solicitudId/cancelar', solicitudMultipleController.cancelarSolicitudMultiple);

// Obtener estadísticas de solicitudes múltiples
router.get('/estadisticas/generales', solicitudMultipleController.obtenerEstadisticas);

module.exports = router;
