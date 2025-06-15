const jwt = require('jsonwebtoken');
const TokenInvalidado = require('../models/TokenInvalidado');

const SECRET_KEY = 'mi_clave_secreta';

const authMiddleware = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ mensaje: 'No se proporcionó token de autenticación' });
  }

  try {
    // Verificar si el token está en la lista de tokens invalidados
    const tokenInvalidado = await TokenInvalidado.findOne({ token });
    if (tokenInvalidado) {
      return res.status(401).json({ mensaje: 'Token inválido - Sesión cerrada' });
    }

    const decoded = jwt.verify(token, SECRET_KEY);
    req.usuario = decoded;
    next();
  } catch (err) {
    res.status(401).json({ mensaje: 'Token inválido' });
  }
};

module.exports = authMiddleware; 