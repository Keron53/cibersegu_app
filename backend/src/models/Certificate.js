const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Usuario' },
  filename: { type: String, required: true },
  originalFilename: { type: String, required: true },
  datosCifrados: { type: Buffer, required: true, validate: {
    validator: function(v) {
      return v && v.length > 0;
    },
    message: 'Los datos cifrados no pueden estar vacíos'
  }},
  encryptionSalt: { type: String, required: true, validate: {
    validator: function(v) {
      return v && v.length === 32; // 16 bytes en hex = 32 caracteres
    },
    message: 'El salt debe tener 32 caracteres hexadecimales'
  }},
  encryptionKey: { type: String, required: true, validate: {
    validator: function(v) {
      return v && v.length === 32; // 16 bytes en hex = 32 caracteres
    },
    message: 'El IV debe tener 32 caracteres hexadecimales'
  }},
  // Metadatos del certificado para mejor identificación
  nombreComun: { type: String, required: true },
  organizacion: { type: String, required: true },
  email: { type: String, required: true },
  fechaCreacion: { type: Date, default: Date.now },
  numeroSerie: String,
  validoHasta: Date
}, { timestamps: true });

// Middleware de pre-validación para asegurar integridad
certificateSchema.pre('save', function(next) {
  // Verificar que los datos cifrados no estén vacíos
  if (!this.datosCifrados || this.datosCifrados.length === 0) {
    return next(new Error('Los datos cifrados del certificado no pueden estar vacíos'));
  }
  
  // Verificar que el salt y IV tengan el formato correcto
  if (!this.encryptionSalt || this.encryptionSalt.length !== 32) {
    return next(new Error('El salt del certificado debe tener 32 caracteres hexadecimales'));
  }
  
  if (!this.encryptionKey || this.encryptionKey.length !== 32) {
    return next(new Error('El IV del certificado debe tener 32 caracteres hexadecimales'));
  }
  
  // Verificar que los metadatos estén presentes
  if (!this.nombreComun || !this.organizacion || !this.email) {
    return next(new Error('Los metadatos del certificado son obligatorios'));
  }
  
  next();
});

const Certificate = mongoose.model('Certificate', certificateSchema);

module.exports = Certificate;
