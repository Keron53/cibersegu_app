const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const solicitudFirmaController = require('../controllers/solicitudFirmaController');

// Crear solicitud de firma
router.post('/crear', auth, solicitudFirmaController.crearSolicitud);

// Listar solicitudes pendientes del usuario (como firmante)
router.get('/pendientes', auth, solicitudFirmaController.listarSolicitudesPendientes);

// Listar solicitudes enviadas por el usuario (como solicitante)
router.get('/enviadas', auth, solicitudFirmaController.listarSolicitudesEnviadas);

// Firmar documento por solicitud
router.post('/firmar/:solicitudId', auth, solicitudFirmaController.firmarPorSolicitud);

// Rechazar solicitud de firma
router.post('/rechazar/:solicitudId', auth, solicitudFirmaController.rechazarSolicitud);

// Obtener detalles de una solicitud
router.get('/:solicitudId', auth, solicitudFirmaController.obtenerSolicitud);

module.exports = router; 