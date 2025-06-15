const mongoose = require('mongoose');

const tokenInvalidadoSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  fechaExpiracion: { type: Date, required: true }
});

const TokenInvalidado = mongoose.model('TokenInvalidado', tokenInvalidadoSchema);

module.exports = TokenInvalidado; 