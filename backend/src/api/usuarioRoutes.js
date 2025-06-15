const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const authMiddleware = require('../middleware/auth');

// Registro y login
router.post('/registro', usuarioController.registrar);
router.post('/login', usuarioController.login);

// Logout (requiere autenticación)
router.post('/logout', authMiddleware, usuarioController.logout);

// Listar usuarios
router.get('/', usuarioController.listarUsuarios);

// Agregar usuario
router.post('/', usuarioController.registrar);

module.exports = router;
