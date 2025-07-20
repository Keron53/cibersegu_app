const Documento = require('../models/Documento');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { PDFDocument, rgb } = require('pdf-lib');
const QRCode = require('qrcode');
const CertificateManager = require('../utils/CertificateManager');

// Función para agregar firma digital al PDF
const addSignatureToPDF = async (pdfPath, signatureInfo) => {
  try {
    console.log('🔧 Procesando firma en PDF:', pdfPath);
    
    // Leer el archivo PDF
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    // Obtener la página donde agregar la firma
    const page = pdfDoc.getPage(signatureInfo.position.page - 1); // PDF-lib usa 0-based indexing
    const { width, height } = page.getSize();
    
    console.log('📏 Dimensiones del PDF:', { width, height });
    console.log('📍 Posición recibida:', signatureInfo.position);
    
    // Generar QR code como imagen
    const qrCodeDataURL = await QRCode.toDataURL(signatureInfo.qrData, {
      width: 120,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    // Convertir Data URL a buffer
    const qrCodeBuffer = Buffer.from(qrCodeDataURL.split(',')[1], 'base64');
    const qrCodeImage = await pdfDoc.embedPng(qrCodeBuffer);
    
    // USAR COORDENADAS EXACTAS CON ESCALADO E INVERSIÓN DEL EJE Y
    // El frontend envía coordenadas del iframe - escalar al PDF e invertir Y
    let x, y, signatureWidth, signatureHeight;
    
    if (signatureInfo.position.pdfCoords) {
      // CONVERTIR coordenadas del iframe al PDF proporcionalmente
      const iframeWidth = 1280;
      const iframeHeight = 800;
      
      // FACTORES DE ESCALA PROPORCIONALES
      const scaleX = width / iframeWidth;
      const scaleY = height / iframeHeight;
      
      // CONVERSIÓN PROPORCIONAL: mantener la relación de posición
      x = signatureInfo.position.pdfCoords.x * scaleX;
      // INVERTIR EJE Y: convertir coordenada del iframe a coordenada del PDF
      y = height - (signatureInfo.position.pdfCoords.y * scaleY);
      signatureWidth = signatureInfo.position.pdfCoords.width * scaleX;
      signatureHeight = signatureInfo.position.pdfCoords.height * scaleY;
      
      console.log('🎯 CONVERSIÓN PROPORCIONAL DE COORDENADAS:', {
        original: signatureInfo.position.pdfCoords,
        iframe: { width: iframeWidth, height: iframeHeight },
        pdf: { width, height },
        scale: { scaleX, scaleY },
        usado: { x, y, signatureWidth, signatureHeight },
        conversion: `X: ${signatureInfo.position.pdfCoords.x} → ${x}, Y: ${signatureInfo.position.pdfCoords.y} → ${y}`
      });
    } else {
      // Fallback para compatibilidad con versiones anteriores
      console.log('⚠️ Usando conversión de coordenadas legacy...');
      
      // Usar las dimensiones reales del iframe que envía el frontend
      const viewportWidth = 1280; // Dimensiones reales del iframe
      const viewportHeight = 800; // Dimensiones reales del iframe
      
      // Calcular factores de escala
      const scaleX = width / viewportWidth;
      const scaleY = height / viewportHeight;
      
      // Convertir coordenadas
      x = signatureInfo.position.x * scaleX;
      y = height - (signatureInfo.position.y * scaleY) - (signatureInfo.position.height * scaleY);
      signatureWidth = signatureInfo.position.width * scaleX;
      signatureHeight = signatureInfo.position.height * scaleY;
    }
    
    console.log('🎯 Posición final calculada:', { 
      original: signatureInfo.position,
      pdfDimensions: { width, height },
      final: { x, y, signatureWidth, signatureHeight }
    });
    
    // Agregar QR code
    page.drawImage(qrCodeImage, {
      x: x,
      y: y,
      width: 60,
      height: 60
    });
    
    // Agregar texto de firma
    page.drawText('Firmado electrónicamente por:', {
      x: x + 70,
      y: y + 45,
      size: 8,
      color: rgb(0.4, 0.4, 0.4)
    });
    
    page.drawText(signatureInfo.signatureData.signer, {
      x: x + 70,
      y: y + 35,
      size: 10,
      color: rgb(0, 0, 0)
    });
    
    page.drawText('Validar únicamente con Digital Sign PUCESE', {
      x: x + 70,
      y: y + 25,
      size: 6,
      color: rgb(0.6, 0.6, 0.6)
    });
    
    // Guardar el PDF modificado
    const modifiedPdfBytes = await pdfDoc.save();
    fs.writeFileSync(pdfPath, modifiedPdfBytes);
    
    console.log('✅ Firma agregada exitosamente al PDF');
    return true;
  } catch (error) {
    console.error('❌ Error al agregar firma al PDF:', error);
    return false;
  }
}

const documentoController = {
  async subir(req, res) {
    console.log('📤 Recibida petición de subida de documento');
    console.log('📋 Usuario ID:', req.usuario?.id);
    console.log('📁 Archivo recibido:', req.file);
    
    if (!req.file) {
      console.log('❌ No se subió ningún archivo');
      return res.status(400).json({ mensaje: 'No se subió ningún archivo' });
    }
    
    try {
      console.log('✅ Archivo recibido correctamente, procesando...');
      const fileBuffer = fs.readFileSync(req.file.path);
      const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

      const nuevoDoc = new Documento({
        nombre: req.file.originalname,
        ruta: req.file.filename,
        usuario: req.usuario.id,
        hash
      });

      await nuevoDoc.save();
      console.log('✅ Documento guardado exitosamente:', nuevoDoc._id);
      res.status(201).json(nuevoDoc);
    } catch (err) {
      console.error('❌ Error al subir documento:', err);
      if (req.file) {
        fs.unlink(req.file.path, (unlinkErr) => {
          if (unlinkErr) console.error('Error al eliminar archivo:', unlinkErr);
        });
      }
      res.status(500).json({ error: 'Error al guardar el documento', details: err.message });
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
  },

  // Método para obtener información del PDF (número de páginas, dimensiones, etc.)
  async obtenerInfoPDF(req, res) {
    try {
      const doc = await Documento.findOne({ 
        _id: req.params.id,
        usuario: req.usuario.id,
        estado: 'activo'
      });
      
      if (!doc) {
        return res.status(404).json({ mensaje: 'Documento no encontrado' });
      }
      
      const filePath = path.join(__dirname, '../../uploads', doc.ruta);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ mensaje: 'Archivo no encontrado' });
      }
      
      // Leer el PDF y obtener información
      const pdfBytes = fs.readFileSync(filePath);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      
      const numPages = pdfDoc.getPageCount();
      const pages = [];
      
      // Obtener información de cada página
      for (let i = 0; i < numPages; i++) {
        const page = pdfDoc.getPage(i);
        const { width, height } = page.getSize();
        pages.push({
          pageNumber: i + 1,
          width: Math.round(width),
          height: Math.round(height),
          rotation: page.getRotation().angle
        });
      }
      
      console.log('📄 Información del PDF obtenida:', {
        documentoId: doc._id,
        nombre: doc.nombre,
        numPages: numPages,
        pages: pages
      });
      
      res.json({
        documentoId: doc._id,
        nombre: doc.nombre,
        numPages: numPages,
        pages: pages
      });
      
    } catch (error) {
      console.error('Error al obtener información del PDF:', error);
      res.status(500).json({ 
        mensaje: 'Error al obtener información del PDF',
        error: error.message 
      });
    }
  },

  // Método para firmar un documento digitalmente
  async firmarDocumento(req, res) {
    try {
      console.log('🔐 Recibida petición de firma digital');
      console.log('📋 Documento ID:', req.params.id);
      console.log('👤 Usuario ID:', req.usuario.id);
      console.log('📋 Body:', JSON.stringify(req.body, null, 2));
      
      const { position, qrData, signatureData, userData, certificateData, certificatePassword } = req.body;

      // Validar que se proporcione la contraseña del certificado
      if (!certificatePassword) {
        return res.status(400).json({ mensaje: 'Se requiere la contraseña del certificado para firmar' });
      }

      const documento = await Documento.findOne({ 
        _id: req.params.id,
        usuario: req.usuario.id,
        estado: 'activo'
      });

      if (!documento) {
        return res.status(404).json({ mensaje: 'Documento no encontrado' });
      }

      const filePath = path.join(__dirname, '../../uploads', documento.ruta);
      if (!fs.existsSync(filePath)) {
        console.log('❌ Archivo no encontrado en:', filePath);
        return res.status(404).json({ mensaje: 'Archivo no encontrado' });
      }

      // Validar la contraseña del certificado
      try {
        console.log('🔐 Validando contraseña del certificado...');
        const tempPath = path.join(__dirname, '../../uploads', `temp_${Date.now()}.p12`);
        
        await CertificateManager.decryptAndRetrieveCertificate(
          certificateData._id || certificateData.id, 
          certificatePassword, 
          tempPath
        );
        
        // Si llegamos aquí, la contraseña es correcta
        fs.unlinkSync(tempPath); // Limpiar archivo temporal
        console.log('✅ Contraseña del certificado válida');
      } catch (error) {
        console.log('❌ Contraseña del certificado inválida:', error.message);
        return res.status(401).json({ mensaje: '❌ Contraseña del certificado incorrecta. Verifica la contraseña e intenta nuevamente.' });
      }

      // Crear información de firma
      const firmaInfo = {
        position,
        qrData,
        signatureData,
        userData,
        certificateData,
        fechaFirma: new Date(),
        documentoId: documento._id
      };

      // Agregar firma visual al PDF
      console.log('🔧 Agregando firma visual al PDF...');
      const firmaAgregada = await addSignatureToPDF(filePath, firmaInfo);
      
      if (!firmaAgregada) {
        return res.status(500).json({ mensaje: 'Error al agregar la firma visual al PDF' });
      }

      // Guardar información de la firma en el documento
      documento.firmaDigital = firmaInfo;
      await documento.save();
      
      res.json({ 
        mensaje: '✅ Firma digital aplicada correctamente al documento',
        firmaInfo,
        documento: {
          id: documento._id,
          nombre: documento.nombre,
          fechaFirma: firmaInfo.fechaFirma,
          certificadoUtilizado: certificateData?.nombreComun || 'Certificado'
        }
      });
    } catch (error) {
      console.error('Error al firmar documento:', error);
      res.status(500).json({ mensaje: 'Error al firmar el documento' });
    }
  }
};

module.exports = documentoController; 