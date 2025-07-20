const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Usuario' },
  filename: String, // Nombre del archivo en el servidor
  originalFilename: String, // Nombre original del archivo subido
  certificateData: Buffer,
  encryptionSalt: String,
  encryptionKey: String,
  // Metadatos del certificado para mejor identificación
  nombreComun: String,
  organizacion: String,
  email: String,
  fechaCreacion: Date,
  numeroSerie: String,
  validoHasta: Date
}, { timestamps: true });

const Certificate = mongoose.model('Certificate', certificateSchema);

module.exports = Certificate;
