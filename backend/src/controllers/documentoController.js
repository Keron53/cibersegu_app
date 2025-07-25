const fs = require('fs');
const tmp = require('tmp');
const forge = require('node-forge');
const Documento = require('../models/Documento');
const { signPDF } = require('../utils/pdfSigner');
const crypto = require('crypto');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
const QRCode = require('qrcode');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const { execSync } = require('child_process');

function repairPdfWithQpdf(pdfBuffer) {
  const input = tmp.tmpNameSync({ postfix: '.pdf' });
  const output = tmp.tmpNameSync({ postfix: '.pdf' });
  fs.writeFileSync(input, pdfBuffer);
  execSync(`qpdf --decrypt --linearize "${input}" "${output}"`);
  const repairedBuffer = fs.readFileSync(output);
  fs.unlinkSync(input);
  fs.unlinkSync(output);
  return repairedBuffer;
}

const documentoController = {
  // Endpoint para firma visual con QR usando pyHanko (DEPRECATED - usar firmarDocumentoQRNode)
  firmarDocumentoVisible: async (req, res) => {
    res.status(400).json({ 
      error: 'Este endpoint está deprecado. Usa /firmar-qr-node para firmar con QR visual usando Node.js' 
    });
  },

  firmarDocumentoNode: async (req, res) => {
    try {
      const pdfPath = req.files['pdf'][0].path;
      const p12Path = req.files['cert'][0].path;
      const passphrase = req.body.password;

      const pdfBuffer = fs.readFileSync(pdfPath);
      const p12Buffer = fs.readFileSync(p12Path);

      const signedPdf = signPDF(pdfBuffer, p12Buffer, passphrase);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="firmado_node.pdf"');
      res.send(signedPdf);

      // Limpieza
      [pdfPath, p12Path].forEach(f => fs.existsSync(f) && fs.unlinkSync(f));
    } catch (error) {
      console.error('Error al firmar el PDF con node-signpdf:', error);
      res.status(500).json({ error: error.message });
    }
  },

  firmarDocumentoQRNode: async (req, res) => {
    try {
      const pdfPath = req.files['pdf'][0].path;
      const p12Path = req.files['cert'][0].path;
      const passphrase = req.body.password;

      // 1. Leer el PDF original y el certificado
      const pdfBuffer = fs.readFileSync(pdfPath);
      const p12Buffer = fs.readFileSync(p12Path);

      // Extraer nombre y organización del certificado .p12
      let nombre = '';
      let organizacion = '';
      try {
        const p12Asn1 = forge.asn1.fromDer(p12Buffer.toString('binary'));
        const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, passphrase);
        const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })[forge.pki.oids.certBag];
        const cert = certBags[0].cert;
        cert.subject.attributes.forEach(attr => {
          if (attr.name === 'commonName') nombre = attr.value;
          if (attr.name === 'organizationName') organizacion = attr.value;
        });
      } catch (e) {
        console.error('No se pudo extraer nombre/organización del certificado:', e);
      }

      // 2. Firmar el PDF original con node-signpdf
      const signedPdfBuffer = signPDF(pdfBuffer, p12Buffer, passphrase);

      // 3. Insertar el QR y el texto en el PDF firmado usando pdf-lib
      const pdfDoc = await PDFDocument.load(signedPdfBuffer);
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const qrData = JSON.stringify({ nombre, organizacion });
      const qrImageBuffer = await QRCode.toBuffer(qrData, { type: 'png', width: 120 });
      const qrImage = await pdfDoc.embedPng(qrImageBuffer);
      const { width, height } = firstPage.getSize();
      // Posición: QR a la izquierda, texto a la derecha
      const qrX = 40;
      const qrY = 40;
      const qrSize = 120;
      firstPage.drawImage(qrImage, {
        x: qrX,
        y: qrY,
        width: qrSize,
        height: qrSize,
      });
      // Texto a la derecha del QR
      const textX = qrX + qrSize + 20;
      const textY = qrY + qrSize - 10;
      const nombreMayus = (nombre || '').toUpperCase();
      const organizacionMayus = (organizacion || '').toUpperCase();
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      firstPage.drawText('Firmado electrónicamente por:', {
        x: textX,
        y: textY,
        size: 12,
        color: rgb(0, 0, 0),
      });
      firstPage.drawText(nombreMayus, {
        x: textX,
        y: textY - 18,
        size: 16,
        color: rgb(0, 0, 0),
        font: helveticaBold,
      });
      firstPage.drawText(organizacionMayus, {
        x: textX,
        y: textY - 38,
        size: 12,
        color: rgb(0, 0, 0),
      });
      firstPage.drawText('Validar únicamente con Digital Sign PUCESE', {
        x: textX,
        y: textY - 58,
        size: 10,
        color: rgb(0, 0, 0),
      });
      const finalPdfBuffer = await pdfDoc.save();

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="firmado_qr.pdf"');
      res.send(Buffer.from(finalPdfBuffer));

      // Limpieza
      [pdfPath, p12Path].forEach(f => fs.existsSync(f) && fs.unlinkSync(f));
    } catch (error) {
      console.error('Error al firmar el PDF con QR y node-signpdf:', error);
      res.status(500).json({ error: error.message });
    }
  },

  listarDocumentos: async (req, res) => {
    try {
      const documentos = await Documento.find({ estado: 'activo' }).populate('usuario', 'nombre email');
      res.json(documentos);
    } catch (error) {
      console.error('Error al listar documentos:', error);
      res.status(500).json({ error: 'Error al listar documentos' });
    }
  },

  eliminarDocumento: async (req, res) => {
    try {
      const { id } = req.params;
      const doc = await Documento.findByIdAndUpdate(id, { estado: 'eliminado' }, { new: true });
      if (!doc) {
        return res.status(404).json({ error: 'Documento no encontrado' });
      }
      res.json({ message: 'Documento eliminado correctamente', documento: doc });
    } catch (error) {
      console.error('Error al eliminar documento:', error);
      res.status(500).json({ error: 'Error al eliminar documento' });
    }
  },

  subirDocumento: async (req, res) => {
    try {
      const file = req.files && req.files[0];
      if (!file) {
        return res.status(400).json({ error: 'No se recibió ningún archivo' });
      }
      const { originalname, path: filePath } = file;
      const usuarioId = req.usuario ? req.usuario.id : null;
      // Calcular hash SHA256 del archivo
      const fileBuffer = fs.readFileSync(filePath);
      const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
      // Crear el documento en la base de datos
      const nuevoDocumento = new Documento({
        nombre: originalname,
        ruta: filePath,
        usuario: usuarioId,
        hash,
        estado: 'activo',
        firmaDigital: null
      });
      await nuevoDocumento.save();
      res.json({ message: 'Documento subido correctamente', documento: nuevoDocumento });
    } catch (error) {
      console.error('Error al subir el documento:', error);
      res.status(500).json({ error: 'Error al subir el documento' });
    }
  },

  obtenerDocumento: async (req, res) => {
    try {
      const { id } = req.params;
      const doc = await Documento.findById(id);
      if (!doc) {
        return res.status(404).json({ error: 'Documento no encontrado' });
      }
      // Enviar el archivo PDF
      res.sendFile(require('path').resolve(doc.ruta));
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener el documento' });
    }
  },

  infoDocumento: async (req, res) => {
    try {
      const { id } = req.params;
      const doc = await Documento.findById(id);
      if (!doc) {
        console.error('Documento no encontrado en la base de datos:', id);
        return res.status(404).json({ error: 'Documento no encontrado' });
      }
      if (!fs.existsSync(doc.ruta)) {
        console.error('Archivo PDF no existe en la ruta:', doc.ruta);
        return res.status(404).json({ error: 'Archivo PDF no encontrado en el servidor' });
      }
      const data = fs.readFileSync(doc.ruta);
      const uint8Data = new Uint8Array(data);
      const loadingTask = pdfjsLib.getDocument({ data: uint8Data });
      const pdf = await loadingTask.promise;
      res.json({ numPages: pdf.numPages });
    } catch (error) {
      console.error('Error al obtener información del PDF:', error);
      res.status(500).json({ error: 'Error al obtener información del PDF', detalle: error.message });
    }
  }
};

module.exports = documentoController; 