const mongoose = require('mongoose');

const validacionPDFSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  nombreArchivo: {
    type: String,
    required: true
  },
  tipoValidacion: {
    type: String,
    enum: ['archivo', 'url'],
    required: true
  },
  urlArchivo: {
    type: String,
    default: null
  },
  resultado: {
    isValid: {
      type: Boolean,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    hasSignatures: {
      type: Boolean,
      required: true
    },
    signatureCount: {
      type: Number,
      default: 0
    },
    isOurSystem: {
      type: Boolean,
      default: false
    },
    systemType: {
      type: String,
      default: 'Sistema Desconocido'
    },
    isModified: {
      type: Boolean,
      default: false
    }
  },
  qrInfo: {
    signerName: String,
    organization: String,
    timestamp: String
  },
  metadata: {
    tamaño: Number, // en bytes
    paginas: Number,
    fechaCreacion: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Índices para búsquedas eficientes
validacionPDFSchema.index({ usuario: 1, createdAt: -1 });
validacionPDFSchema.index({ 'resultado.isOurSystem': 1 });
validacionPDFSchema.index({ 'resultado.hasSignatures': 1 });
validacionPDFSchema.index({ nombreArchivo: 'text' });

const ValidacionPDF = mongoose.model('ValidacionPDF', validacionPDFSchema);

module.exports = ValidacionPDF;
