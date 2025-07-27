const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const authMiddleware = require('../middleware/auth');

// Registro y login
router.post('/registro', usuarioController.registrar);
router.post('/login', usuarioController.login);

// Verificación de email
router.post('/verificar-email', usuarioController.verificarEmail);
router.post('/reenviar-codigo', usuarioController.reenviarCodigo);

// Logout (requiere autenticación)
router.post('/logout', authMiddleware, usuarioController.logout);

// Gestión de perfil (requiere autenticación)
router.get('/perfil', authMiddleware, usuarioController.obtenerPerfil);
router.put('/perfil', authMiddleware, usuarioController.actualizarPerfil);

// Listar usuarios
router.get('/', usuarioController.listarUsuarios);

// Agregar usuario
router.post('/', usuarioController.registrar);

module.exports = router;
