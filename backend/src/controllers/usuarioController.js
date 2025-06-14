const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

const SECRET_KEY = 'mi_clave_secreta';

const usuarioController = {
  async registrar(req, res) {
    const { username, password } = req.body;
    try {
      const existente = await Usuario.findOne({ username });
      if (existente) return res.status(400).json({ mensaje: 'El usuario ya está registrado' });

      const nuevoUsuario = new Usuario({ username, password });
      await nuevoUsuario.save();
      res.status(201).json(nuevoUsuario);
    } catch (err) {
      console.error('Error real al registrar usuario:', err);
      res.status(500).json({ error: 'Error al registrar usuario' });
    }
  },

  async login(req, res) {
    const { username, password } = req.body;
    try {
      const usuario = await Usuario.findOne({ username });
      if (!usuario || usuario.password !== password) {
        return res.status(401).json({ mensaje: 'Credenciales inválidas' });
      }

      const token = jwt.sign({ id: usuario._id, username: usuario.username }, SECRET_KEY, { expiresIn: '1h' });
      res.json({ token });
    } catch (err) {
      res.status(500).json({ error: 'Error al iniciar sesión' });
    }
  },

  async listarUsuarios(req, res) {
    const usuarios = await Usuario.find({}, { password: 0 });
    res.json(usuarios);
  }
};

module.exports = usuarioController;
