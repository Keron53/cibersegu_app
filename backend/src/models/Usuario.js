const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

const usuarioSchema = new mongoose.Schema({
  nombre: { 
    type: String, 
    required: true,
    trim: true
  },
  username: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    lowercase: true
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    lowercase: true
  },
  password: { 
    type: String, 
    required: true 
  },
  emailVerificado: {
    type: Boolean,
    default: false
  },
  codigoVerificacion: {
    type: String,
    required: false
  },
  codigoExpiracion: {
    type: Date,
    required: false
  },
  intentosVerificacion: {
    type: Number,
    default: 0
  },
  tokenRecuperacion: {
    type: String,
    required: false
  },
  tokenRecuperacionExpiracion: {
    type: Date,
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware para encriptar la contraseña antes de guardar el usuario
usuarioSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Middleware para actualizar updatedAt
usuarioSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Método para generar código de verificación
usuarioSchema.methods.generarCodigoVerificacion = function() {
  const codigo = Math.floor(100000 + Math.random() * 900000).toString();
  this.codigoVerificacion = codigo;
  this.codigoExpiracion = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos
  this.intentosVerificacion = 0;
  return codigo;
};

// Método para verificar código
usuarioSchema.methods.verificarCodigo = function(codigo) {
  if (this.intentosVerificacion >= 3) {
    throw new Error('Demasiados intentos de verificación. Intente nuevamente en 15 minutos.');
  }
  
  if (this.codigoExpiracion < new Date()) {
    throw new Error('Código de verificación expirado.');
  }
  
  if (this.codigoVerificacion !== codigo) {
    this.intentosVerificacion += 1;
    throw new Error('Código de verificación incorrecto.');
  }
  
  this.emailVerificado = true;
  this.codigoVerificacion = undefined;
  this.codigoExpiracion = undefined;
  this.intentosVerificacion = 0;
  return true;
};

const Usuario = mongoose.model('Usuario', usuarioSchema);
module.exports = Usuario;
