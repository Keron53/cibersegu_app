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
  // Endpoint para firma visual con QR usando pyHanko (DEPRECATED - usar   const command = `python "${pythonScr  const command = `python "${pythonScr  const command = `python "${pythonScr  const command = `python "${pythonScr  const command = `python "${pythonScr  const command = `python "${pythonScr  const command = `python "${pythonScr  const command = `python "${pythonScr  const command = `python "${pythonScr  const command = `python "${pythonScriptPath}" "${tempCert}" "${password}" "${tempPdfInput}" "${tempPdfOutput}" "1" "0" "0" "0" "0" "${tempCaCert}"`;DocumentoQRNode)
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
      const { x, y, page} = req.body; // <--- Agrega esto

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

      // COORDENADAS TOTALMENTE FIJAS - Hardcodeadas en el script Python
      console.log('📊 Posición fija hardcodeada en Python: (40, 96.7) - 2 cm más arriba');

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

      // COORDENADAS TOTALMENTE FIJAS - El script Python las ignora y usa coordenadas hardcodeadas
      console.log('📊 Coordenadas fijas hardcodeadas en Python: (40, 96.7, 140, 196.7)');

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

      // Ejecutar el script de Python con pyHanko (coordenadas fijas hardcodeadas en Python)
       const x1 = x;
       const y1 = y;
       const x2 = x + 150;
       const y2 = y + 100;
       
       const command = `python "${pythonScriptPath}" "${tempCert}" "${password}" "${tempPdfInput}" "${tempPdfOutput}" "${page}" "${x1}" "${y1}" "${x2}" "${y2}" "${tempCaCert}"`;
      
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
      // AGREGA canvasWidth y canvasHeight aquí:
      const { certificadoId, password, nombre, organizacion, email, x, y, page, canvasWidth, canvasHeight } = req.body;

      console.log('📋 Datos recibidos:', { documentoId, certificadoId, nombre, organizacion, email, x, y, page, canvasWidth, canvasHeight});

      // Verificar que el documento existe
      const documento = await Documento.findById(documentoId);
      if (!documento) {
        console.error('❌ Documento no encontrado:', documentoId);
        return res.status(404).json({ error: 'Documento no encontrado' });
      }

      console.log('✅ Documento encontrado:', documento.nombre);

      // Verificar que el usuario es el propietario del documento
      if (documento.usuario.toString() !== req.usuario.id) {
        console.error('❌ Usuario no autorizado para firmar este documento');
        return res.status(403).json({ error: 'No tienes permisos para firmar este documento' });
      }

      // Verificar que el usuario no haya firmado ya este documento
      const yaFirmo = documento.firmantes && documento.firmantes.some(firmante => 
        firmante.usuarioId && firmante.usuarioId.toString() === req.usuario.id
      );

      if (yaFirmo) {
        console.log('❌ Usuario ya firmó este documento');
        return res.status(400).json({ error: 'Ya has firmado este documento' });
      }

      // Obtener el certificado
      const certificado = await Certificate.findById(certificadoId);
      if (!certificado) {
        console.error('❌ Certificado no encontrado:', certificadoId);
        return res.status(404).json({ error: 'Certificado no encontrado' });
      }

      console.log('✅ Certificado encontrado:', certificado.nombreComun);
      console.log('📊 Datos del certificado:', {
        tieneDatosCifrados: !!(certificado.certificateData || certificado.datosCifrados),
        tieneSalt: !!certificado.encryptionSalt,
        tieneKey: !!certificado.encryptionKey,
        tamanioDatos: (certificado.certificateData || certificado.datosCifrados) ? (certificado.certificateData || certificado.datosCifrados).length : 0
      });

      // Validar la contraseña primero
      console.log('🔑 Validando contraseña del certificado...');
      try {
        const validation = await CertificateManager.validatePassword(
          certificado.certificateData || certificado.datosCifrados,
          certificado.encryptionSalt,
          certificado.encryptionKey,
          password
        );

        if (!validation.valid) {
          console.error('❌ Validación de contraseña fallida:', validation.error || 'Contraseña incorrecta');
          return res.status(400).json({ 
            error: validation.error || 'Contraseña incorrecta',
            code: 'INVALID_PASSWORD'
          });
        }
        console.log('✅ Contraseña validada correctamente');
      } catch (validationError) {
        console.error('❌ Error en validación de contraseña:', validationError.message);
        return res.status(400).json({ 
          error: 'Error al validar la contraseña',
          code: 'VALIDATION_ERROR',
          details: process.env.NODE_ENV === 'development' ? validationError.message : undefined
        });
      }

      // Si la validación es exitosa, proceder con el descifrado completo
      console.log('🔓 Descifrando certificado...');
      let certBuffer;
      try {
        certBuffer = CertificateManager.decryptCertificate(
          certificado.certificateData || certificado.datosCifrados, 
          certificado.encryptionSalt, 
          certificado.encryptionKey, 
          password
        );
        
        console.log('✅ Certificado descifrado, tamaño:', certBuffer.length);
        
        // Verificar que el buffer no esté vacío
        if (!certBuffer || certBuffer.length === 0) {
          throw new Error('El certificado descifrado está vacío');
        }
        
        // Verificar que el buffer tenga el formato PKCS#12 correcto
        if (certBuffer.length < 4) {
          throw new Error('El certificado descifrado es demasiado pequeño para ser un PKCS#12 válido');
        }
        
        // Verificar que comience con la secuencia PKCS#12 (0x30)
        if (certBuffer[0] !== 0x30) {
          console.warn('⚠️ El certificado descifrado no parece tener el formato PKCS#12 correcto');
        }
        
      } catch (decryptError) {
        console.error('❌ Error descifrando certificado después de validación exitosa:', decryptError.message);
        return res.status(500).json({ 
          error: 'Contraseña incorrecta',
          code: 'DECRYPTION_ERROR',
          details: process.env.NODE_ENV === 'development' ? decryptError.message : undefined
        });
      }

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
      
             // COORDENADAS TOTALMENTE FIJAS - El script Python las ignora y usa coordenadas hardcodeadas
       console.log('📊 Coordenadas fijas hardcodeadas en Python: (40, 96.7, 140, 196.7)');
       
       // Calcular las coordenadas reales
       const x1 = x;
       const y1 = y;
       const x2 = x + 150;
       const y2 = y + 100;
       
       const command = `python "${pythonScriptPath}" "${tempCert}" "${password}" "${tempPdfInput}" "${tempPdfOutput}" "${page}" "${x1}" "${y1}" "${x2}" "${y2}" "${tempCaCert}"`;
      
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
      
      // Guardar información de la firma en la base de datos usando el nuevo sistema de firmantes
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

      // Actualizar el documento con la información del firmante usando el nuevo sistema
      await Documento.findByIdAndUpdate(documento._id, {
        $push: {
          firmantes: {
            usuarioId: req.usuario.id,
            nombre: req.usuario.nombre,
            email: req.usuario.email,
            fechaFirma: new Date(),
            posicion: {
              x: 40,
              y: 96.7,
              page: 1
            }
          }
        }
      });
      
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

      // Notificar al propietario del documento por WebSocket (si no es el mismo que lo firmó)
      if (documento.usuario.toString() !== req.usuario.id) {
        try {
          const { enviarNotificacionWebSocket } = require('./solicitudMultipleController');
          
          await enviarNotificacionWebSocket(documento.usuario, {
            tipo: 'documento_firmado',
            documentoId: documento._id.toString(),
            documentoNombre: documento.nombre,
            firmanteNombre: req.usuario.nombre,
            firmanteEmail: req.usuario.email,
            mensaje: `${req.usuario.nombre} ha firmado tu documento "${documento.nombre}"`,
            fechaFirma: new Date().toISOString(),
            timestamp: new Date().toISOString()
          });
          console.log('✅ Notificación WebSocket de documento firmado enviada al propietario');
        } catch (wsError) {
          console.error('⚠️ Error enviando notificación WebSocket:', wsError.message);
        }
      }

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

      // Obtener documentos propios del usuario
      const documentosPropios = await Documento.find({ 
        usuario: req.usuario.id,
        estado: 'activo' 
      })
      .populate('usuario', 'nombre email')
      .populate('firmantes.usuarioId', 'nombre email')
      .populate('solicitudesFirma', 'estado firmanteId solicitanteId fechaSolicitud');

      // Obtener documentos compartidos con el usuario
      const DocumentoCompartido = require('../models/DocumentoCompartido');
      const documentosCompartidos = await DocumentoCompartido.find({
        usuarioId: req.usuario.id,
        activo: true
      })
      .populate({
        path: 'documentoId',
        populate: [
          { path: 'usuario', select: 'nombre email' },
          { path: 'firmantes.usuarioId', select: 'nombre email' },
          { path: 'solicitudesFirma', select: 'estado firmanteId solicitanteId fechaSolicitud' }
        ]
      });

      // Combinar documentos propios y compartidos
      const todosLosDocumentos = [...documentosPropios];

      // Agregar documentos compartidos (solo si el documento existe y está activo)
      documentosCompartidos.forEach(compartido => {
        if (compartido.documentoId && compartido.documentoId.estado === 'activo') {
          const docObj = compartido.documentoId.toObject();
          docObj.esCompartido = true;
          docObj.tipoAcceso = compartido.tipoAcceso;
          docObj.permisos = compartido.permisos;
          docObj.fechaAcceso = compartido.fechaAcceso;
          todosLosDocumentos.push(docObj);
        }
      });

      // Agregar información adicional sobre firmas
      const documentosConInfo = todosLosDocumentos.map(doc => {
        // Verificar si es un objeto de Mongoose válido
        const docObj = doc && typeof doc.toObject === 'function' ? doc.toObject() : doc;
        
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
        // Verificar si es un objeto de Mongoose válido
        const docObj = doc && typeof doc.toObject === 'function' ? doc.toObject() : doc;
        
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

  // Listar documentos compartidos con el usuario (NUEVO)
  listarDocumentosCompartidos: async (req, res) => {
    try {
      // Verificar que el usuario esté autenticado
      if (!req.usuario || !req.usuario.id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      // Obtener documentos compartidos con el usuario
      const DocumentoCompartido = require('../models/DocumentoCompartido');
      const documentosCompartidos = await DocumentoCompartido.find({
        usuarioId: req.usuario.id,
        activo: true
      })
      .populate({
        path: 'documentoId',
        populate: [
          { path: 'usuario', select: 'nombre email' },
          { path: 'firmantes.usuarioId', select: 'nombre email' },
          { path: 'solicitudesFirma', select: 'estado firmanteId solicitanteId fechaSolicitud' }
        ]
      });

      // Filtrar solo documentos activos y agregar información
      const documentosConInfo = documentosCompartidos
        .filter(compartido => compartido.documentoId && compartido.documentoId.estado === 'activo')
        .map(compartido => {
          // Verificar si es un objeto de Mongoose válido
          const docObj = compartido.documentoId && typeof compartido.documentoId.toObject === 'function' 
            ? compartido.documentoId.toObject() 
            : compartido.documentoId;
          
          docObj.esCompartido = true;
          docObj.tipoAcceso = compartido.tipoAcceso;
          docObj.permisos = compartido.permisos;
          docObj.fechaAcceso = compartido.fechaAcceso;
          docObj.numeroFirmas = docObj.firmantes ? docObj.firmantes.length : 0;
          
          return docObj;
        });
      
      res.json(documentosConInfo);
    } catch (error) {
      console.error('Error al listar documentos compartidos:', error);
      res.status(500).json({ error: 'Error al listar documentos compartidos' });
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

      const doc = await Documento.findById(id).populate('usuario', 'nombre email');
      if (!doc) {
        return res.status(404).json({ error: 'Documento no encontrado' });
      }

      // Verificar que el documento pertenezca al usuario autenticado O que tenga solicitudes de firma pendientes O que ya haya firmado
      const isOwner = doc.usuario._id.toString() === req.usuario.id;
      
      if (!isOwner) {
        // Verificar si el usuario tiene solicitudes de firma pendientes para este documento
        const SolicitudFirma = require('../models/SolicitudFirma');
        const solicitudPendiente = await SolicitudFirma.findOne({
          documentoId: doc._id,
          firmanteId: req.usuario.id,
          estado: 'pendiente'
        });
        
        // Verificar si el usuario ya firmó este documento
        const yaFirmo = doc.firmantes && doc.firmantes.some(firmante => 
          firmante.usuarioId && firmante.usuarioId.toString() === req.usuario.id
        );
        
        if (!solicitudPendiente && !yaFirmo) {
          return res.status(403).json({ error: 'No tienes permisos para acceder a este documento' });
        }
      }

      // Devolver el archivo PDF real
      if (!fs.existsSync(doc.ruta)) {
        return res.status(404).json({ error: 'Archivo PDF no encontrado en el servidor' });
      }

      // Enviar el archivo PDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${doc.nombre}"`);
      res.sendFile(doc.ruta);
    } catch (error) {
      console.error('Error al obtener documento:', error);
      res.status(500).json({ error: 'Error al obtener el documento' });
    }
  },

  obtenerInfoDocumento: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Verificar que el usuario esté autenticado
      if (!req.usuario || !req.usuario.id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      const doc = await Documento.findById(id).populate('usuario', 'nombre email');
      if (!doc) {
        return res.status(404).json({ error: 'Documento no encontrado' });
      }

      // Verificar que el documento pertenezca al usuario autenticado O que tenga solicitudes de firma pendientes O que ya haya firmado
      const isOwner = doc.usuario._id.toString() === req.usuario.id;
      
      if (!isOwner) {
        // Verificar si el usuario tiene solicitudes de firma pendientes para este documento
        const SolicitudFirma = require('../models/SolicitudFirma');
        const solicitudPendiente = await SolicitudFirma.findOne({
          documentoId: doc._id,
          firmanteId: req.usuario.id,
          estado: 'pendiente'
        });
        
        // Verificar si el usuario ya firmó este documento
        const yaFirmo = doc.firmantes && doc.firmantes.some(firmante => 
          firmante.usuarioId && firmante.usuarioId.toString() === req.usuario.id
        );
        
        if (!solicitudPendiente && !yaFirmo) {
          return res.status(403).json({ error: 'No tienes permisos para acceder a este documento' });
        }
      }

      // Devolver solo la información del documento (metadatos)
      res.json({ 
        documento: {
          _id: doc._id,
          nombre: doc.nombre,
          ruta: doc.ruta,
          usuario: doc.usuario,
          firmas: doc.firmas || [],
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt
        }
      });
    } catch (error) {
      console.error('Error al obtener info del documento:', error);
      res.status(500).json({ error: 'Error al obtener la información del documento' });
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

      // Verificar que el documento pertenezca al usuario autenticado O que tenga solicitudes de firma pendientes O que ya haya firmado
      const isOwner = doc.usuario.toString() === req.usuario.id;
      
      if (!isOwner) {
        // Verificar si el usuario tiene solicitudes de firma pendientes para este documento
        const SolicitudFirma = require('../models/SolicitudFirma');
        const solicitudPendiente = await SolicitudFirma.findOne({
          documentoId: doc._id,
          firmanteId: req.usuario.id,
          estado: 'pendiente'
        });
        
        // Verificar si el usuario ya firmó este documento
        const yaFirmo = doc.firmantes && doc.firmantes.some(firmante => 
          firmante.usuarioId && firmante.usuarioId.toString() === req.usuario.id
        );
        
        if (!solicitudPendiente && !yaFirmo) {
          return res.status(404).json({ error: 'Documento no encontrado' });
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

      // Verificar que el documento pertenezca al usuario autenticado O que tenga solicitudes de firma pendientes O que ya haya firmado
      const isOwner = doc.usuario.toString() === req.usuario.id;
      
      if (!isOwner) {
        // Verificar si el usuario tiene solicitudes de firma pendientes para este documento
        const SolicitudFirma = require('../models/SolicitudFirma');
        const solicitudPendiente = await SolicitudFirma.findOne({
          documentoId: doc._id,
          firmanteId: req.usuario.id,
          estado: 'pendiente'
        });
        
        // Verificar si el usuario ya firmó este documento
        const yaFirmo = doc.firmantes && doc.firmantes.some(firmante => 
          firmante.usuarioId && firmante.usuarioId.toString() === req.usuario.id
        );
        
        if (!solicitudPendiente && !yaFirmo) {
          return res.status(403).json({ error: 'No tienes permisos para descargar este documento' });
        }
      }

      if (!fs.existsSync(doc.ruta)) {
        return res.status(404).json({ error: 'Archivo PDF no encontrado en el servidor' });
      }

      // Configurar headers para descarga
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${doc.nombre}"`);
      
      // Enviar el archivo
      res.sendFile(require('path').resolve(doc.ruta));
      
    } catch (error) {
      console.error('Error al descargar documento:', error);
      // Si ya se configuraron headers de PDF, no podemos enviar JSON
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error al descargar el documento' });
      } else {
        // Si ya se enviaron headers, terminar la respuesta
        res.end();
      }
    }
  }
};

module.exports = documentoController;