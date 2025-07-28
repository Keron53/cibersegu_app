const mongoose = require('mongoose');

const documentoCompartidoSchema = new mongoose.Schema({
  documentoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Documento',
    required: true
  },
  usuarioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  tipoAcceso: {
    type: String,
    enum: ['firmante', 'solicitante', 'invitado'],
    default: 'firmante'
  },
  fechaAcceso: {
    type: Date,
    default: Date.now
  },
  solicitudFirmaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SolicitudFirma'
  },
  permisos: {
    ver: { type: Boolean, default: true },
    descargar: { type: Boolean, default: true },
    firmar: { type: Boolean, default: false }
  },
  activo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Índices para optimizar consultas
documentoCompartidoSchema.index({ documentoId: 1, usuarioId: 1 });
documentoCompartidoSchema.index({ usuarioId: 1, activo: 1 });
documentoCompartidoSchema.index({ solicitudFirmaId: 1 });

module.exports = mongoose.model('DocumentoCompartido', documentoCompartidoSchema); 