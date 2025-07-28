const mongoose = require('mongoose');

const solicitudFirmaSchema = new mongoose.Schema({
  documentoId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Documento', 
    required: true,
    index: true
  },
  solicitanteId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Usuario', 
    required: true 
  },
  firmanteId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Usuario', 
    required: true,
    index: true
  },
  posicionFirma: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    page: { type: Number, required: true },
    qrSize: { type: Number, default: 100 }
  },
  mensaje: { type: String },
  estado: { 
    type: String, 
    enum: ['pendiente', 'firmado', 'rechazado', 'expirado'],
    default: 'pendiente',
    index: true
  },
  fechaSolicitud: { type: Date, default: Date.now },
  fechaExpiracion: { type: Date, index: true },
  fechaFirma: { type: Date },
  certificadoId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Certificate' 
  },
  prioridad: { 
    type: String, 
    enum: ['baja', 'normal', 'alta'], 
    default: 'normal' 
  },
  recordatorios: [{ type: Date }],
  comentarios: [{
    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
    mensaje: String,
    fecha: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

// Índices compuestos para consultas eficientes
solicitudFirmaSchema.index({ firmanteId: 1, estado: 1 });
solicitudFirmaSchema.index({ documentoId: 1, estado: 1 });
solicitudFirmaSchema.index({ fechaExpiracion: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('SolicitudFirma', solicitudFirmaSchema); 