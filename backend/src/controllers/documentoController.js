const Documento = require('../models/Documento');
const path = require('path');
const fs = require('fs');

const documentoController = {
  async subir(req, res) {
    if (!req.file) return res.status(400).json({ mensaje: 'No se subió ningún archivo' });
    try {
      const nuevoDoc = new Documento({
        nombre: req.file.originalname,
        ruta: req.file.filename
      });
      await nuevoDoc.save();
      res.status(201).json(nuevoDoc);
    } catch (err) {
      res.status(500).json({ error: 'Error al guardar el documento' });
    }
  },

  async listar(req, res) {
    try {
      const docs = await Documento.find();
      res.json(docs);
    } catch (err) {
      res.status(500).json({ error: 'Error al obtener documentos' });
    }
  },

  async ver(req, res) {
    try {
      const doc = await Documento.findById(req.params.id);
      if (!doc) return res.status(404).json({ mensaje: 'Documento no encontrado' });
      const filePath = path.join(__dirname, '../../uploads', doc.ruta);
      res.sendFile(filePath);
    } catch (err) {
      res.status(500).json({ error: 'Error al visualizar el documento' });
    }
  },

  async eliminar(req, res) {
    try {
      const doc = await Documento.findByIdAndDelete(req.params.id);
      if (!doc) return res.status(404).json({ mensaje: 'Documento no encontrado' });
      const filePath = path.join(__dirname, '../../uploads', doc.ruta);
      fs.unlink(filePath, (err) => {
        if (err) console.error('Error al eliminar archivo físico:', err);
      });
      res.json({ mensaje: 'Documento eliminado' });
    } catch (err) {
      res.status(500).json({ error: 'Error al eliminar el documento' });
    }
  }
};

module.exports = documentoController; 