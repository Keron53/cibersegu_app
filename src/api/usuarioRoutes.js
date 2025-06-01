const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');

// Registro y login
router.post('/registro', usuarioController.registrar);
router.post('/login', usuarioController.login);

// Listar usuarios
router.get('/', usuarioController.listarUsuarios);

module.exports = router;
