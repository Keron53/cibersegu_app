const mongoose = require('mongoose');

const documentoSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  ruta: { type: String, required: true },
  fechaSubida: { type: Date, default: Date.now }
});

const Documento = mongoose.model('Documento', documentoSchema);

module.exports = Documento; 