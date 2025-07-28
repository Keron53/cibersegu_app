const fs = require('fs');
const tmp = require('tmp');
const forge = require('node-forge');
const Documento = require('../models/Documento');
const Certificate = require('../models/Certificate');
const CertificateManager = require('../utils/CertificateManager');
const { signPDF } = require('../utils/pdfSigner');
const crypto = require('crypto');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
const QRCode = require('qrcode');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const { execSync } = require('child_process');
const path = require('path');

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

      // Extraer nombre y organización del certificado .p12
      let nombre = '';
      let organizacion = '';
      try {
        const p12Buffer = fs.readFileSync(p12Path);
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

      // Leer coordenadas y página del body
      const x = req.body.x ? parseFloat(req.body.x) : 40;
      const y = req.body.y ? parseFloat(req.body.y) : 40;
      const page = req.body.page ? parseInt(req.body.page) : 1;
      const canvasWidth = req.body.canvasWidth ? parseFloat(req.body.canvasWidth) : 1;
      const canvasHeight = req.body.canvasHeight ? parseFloat(req.body.canvasHeight) : 1;
      const qrSize = req.body.qrSize ? parseFloat(req.body.qrSize) : 100;

      // Crear archivos temporales para pyHanko
      const tempPdfInput = tmp.tmpNameSync({ postfix: '.pdf' });
      const tempPdfOutput = tmp.tmpNameSync({ postfix: '.pdf' });
      const tempCert = tmp.tmpNameSync({ postfix: '.p12' });
      const tempCaCert = tmp.tmpNameSync({ postfix: '.pem' });

      // Copiar archivos a ubicaciones temporales
      fs.copyFileSync(pdfPath, tempPdfInput);
      fs.copyFileSync(p12Path, tempCert);
      
      console.log('📁 Archivos temporales creados:');
      console.log('  - PDF input:', tempPdfInput);
      console.log('  - Cert temp:', tempCert);
      console.log('  - PDF size:', fs.statSync(tempPdfInput).size, 'bytes');
      console.log('  - Cert size:', fs.statSync(tempCert).size, 'bytes');
      
      // Copiar el certificado CA al directorio temporal
      const caCertPath = path.join(__dirname, '../../CrearCACentral/ca.crt');
      if (fs.existsSync(caCertPath)) {
        fs.copyFileSync(caCertPath, tempCaCert);
        console.log('  - CA cert:', tempCaCert);
      } else {
        console.error('No se encontró el certificado CA en:', caCertPath);
        throw new Error('Certificado CA no encontrado');
      }

      // Calcular coordenadas PDF (convertir de canvas a PDF)
      const pdfDoc = await PDFDocument.load(fs.readFileSync(tempPdfInput));
      const pages = pdfDoc.getPages();
      const targetPage = pages[(page - 1) >= 0 ? (page - 1) : 0];
      const { width: pageWidth, height: pageHeight } = targetPage.getSize();

      // Conversión de coordenadas del canvas (frontend) a PDF (backend)
      const realX = (x / canvasWidth) * pageWidth;
      const realY = ((canvasHeight - y) / canvasHeight) * pageHeight;

      // Clamp para que el QR nunca se salga del margen
      const clamp = (val, min, max) => Math.max(min, Math.min(max, val));
      const clampedX = clamp(realX, 0, pageWidth - qrSize);
      const clampedY = clamp(realY, 0, pageHeight - qrSize);

      // Calcular coordenadas del rectángulo para pyHanko (x1, y1, x2, y2)
      const x1 = clampedX;
      const y1 = clampedY;
      const x2 = clampedX + qrSize;
      const y2 = clampedY + qrSize;

      // Ruta al script de Python
      const pythonScriptPath = path.join(__dirname, '../../MicroservicioPyHanko/firmar-pdf.py');
      const testScriptPath = path.join(__dirname, '../../MicroservicioPyHanko/test-certificate.py');

      // Primero probar el certificado
      const testCommand = `python "${testScriptPath}" "${tempCert}" "${passphrase}"`;
      console.log('Probando certificado con pyHanko:', testCommand);
      
      try {
        const testResult = execSync(testCommand, { 
          stdio: 'pipe',
          encoding: 'utf8',
          timeout: 10000 // 10 segundos timeout
        });
        console.log('✅ Certificado compatible con pyHanko');
        console.log('Test output:', testResult);
      } catch (testError) {
        console.error('❌ Certificado no compatible con pyHanko:', testError.message);
        console.error('Test error stdout:', testError.stdout);
        console.error('Test error stderr:', testError.stderr);
        throw new Error(`Certificado no compatible con pyHanko: ${testError.message}`);
      }

      // Ejecutar el script de Python con pyHanko
      const command = `python "${pythonScriptPath}" "${tempCert}" "${passphrase}" "${tempPdfInput}" "${tempPdfOutput}" "${page}" "${x1}" "${y1}" "${x2}" "${y2}" "${tempCaCert}"`;
      
      console.log('Ejecutando comando pyHanko:', command);
      
      try {
        execSync(command, { 
          stdio: 'pipe',
          encoding: 'utf8',
          timeout: 30000 // 30 segundos timeout
        });

        // Leer el PDF firmado
        const signedPdfBuffer = fs.readFileSync(tempPdfOutput);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="firmado_pyhanko.pdf"');
        res.send(signedPdfBuffer);

      } catch (pythonError) {
        console.error('Error ejecutando pyHanko:', pythonError);
        throw new Error(`Error en pyHanko: ${pythonError.message}`);
      } finally {
        // Limpieza de archivos temporales
        [tempPdfInput, tempPdfOutput, tempCert, tempCaCert, pdfPath, p12Path].forEach(f => {
          if (fs.existsSync(f)) {
            try {
              fs.unlinkSync(f);
            } catch (e) {
              console.error('Error eliminando archivo temporal:', e);
            }
          }
        });
      }

    } catch (error) {
      console.error('Error al firmar el PDF con pyHanko:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Nuevo endpoint para firmar documento y guardar información en BD
  firmarDocumentoConInfo: async (req, res) => {
    try {
      console.log('🔍 Iniciando firma de documento...');
      const { documentoId } = req.params;
      const { certificadoId, password, nombre, organizacion, email } = req.body;

      console.log('📋 Datos recibidos:', { documentoId, certificadoId, nombre, organizacion, email });

      // Verificar que el documento existe y no está firmado
      const documento = await Documento.findById(documentoId);
      if (!documento) {
        console.error('❌ Documento no encontrado:', documentoId);
        return res.status(404).json({ error: 'Documento no encontrado' });
      }

      console.log('✅ Documento encontrado:', documento.nombre);

      if (documento.firmaDigital) {
        console.log('❌ Documento ya firmado');
        return res.status(400).json({ error: 'El documento ya ha sido firmado' });
      }

      // Obtener el certificado
      const certificado = await Certificate.findById(certificadoId);
      if (!certificado) {
        console.error('❌ Certificado no encontrado:', certificadoId);
        return res.status(404).json({ error: 'Certificado no encontrado' });
      }

      console.log('✅ Certificado encontrado:', certificado.nombreComun);

      // Descargar el certificado
      console.log('🔐 Descifrando certificado...');
      console.log('📊 Datos del certificado:', {
        tieneDatosCifrados: !!certificado.datosCifrados,
        tieneSalt: !!certificado.encryptionSalt,
        tieneKey: !!certificado.encryptionKey,
        tamanioDatos: certificado.datosCifrados ? certificado.datosCifrados.length : 0
      });

      const certBuffer = CertificateManager.decryptCertificate(
        certificado.datosCifrados, 
        certificado.encryptionSalt, 
        certificado.encryptionKey, 
        password
      );

      console.log('✅ Certificado descifrado, tamaño:', certBuffer.length);
      
      // Crear archivos temporales
      const tempPdfInput = tmp.tmpNameSync({ postfix: '.pdf' });
      const tempPdfOutput = tmp.tmpNameSync({ postfix: '.pdf' });
      const tempCert = tmp.tmpNameSync({ postfix: '.p12' });
      const tempCaCert = tmp.tmpNameSync({ postfix: '.pem' });

      // Copiar archivos
      fs.copyFileSync(documento.ruta, tempPdfInput);
      fs.writeFileSync(tempCert, certBuffer);
      
      // Copiar certificado CA
      const caCertPath = path.join(__dirname, '../../CrearCACentral/ca.crt');
      if (fs.existsSync(caCertPath)) {
        fs.copyFileSync(caCertPath, tempCaCert);
      } else {
        throw new Error('Certificado CA no encontrado');
      }

      // Ejecutar firma con pyHanko
      console.log('🔧 Ejecutando firma con pyHanko...');
      
      // Verificar que Python esté disponible
      try {
        execSync('python --version', { stdio: 'pipe', encoding: 'utf8' });
        console.log('✅ Python está disponible');
      } catch (pythonError) {
        console.error('❌ Python no está disponible:', pythonError.message);
        throw new Error('Python no está instalado o no está en el PATH');
      }
      
      const pythonScriptPath = path.join(__dirname, '../../MicroservicioPyHanko/firmar-pdf.py');
      
      // Verificar que el script existe
      if (!fs.existsSync(pythonScriptPath)) {
        throw new Error(`Script de Python no encontrado: ${pythonScriptPath}`);
      }
      
      // Usar coordenadas más apropiadas para el sello de firma
      const command = `python "${pythonScriptPath}" "${tempCert}" "${password}" "${tempPdfInput}" "${tempPdfOutput}" "1" "50" "50" "250" "150" "${tempCaCert}"`;
      
      console.log('📋 Comando ejecutado:', command);
      
      try {
        const result = execSync(command, { 
          stdio: 'pipe',
          encoding: 'utf8',
          timeout: 30000
        });
        console.log('📤 Output de pyHanko:', result);
      } catch (execError) {
        console.error('❌ Error ejecutando pyHanko:', execError.message);
        console.error('📋 Error stdout:', execError.stdout);
        console.error('📋 Error stderr:', execError.stderr);
        throw new Error(`Error en pyHanko: ${execError.message}`);
      }

      console.log('✅ Firma con pyHanko completada');

      // Verificar que el archivo de salida existe
      if (!fs.existsSync(tempPdfOutput)) {
        throw new Error('El archivo PDF firmado no se generó');
      }

      console.log('📁 Archivo de salida existe:', tempPdfOutput);
      console.log('📏 Tamaño del archivo de salida:', fs.statSync(tempPdfOutput).size);

      // Leer el PDF firmado
      const signedPdfBuffer = fs.readFileSync(tempPdfOutput);
      console.log('📄 PDF firmado leído, tamaño:', signedPdfBuffer.length);

      // Reemplazar el archivo original con el PDF firmado
      fs.writeFileSync(documento.ruta, signedPdfBuffer);
      console.log('💾 Archivo original reemplazado con PDF firmado');

      console.log('💾 Guardando información de la firma...');
      
      // Guardar información de la firma en la base de datos
      const firmaInfo = {
        certificadoId: certificado._id,
        nombreFirmante: nombre || certificado.nombreComun,
        organizacion: organizacion || certificado.organizacion,
        email: email || certificado.email,
        fechaFirma: new Date(),
        numeroSerie: certificado.numeroSerie,
        validoHasta: certificado.validoHasta
      };

      console.log('📝 Información de firma:', firmaInfo);

      // Actualizar el documento con la información de la firma
      documento.firmaDigital = firmaInfo;
      await documento.save();
      
      console.log('✅ Documento actualizado en la base de datos');

      // Limpiar archivos temporales
      [tempPdfInput, tempPdfOutput, tempCert, tempCaCert].forEach(f => {
        if (fs.existsSync(f)) {
          try {
            fs.unlinkSync(f);
          } catch (e) {
            console.error('Error eliminando archivo temporal:', e);
          }
        }
      });

      res.json({ 
        message: 'Documento firmado correctamente',
        firmaInfo,
        documento: documento
      });

    } catch (error) {
      console.error('❌ Error al firmar documento:', error);
      console.error('📋 Stack trace:', error.stack);
      res.status(500).json({ error: error.message });
    }
  },

  listarDocumentos: async (req, res) => {
    try {
      // Verificar que el usuario esté autenticado
      if (!req.usuario || !req.usuario.id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      // Filtrar documentos solo del usuario autenticado
      const documentos = await Documento.find({ 
        usuario: req.usuario.id,
        estado: 'activo' 
      })
      .populate('usuario', 'nombre email')
      .populate('firmantes.usuarioId', 'nombre email')
      .populate('solicitudesFirma', 'estado firmanteId solicitanteId fechaSolicitud');
      
      // Agregar información adicional sobre firmas
      const documentosConInfo = documentos.map(doc => {
        const docObj = doc.toObject();
        
        // Contar firmas realizadas
        docObj.numeroFirmas = docObj.firmantes ? docObj.firmantes.length : 0;
        
        // Contar solicitudes pendientes
        const solicitudesPendientes = docObj.solicitudesFirma ? 
          docObj.solicitudesFirma.filter(s => s.estado === 'pendiente').length : 0;
        
        docObj.solicitudesPendientes = solicitudesPendientes;
        
        return docObj;
      });
      
      res.json(documentosConInfo);
    } catch (error) {
      console.error('Error al listar documentos:', error);
      res.status(500).json({ error: 'Error al listar documentos' });
    }
  },

  // Listar documentos firmados por el usuario (NUEVO)
  listarDocumentosFirmados: async (req, res) => {
    try {
      // Verificar que el usuario esté autenticado
      if (!req.usuario || !req.usuario.id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      // Buscar documentos donde el usuario es firmante
      const documentos = await Documento.find({
        'firmantes.usuarioId': req.usuario.id,
        estado: 'activo'
      })
      .populate('usuario', 'nombre email')
      .populate('firmantes.usuarioId', 'nombre email')
      .populate('solicitudesFirma', 'estado firmanteId solicitanteId fechaSolicitud');
      
      // Filtrar solo los documentos donde el usuario actual es firmante
      const documentosFirmados = documentos.filter(doc => {
        return doc.firmantes && doc.firmantes.some(firmante => 
          firmante.usuarioId && firmante.usuarioId._id.toString() === req.usuario.id
        );
      });

      // Agregar información adicional
      const documentosConInfo = documentosFirmados.map(doc => {
        const docObj = doc.toObject();
        
        // Encontrar la información de firma específica del usuario
        const firmaUsuario = docObj.firmantes.find(f => 
          f.usuarioId && f.usuarioId._id.toString() === req.usuario.id
        );
        
        docObj.miFirma = firmaUsuario;
        docObj.numeroFirmas = docObj.firmantes ? docObj.firmantes.length : 0;
        
        return docObj;
      });
      
      res.json(documentosConInfo);
    } catch (error) {
      console.error('Error al listar documentos firmados:', error);
      res.status(500).json({ error: 'Error al listar documentos firmados' });
    }
  },

  eliminarDocumento: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Verificar que el usuario esté autenticado
      if (!req.usuario || !req.usuario.id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      // Buscar el documento y verificar que pertenezca al usuario
      const doc = await Documento.findById(id);
      if (!doc) {
        return res.status(404).json({ error: 'Documento no encontrado' });
      }

      // Verificar que el documento pertenezca al usuario autenticado
      if (doc.usuario.toString() !== req.usuario.id) {
        return res.status(403).json({ error: 'No tienes permisos para eliminar este documento' });
      }

      // Marcar como eliminado
      doc.estado = 'eliminado';
      await doc.save();
      
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
      
      // Verificar que el usuario esté autenticado
      if (!req.usuario || !req.usuario.id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      const doc = await Documento.findById(id);
      if (!doc) {
        return res.status(404).json({ error: 'Documento no encontrado' });
      }

      // Verificar que el documento pertenezca al usuario autenticado O que tenga solicitudes de firma pendientes
      const isOwner = doc.usuario.toString() === req.usuario.id;
      
      if (!isOwner) {
        // Verificar si el usuario tiene solicitudes de firma pendientes para este documento
        const SolicitudFirma = require('../models/SolicitudFirma');
        const solicitudPendiente = await SolicitudFirma.findOne({
          documentoId: doc._id,
          firmanteId: req.usuario.id,
          estado: 'pendiente'
        });
        
        if (!solicitudPendiente) {
          return res.status(403).json({ error: 'No tienes permisos para acceder a este documento' });
        }
      }

      // Enviar el archivo PDF
      res.sendFile(require('path').resolve(doc.ruta));
    } catch (error) {
      console.error('Error al obtener documento:', error);
      res.status(500).json({ error: 'Error al obtener el documento' });
    }
  },

  infoDocumento: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Verificar que el usuario esté autenticado
      if (!req.usuario || !req.usuario.id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      const doc = await Documento.findById(id);
      if (!doc) {
        console.error('Documento no encontrado en la base de datos:', id);
        return res.status(404).json({ error: 'Documento no encontrado' });
      }

      // Verificar que el documento pertenezca al usuario autenticado O que tenga solicitudes de firma pendientes
      const isOwner = doc.usuario.toString() === req.usuario.id;
      
      if (!isOwner) {
        // Verificar si el usuario tiene solicitudes de firma pendientes para este documento
        const SolicitudFirma = require('../models/SolicitudFirma');
        const solicitudPendiente = await SolicitudFirma.findOne({
          documentoId: doc._id,
          firmanteId: req.usuario.id,
          estado: 'pendiente'
        });
        
        if (!solicitudPendiente) {
          return res.status(403).json({ error: 'No tienes permisos para acceder a este documento' });
        }
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
  },

  descargarDocumento: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Verificar que el usuario esté autenticado
      if (!req.usuario || !req.usuario.id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      const doc = await Documento.findById(id);
      
      if (!doc) {
        return res.status(404).json({ error: 'Documento no encontrado' });
      }

      // Verificar que el documento pertenezca al usuario autenticado
      if (doc.usuario.toString() !== req.usuario.id) {
        return res.status(403).json({ error: 'No tienes permisos para descargar este documento' });
      }

      if (!fs.existsSync(doc.ruta)) {
        return res.status(404).json({ error: 'Archivo PDF no encontrado en el servidor' });
      }

      // Configurar headers para descarga
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="firmado_${doc.nombre}"`);
      
      // Enviar el archivo
      res.sendFile(require('path').resolve(doc.ruta));
      
    } catch (error) {
      console.error('Error al descargar documento:', error);
      res.status(500).json({ error: 'Error al descargar el documento' });
    }
  }
};

module.exports = documentoController; 