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
  }
}, { timestamps: true });

const Documento = mongoose.model('Documento', documentoSchema);

module.exports = Documento; 