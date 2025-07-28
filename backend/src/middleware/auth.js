const jwt = require('jsonwebtoken');
const TokenInvalidado = require('../models/TokenInvalidado');

const SECRET_KEY = 'mi_clave_secreta';

const authMiddleware = async (req, res, next) => {
  console.log('🔐 Auth middleware - Headers:', req.headers);
  console.log('🔐 Auth middleware - Authorization header:', req.header('Authorization'));
  
  const token = req.header('Authorization')?.replace('Bearer ', '');
  console.log('🔐 Auth middleware - Token extraído:', token ? `${token.substring(0, 10)}...` : 'null');

  if (!token) {
    console.log('❌ Auth middleware - No token provided');
    return res.status(401).json({ mensaje: 'No se proporcionó token de autenticación' });
  }

  try {
    // Verificar si el token está en la lista de tokens invalidados
    const tokenInvalidado = await TokenInvalidado.findOne({ token });
    if (tokenInvalidado) {
      console.log('❌ Auth middleware - Token invalidado');
      return res.status(401).json({ mensaje: 'Token inválido - Sesión cerrada' });
    }

    const decoded = jwt.verify(token, SECRET_KEY);
    console.log('✅ Auth middleware - Token válido para usuario:', decoded.id);
    req.usuario = decoded;
    next();
  } catch (err) {
    console.log('❌ Auth middleware - Error verificando token:', err.message);
    res.status(401).json({ mensaje: 'Token inválido' });
  }
};

module.exports = authMiddleware; 