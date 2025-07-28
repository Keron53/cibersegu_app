const mongoose = require('mongoose');

const documentoSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  ruta: { type: String, required: true },
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  hash: { type: String, required: true },
  estado: {
    type: String,
    enum: ['activo', 'eliminado'],
    default: 'activo'
  },
  firmaDigital: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  // NUEVO: Para documentos compartidos
  esDocumentoCompartido: { type: Boolean, default: false },
  solicitudesFirma: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SolicitudFirma'
  }],
  firmantes: [{
    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
    nombre: String,
    email: String,
    fechaFirma: Date,
    posicion: {
      x: Number,
      y: Number,
      page: Number
    }
  }]
}, { timestamps: true });

const Documento = mongoose.model('Documento', documentoSchema);

module.exports = Documento; 