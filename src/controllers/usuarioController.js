const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

const SECRET_KEY = 'mi_clave_secreta';

const usuarioController = {
  async registrar(req, res) {
    const { nombre, correo, contrasena } = req.body;
    try {
      const existente = await Usuario.obtenerPorCorreo(correo);
      if (existente) return res.status(400).json({ mensaje: 'El correo ya está registrado' });

      const nuevoUsuario = await Usuario.crear(nombre, correo, contrasena);
      res.status(201).json(nuevoUsuario);
    } catch (err) {
      res.status(500).json({ error: 'Error al registrar usuario' });
    }
  },

  async login(req, res) {
    const { correo, contrasena } = req.body;
    try {
      const usuario = await Usuario.obtenerPorCorreo(correo);
      if (!usuario || usuario.contrasena !== contrasena) {
        return res.status(401).json({ mensaje: 'Credenciales inválidas' });
      }

      const token = jwt.sign({ id: usuario.id_usuario, correo: usuario.correo }, SECRET_KEY, { expiresIn: '1h' });
      res.json({ token });
    } catch (err) {
      res.status(500).json({ error: 'Error al iniciar sesión' });
    }
  },

  async listarUsuarios(req, res) {
    const usuarios = await Usuario.obtenerTodos();
    res.json(usuarios);
  }
};

module.exports = usuarioController;
