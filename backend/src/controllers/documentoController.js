const Documento = require('../models/Documento');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const documentoController = {
  async subir(req, res) {
    if (!req.file) return res.status(400).json({ mensaje: 'No se subió ningún archivo' });
    try {
      const fileBuffer = fs.readFileSync(req.file.path);
      const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

      const nuevoDoc = new Documento({
        nombre: req.file.originalname,
        ruta: req.file.filename,
        usuario: req.usuario.id,
        hash
      });

      await nuevoDoc.save();
      res.status(201).json(nuevoDoc);
    } catch (err) {
      if (req.file) {
        fs.unlink(req.file.path, (unlinkErr) => {
          if (unlinkErr) console.error('Error al eliminar archivo:', unlinkErr);
        });
      }
      res.status(500).json({ error: 'Error al guardar el documento' });
    }
  },

  async listar(req, res) {
    try {
      const docs = await Documento.find({ 
        usuario: req.usuario.id,
        estado: 'activo'
      });
      res.json(docs);
    } catch (err) {
      res.status(500).json({ error: 'Error al obtener documentos' });
    }
  },

  async ver(req, res) {
    try {
      const doc = await Documento.findOne({ 
        _id: req.params.id,
        usuario: req.usuario.id,
        estado: 'activo'
      });
      
      if (!doc) return res.status(404).json({ mensaje: 'Documento no encontrado' });
      
      const filePath = path.join(__dirname, '../../uploads', doc.ruta);
      res.sendFile(filePath);
    } catch (err) {
      res.status(500).json({ error: 'Error al visualizar el documento' });
    }
  },

  async eliminar(req, res) {
    try {
      // Realizar un soft delete (cambiar estado a eliminado)
      const doc = await Documento.findOneAndUpdate(
        { 
          _id: req.params.id,
          usuario: req.usuario.id,
          estado: 'activo' // Solo eliminar documentos activos
        },
        { estado: 'eliminado' },
        { new: true }
      );
      
      if (!doc) return res.status(404).json({ mensaje: 'Documento no encontrado o ya eliminado' });
      
      res.json({ mensaje: 'Documento marcado como eliminado exitosamente' });
    } catch (err) {
      res.status(500).json({ error: 'Error al eliminar el documento' });
    }
  },

  // Método para verificar la integridad del documento
  async verificarIntegridad(req, res) {
    try {
      const doc = await Documento.findOne({ 
        _id: req.params.id,
        usuario: req.usuario.id,
        estado: 'activo'
      });
      
      if (!doc) return res.status(404).json({ mensaje: 'Documento no encontrado' });
      
      const filePath = path.join(__dirname, '../../uploads', doc.ruta);
      const fileBuffer = fs.readFileSync(filePath);
      const currentHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
      
      const esValido = currentHash === doc.hash;
      res.json({ 
        esValido,
        mensaje: esValido ? 'El documento no ha sido modificado' : 'El documento ha sido modificado'
      });
    } catch (err) {
      res.status(500).json({ error: 'Error al verificar la integridad del documento' });
    }
  },

  // Método para ver todos los documentos en la base de datos (solo para desarrollo)
  async verTodos(req, res) {
    try {
      const docs = await Documento.find().populate('usuario', 'username');
      console.log('Documentos en la base de datos:', docs);
      res.json(docs);
    } catch (err) {
      console.error('Error al obtener todos los documentos:', err);
      res.status(500).json({ error: 'Error al obtener todos los documentos' });
    }
  }
};

module.exports = documentoController; 