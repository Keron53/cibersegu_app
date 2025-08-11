const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const authMiddleware = require('../middleware/auth');

// Registro y login
router.post('/registro', usuarioController.registrar);
router.post('/login', usuarioController.login);

// Verificación de disponibilidad de usuario, email y teléfono
router.post('/check-username', usuarioController.checkUsernameAvailability);
router.post('/check-email', usuarioController.checkEmailAvailability);
router.post('/check-telefono', usuarioController.checkTelefonoAvailability);

// Verificación de email
router.post('/verificar-email', usuarioController.verificarEmail);
router.post('/reenviar-codigo', usuarioController.reenviarCodigo);
router.post('/registro-whatsapp', usuarioController.registrarConWhatsApp);
router.post('/verificar-whatsapp', usuarioController.verificarWhatsApp);
router.post('/reenviar-codigo-whatsapp', usuarioController.reenviarCodigoWhatsApp);

// Logout (requiere autenticación)
router.post('/logout', authMiddleware, usuarioController.logout);

// Gestión de perfil (requiere autenticación)
router.get('/perfil', authMiddleware, usuarioController.obtenerPerfil);
router.put('/perfil', authMiddleware, usuarioController.actualizarPerfil);

// Cambiar contraseña (requiere autenticación)
router.put('/cambiar-contrasena', authMiddleware, usuarioController.cambiarContrasena);

// Recuperación de contraseña (no requiere autenticación)
router.post('/solicitar-recuperacion', usuarioController.solicitarRecuperacionContrasena);
router.post('/restablecer-contrasena', usuarioController.restablecerContrasena);

// Listar usuarios (requiere autenticación)
router.get('/', authMiddleware, usuarioController.listarUsuarios);

// Agregar usuario
router.post('/', usuarioController.registrar);

module.exports = router;
