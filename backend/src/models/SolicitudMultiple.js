const mongoose = require('mongoose');

const solicitudMultipleSchema = new mongoose.Schema({
  // Documento a firmar
  documentoId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Documento', 
    required: true,
    index: true
  },
  
  // Usuario que solicita las firmas
  solicitanteId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Usuario', 
    required: true 
  },
  
  // Lista de firmantes (máximo 5)
  firmantes: [{
    usuarioId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Usuario', 
      required: true 
    },
    nombre: String,
    email: String,
    orden: { type: Number, default: 0 }, // Para futuras funcionalidades
    obligatorio: { type: Boolean, default: true }
  }],
  
  // Posición de firma (misma para todos) - Para compatibilidad
  posicionFirma: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    page: { type: Number, required: true },
    qrSize: { type: Number, default: 100 }
  },
  
  // NUEVO: Posiciones individuales para cada firmante
  posicionesIndividuales: [{
    usuarioId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Usuario', 
      required: true 
    },
    posicion: {
      x: { type: Number, required: true },
      y: { type: Number, required: true },
      page: { type: Number, required: true },
      qrSize: { type: Number, default: 100 }
    }
  }],
  
  // Mensaje personalizado del solicitante
  mensaje: { type: String },
  
  // Estado general de la solicitud múltiple
  estado: { 
    type: String, 
    enum: ['pendiente', 'parcialmente_firmado', 'completado', 'expirado', 'cancelado'],
    default: 'pendiente',
    index: true
  },
  
  // Fechas importantes
  fechaSolicitud: { type: Date, default: Date.now },
  fechaExpiracion: { type: Date, required: true, index: true },
  fechaCompletado: { type: Date },
  
  // Configuración de la solicitud
  tipo: { 
    type: String, 
    enum: ['libre', 'secuencial'], 
    default: 'libre' // Por defecto firmas libres
  },
  
  // Prioridad de la solicitud
  prioridad: { 
    type: String, 
    enum: ['baja', 'normal', 'alta'], 
    default: 'normal' 
  },
  
  // Configuraciones adicionales
  permitirFirmasSimultaneas: { type: Boolean, default: true },
  tiempoLimiteIndividual: { type: Number, default: 7 }, // días por firmante
  recordatorios: [{ type: Date }],
  
  // Metadatos
  titulo: { type: String, required: true },
  descripcion: String,
  tags: [String],
  
  // Estadísticas
  firmasCompletadas: { type: Number, default: 0 },
  totalFirmantes: { type: Number, required: true },
  porcentajeCompletado: { type: Number, default: 0 },
  
  // Historial de cambios
  historial: [{
    accion: String,
    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
    fecha: { type: Date, default: Date.now },
    detalles: String
  }],
  
  // Configuración de notificaciones
  notificaciones: {
    email: { type: Boolean, default: true },
    webSocket: { type: Boolean, default: true },
    recordatorios: { type: Boolean, default: true }
  }
}, {
  timestamps: true
});

// Índices para consultas eficientes
solicitudMultipleSchema.index({ solicitanteId: 1, estado: 1 });
solicitudMultipleSchema.index({ firmantes: 1, estado: 1 });
solicitudMultipleSchema.index({ fechaExpiracion: 1, estado: 1 });
solicitudMultipleSchema.index({ estado: 1, prioridad: 1 });

// Middleware pre-save para validaciones
solicitudMultipleSchema.pre('save', function(next) {
  // Validar máximo 5 firmantes
  if (this.firmantes.length > 5) {
    return next(new Error('No se pueden agregar más de 5 firmantes'));
  }
  
  // Validar que no haya firmantes duplicados
  const firmantesIds = this.firmantes.map(f => f.usuarioId.toString());
  const firmantesUnicos = new Set(firmantesIds);
  if (firmantesUnicos.size !== this.firmantes.length) {
    return next(new Error('No se pueden agregar firmantes duplicados'));
  }
  
  // Validar que el solicitante no esté en la lista de firmantes
  if (this.firmantes.some(f => f.usuarioId.toString() === this.solicitanteId.toString())) {
    return next(new Error('El solicitante no puede ser firmante'));
  }
  
  // Calcular estadísticas
  this.totalFirmantes = this.firmantes.length;
  this.porcentajeCompletado = (this.firmasCompletadas / this.totalFirmantes) * 100;
  
  // Establecer fecha de expiración si no existe
  if (!this.fechaExpiracion) {
    this.fechaExpiracion = new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)); // 7 días
  }
  
  next();
});

// Métodos estáticos
solicitudMultipleSchema.statics.obtenerSolicitudesPendientes = function(usuarioId) {
  return this.find({
    'firmantes.usuarioId': usuarioId,
    estado: { $in: ['pendiente', 'parcialmente_firmado'] },
    fechaExpiracion: { $gt: new Date() }
  }).populate('documentoId', 'nombre ruta')
    .populate('solicitanteId', 'nombre email')
    .sort({ prioridad: -1, fechaSolicitud: -1 });
};

solicitudMultipleSchema.statics.obtenerSolicitudesDelUsuario = function(solicitanteId) {
  return this.find({ solicitanteId })
    .populate('documentoId', 'nombre ruta')
    .populate('firmantes.usuarioId', 'nombre email')
    .sort({ fechaSolicitud: -1 });
};

// Métodos de instancia
solicitudMultipleSchema.methods.actualizarEstado = function() {
  if (this.firmasCompletadas === 0) {
    this.estado = 'pendiente';
  } else if (this.firmasCompletadas < this.totalFirmantes) {
    this.estado = 'parcialmente_firmado';
  } else {
    this.estado = 'completado';
    this.fechaCompletado = new Date();
  }
  
  this.porcentajeCompletado = (this.firmasCompletadas / this.totalFirmantes) * 100;
  return this.save();
};

solicitudMultipleSchema.methods.agregarFirma = function() {
  this.firmasCompletadas += 1;
  return this.actualizarEstado();
};

solicitudMultipleSchema.methods.verificarExpiracion = function() {
  if (new Date() > this.fechaExpiracion && this.estado !== 'completado') {
    this.estado = 'expirado';
    return this.save();
  }
  return Promise.resolve(this);
};

solicitudMultipleSchema.methods.agregarHistorial = function(accion, usuarioId, detalles) {
  this.historial.push({
    accion,
    usuarioId,
    detalles,
    fecha: new Date()
  });
  return this.save();
};

const SolicitudMultiple = mongoose.model('SolicitudMultiple', solicitudMultipleSchema);

module.exports = SolicitudMultiple;
