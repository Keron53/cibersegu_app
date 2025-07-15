const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Usuario = require('../models/Usuario');
const TokenInvalidado = require('../models/TokenInvalidado');

const SECRET_KEY = 'mi_clave_secreta';

const usuarioController = {
  async registrar(req, res) {
    const { username, password } = req.body;
    try {
      const existente = await Usuario.findOne({ username });
      if (existente) return res.status(400).json({ mensaje: 'El usuario ya está registrado' });

      const nuevoUsuario = new Usuario({ username, password });
      await nuevoUsuario.save(); // El hook se encarga de hashear
      // no devolver el password
      const { password: _pw, ...userData } = nuevoUsuario.toObject();
      res.status(201).json(userData);
    } catch (err) {
      console.error('Error real al registrar usuario:', err);
      res.status(500).json({ error: 'Error al registrar usuario' });
    }
  },

  async login(req, res) {
    const { username, password } = req.body;
    try {
      const usuario = await Usuario.findOne({ username });
      if (!usuario) return res.status(401).json({ mensaje: 'Credenciales inválidas' });

      const match = await bcrypt.compare(password, usuario.password);
      if (!match) return res.status(401).json({ mensaje: 'Credenciales inválidas' });

      const token = jwt.sign({ id: usuario._id, username: usuario.username }, SECRET_KEY, { expiresIn: '1h' });
      res.json({ token });
    } catch (err) {
      res.status(500).json({ error: 'Error al iniciar sesión' });
    }
  },

  async logout(req, res) {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      if (!token) return res.status(400).json({ mensaje: 'No se proporcionó token' });

      const decoded = jwt.verify(token, SECRET_KEY);
      const fechaExpiracion = new Date(decoded.exp * 1000);

      const tokenInvalidado = new TokenInvalidado({ token, fechaExpiracion });
      await tokenInvalidado.save();

      res.json({ mensaje: 'Sesión cerrada exitosamente' });
    } catch (err) {
      res.status(500).json({ error: 'Error al cerrar sesión' });
    }
  },

  async listarUsuarios(req, res) {
    //const usuarios = await Usuario.find({}, { password: 0 });
    const usuarios = await Usuario.find({});
    res.json(usuarios);
  }
};

module.exports = usuarioController;

