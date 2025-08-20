const { io } = require('socket.io-client'); // para Node.js
const fetch = require('node-fetch');

const SolicitudFirma = require('../models/SolicitudFirma');
const Documento = require('../models/Documento');
const Usuario = require('../models/Usuario');
const Certificate = require('../models/Certificate');
const CertificateManager = require('../utils/CertificateManager');
const emailService = require('../services/emailService');
const { execSync } = require('child_process');
const fs = require('fs-extra');
const tmp = require('tmp');
const path = require('path');

const solicitudFirmaController = {
  // Crear solicitud de firma
  crearSolicitud: async (req, res) => {
    try {
      const {
        documentoId,
        firmanteId,
        posicionFirma,
        mensaje,
        prioridad = 'normal'
      } = req.body;

      console.log('🔍 Creando solicitud de firma...');
      console.log('📋 Datos recibidos:', { documentoId, firmanteId, posicionFirma, mensaje });

      // Verificar que el documento existe y pertenece al solicitante
      const documento = await Documento.findOne({
        _id: documentoId,
        usuario: req.usuario.id
      });

      if (!documento) {
        console.error('❌ Documento no encontrado:', documentoId);
        return res.status(404).json({ error: 'Documento no encontrado' });
      }

      console.log('✅ Documento encontrado:', documento.nombre);

      // Verificar que el firmante existe
      const firmante = await Usuario.findById(firmanteId);
      if (!firmante) {
        console.error('❌ Firmante no encontrado:', firmanteId);
        return res.status(404).json({ error: 'Usuario firmante no encontrado' });
      }

      console.log('✅ Firmante encontrado:', firmante.nombre);


       // Verificar que el solicitante existe
      const solicitante = await Usuario.findById(req.usuario.id);
      if (!solicitante) {
        console.error('❌ solicitante no encontrado:', req.usuario.id);
        return res.status(404).json({ error: 'Usuario solicitante no encontrado' });
      }

      console.log('✅ solicitante encontrado:', solicitante.nombre);


      // Verificar que no haya una solicitud pendiente para el mismo documento y firmante
      const solicitudExistente = await SolicitudFirma.findOne({
        documentoId,
        firmanteId,
        estado: 'pendiente'
      });

      if (solicitudExistente) {
        console.log('⚠️ Ya existe una solicitud pendiente para este documento y firmante');
        return res.status(400).json({
          error: 'Ya existe una solicitud pendiente para este documento y firmante'
        });
      }

      // Crear solicitud
      const solicitud = new SolicitudFirma({
        documentoId,
        solicitanteId: req.usuario.id,
        solicitanteNombre: solicitante.nombre,
        firmanteId,
        posicionFirma,
        mensaje,
        prioridad,
        fechaExpiracion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 días
      });

      await solicitud.save();

      // Actualizar documento como compartido
      await Documento.findByIdAndUpdate(documentoId, {
        esDocumentoCompartido: true,
        $push: { solicitudesFirma: solicitud._id }
      });

      console.log('✅ Solicitud creada:', solicitud._id);

      // Enviar email de notificación
      try {
        await emailService.enviarSolicitudFirma({
          firmanteEmail: firmante.email,
          firmanteNombre: firmante.nombre,
          solicitanteNombre: req.usuario.nombre,
          documentoNombre: documento.nombre,
          mensaje: mensaje,
          linkFirma: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/firmar-documento/${solicitud._id}`
        });
        console.log('✅ Email de solicitud enviado');
      } catch (emailError) {
        console.error('⚠️ Error enviando email:', emailError.message);
        // No fallar la solicitud si el email falla
      }

      // Conexión al websocket
      const socket = io('http://websocket:3000', {
        transports: ['websocket']
      });

      // Enviar el userId al conectar
      socket.on('connect', () => {
        // Si tienes el userId del backend, puedes enviarlo aquí
        socket.emit('registrarUsuario', req.usuario.id);
        console.log('🔌 Conectado al WebSocket desde backend');
        //Notificación dentro de la app      
        EnviarNotificacionWS(firmanteId, solicitud)
      });

      console.log("Id del firmante", firmanteId)



      res.json({
        message: 'Solicitud de firma enviada exitosamente',
        solicitud: {
          id: solicitud._id,
          estado: solicitud.estado,
          fechaExpiracion: solicitud.fechaExpiracion,
          firmante: {
            id: firmante._id,
            nombre: firmante.nombre,
            email: firmante.email
          }
        }
      });

    } catch (error) {
      console.error('❌ Error creando solicitud:', error);
      res.status(500).json({ error: error.message });
    }
  },



  // Listar solicitudes pendientes del usuario
  listarSolicitudesPendientes: async (req, res) => {
    try {
      console.log('🔍 Listando solicitudes pendientes para usuario:', req.usuario.id);

      const solicitudes = await SolicitudFirma.find({
        firmanteId: req.usuario.id,
        estado: 'pendiente',
        fechaExpiracion: { $gt: new Date() }
      })
        .populate('documentoId', 'nombre ruta')
        .populate('solicitanteId', 'nombre email')
        .sort({ fechaSolicitud: -1 });

      console.log(`✅ Encontradas ${solicitudes.length} solicitudes pendientes`);

      res.json(solicitudes);
    } catch (error) {
      console.error('❌ Error listando solicitudes:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Listar solicitudes enviadas por el usuario
  listarSolicitudesEnviadas: async (req, res) => {
    try {
      console.log('🔍 Listando solicitudes enviadas por usuario:', req.usuario.id);

      const solicitudes = await SolicitudFirma.find({
        solicitanteId: req.usuario.id
      })
        .populate('documentoId', 'nombre ruta')
        .populate('firmanteId', 'nombre email')
        .sort({ fechaSolicitud: -1 });

      console.log(`✅ Encontradas ${solicitudes.length} solicitudes enviadas`);

      res.json(solicitudes);
    } catch (error) {
      console.error('❌ Error listando solicitudes enviadas:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Firmar documento por solicitud
  firmarPorSolicitud: async (req, res) => {
    try {
      const { solicitudId } = req.params;
      const { certificadoId, password } = req.body;

      console.log('🔍 Firmando documento por solicitud:', solicitudId);

      const solicitud = await SolicitudFirma.findOne({
        _id: solicitudId,
        firmanteId: req.usuario.id,
        estado: 'pendiente'
      }).populate('documentoId');

      if (!solicitud) {
        console.error('❌ Solicitud no encontrada o no autorizada');
        return res.status(404).json({ error: 'Solicitud no encontrada' });
      }

      console.log('✅ Solicitud encontrada');

      // Verificar que no haya expirado
      if (new Date() > solicitud.fechaExpiracion) {
        console.log('❌ Solicitud expirada');
        solicitud.estado = 'expirado';
        await solicitud.save();
        return res.status(400).json({ error: 'La solicitud ha expirado' });
      }

      // Obtener el certificado
      const certificado = await Certificate.findById(certificadoId);
      if (!certificado) {
        console.error('❌ Certificado no encontrado:', certificadoId);
        return res.status(404).json({ error: 'Certificado no encontrado' });
      }

      console.log('✅ Certificado encontrado:', certificado.nombreComun);

      // Descifrar el certificado
      console.log('🔐 Descifrando certificado...');
      console.log('📊 Certificado ID:', certificado._id);
      console.log('📊 Nombre del certificado:', certificado.nombreComun);
      console.log('📊 Tiene salt:', !!certificado.encryptionSalt);
      console.log('📊 Tiene IV:', !!certificado.encryptionKey);
      console.log('📊 Tamaño datos cifrados:', (certificado.certificateData || certificado.datosCifrados) ? (certificado.certificateData || certificado.datosCifrados).length : 0);

      let certBuffer;
      try {
        certBuffer = CertificateManager.decryptCertificate(
          certificado.certificateData || certificado.datosCifrados,
          certificado.encryptionSalt,
          certificado.encryptionKey,
          password
        );
        console.log('✅ Certificado descifrado, tamaño:', certBuffer.length);
      } catch (decryptError) {
        console.error('❌ Error descifrando certificado:', decryptError.message);

        // Si el certificado no se puede descifrar, verificar si es un certificado del sistema
        if (!certificado.encryptionSalt && !certificado.encryptionKey) {
          console.log('🔓 Usando certificado del sistema (sin cifrado)');
          certBuffer = certificado.certificateData || certificado.datosCifrados;
        } else {
          throw new Error(`Error descifrando certificado: ${decryptError.message}. Verifica que la contraseña sea correcta.`);
        }
      }

      // Crear archivos temporales
      const tempPdfInput = tmp.tmpNameSync({ postfix: '.pdf' });
      const tempPdfOutput = tmp.tmpNameSync({ postfix: '.pdf' });
      const tempCert = tmp.tmpNameSync({ postfix: '.p12' });
      const tempCaCert = tmp.tmpNameSync({ postfix: '.pem' });

      // Copiar archivos
      fs.copyFileSync(solicitud.documentoId.ruta, tempPdfInput);
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

      const pythonScriptPath = path.join(__dirname, '../../MicroservicioPyHanko/firmar-pdf.py');

      // Usar coordenadas de la solicitud
      const { x, y, page, qrSize } = solicitud.posicionFirma;
      const command = `python "${pythonScriptPath}" "${tempCert}" "${password}" "${tempPdfInput}" "${tempPdfOutput}" "${page}" "${x}" "${y}" "${x + qrSize}" "${y + qrSize}" "${tempCaCert}"`;

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

      // Leer el PDF firmado
      const signedPdfBuffer = fs.readFileSync(tempPdfOutput);
      console.log('📄 PDF firmado leído, tamaño:', signedPdfBuffer.length);

      // Reemplazar el archivo original con el PDF firmado
      fs.writeFileSync(solicitud.documentoId.ruta, signedPdfBuffer);
      console.log('💾 Archivo original reemplazado con PDF firmado');

      // Actualizar estado de la solicitud
      solicitud.estado = 'firmado';
      solicitud.fechaFirma = new Date();
      solicitud.certificadoId = certificado._id;
      await solicitud.save();

      // Si es parte de una solicitud múltiple, actualizar su progreso
      if (solicitud.solicitudMultipleId) {
        const SolicitudMultiple = require('../models/SolicitudMultiple');
        const solicitudMultiple = await SolicitudMultiple.findById(solicitud.solicitudMultipleId);
        if (solicitudMultiple) {
          await solicitudMultiple.agregarFirma();
          await solicitudMultiple.agregarHistorial(
            'firmado',
            req.usuario.id,
            `Documento firmado por ${req.usuario.nombre}`
          );
          console.log('✅ Solicitud múltiple actualizada con nueva firma');
        }
      }

      // Actualizar documento con información del firmante y marcar como compartido
      await Documento.findByIdAndUpdate(solicitud.documentoId._id, {
        $push: {
          firmantes: {
            usuarioId: req.usuario.id,
            nombre: req.usuario.nombre,
            email: req.usuario.email,
            fechaFirma: new Date(),
            posicion: {
              x: x,
              y: y,
              page: page
            }
          },
          solicitudesFirma: solicitud._id
        },
        $set: {
          esDocumentoCompartido: true
        }
      });

      // Crear registro de documento compartido para el firmante
      const DocumentoCompartido = require('../models/DocumentoCompartido');
      await DocumentoCompartido.findOneAndUpdate(
        {
          documentoId: solicitud.documentoId._id,
          usuarioId: req.usuario.id
        },
        {
          documentoId: solicitud.documentoId._id,
          usuarioId: req.usuario.id,
          tipoAcceso: 'firmante',
          solicitudFirmaId: solicitud._id,
          permisos: {
            ver: true,
            descargar: true,
            firmar: false
          },
          activo: true
        },
        {
          upsert: true,
          new: true
        }
      );

      console.log('✅ Documento compartido con el firmante');

      console.log('✅ Solicitud actualizada como firmada');

      // Notificar al solicitante por email
      try {
        const solicitante = await Usuario.findById(solicitud.solicitanteId);
        await emailService.enviarNotificacionFirmaCompletada({
          solicitanteEmail: solicitante.email,
          solicitanteNombre: solicitante.nombre,
          firmanteNombre: req.usuario.nombre,
          documentoNombre: solicitud.documentoId.nombre
        });
        console.log('✅ Email de notificación enviado al solicitante');
      } catch (emailError) {
        console.error('⚠️ Error enviando email de notificación:', emailError.message);
      }

      // Notificar al solicitante por WebSocket
      try {
        const { enviarNotificacionWebSocket } = require('./solicitudMultipleController');
        
        // Verificar si esta solicitud es parte de una solicitud múltiple
        if (solicitud.solicitudMultipleId) {
          // Es parte de una solicitud múltiple - enviar notificación de firma completada
          const solicitudMultiple = await require('../models/SolicitudMultiple').findById(solicitud.solicitudMultipleId);
          
          await enviarNotificacionWebSocket(solicitud.solicitanteId, {
            tipo: 'firma_completada',
            solicitudId: solicitud.solicitudMultipleId.toString(),
            titulo: solicitudMultiple ? solicitudMultiple.titulo : 'Solicitud múltiple',
            documentoNombre: solicitud.documentoId.nombre,
            firmanteNombre: req.usuario.nombre,
            firmanteEmail: req.usuario.email,
            mensaje: `${req.usuario.nombre} ha firmado el documento "${solicitud.documentoId.nombre}"`,
            porcentajeCompletado: solicitudMultiple ? solicitudMultiple.porcentajeCompletado : 0,
            firmasCompletadas: solicitudMultiple ? solicitudMultiple.firmasCompletadas : 1,
            totalFirmantes: solicitudMultiple ? solicitudMultiple.totalFirmantes : 1,
            fechaFirma: new Date().toISOString(),
            timestamp: new Date().toISOString()
          });
          console.log('✅ Notificación WebSocket de firma completada (múltiple) enviada al solicitante');
        } else {
          // Es una solicitud individual - enviar notificación de documento firmado
          await enviarNotificacionWebSocket(solicitud.solicitanteId, {
            tipo: 'documento_firmado',
            documentoId: solicitud.documentoId._id.toString(),
            documentoNombre: solicitud.documentoId.nombre,
            firmanteNombre: req.usuario.nombre,
            firmanteEmail: req.usuario.email,
            mensaje: `${req.usuario.nombre} ha firmado tu documento "${solicitud.documentoId.nombre}"`,
            fechaFirma: new Date().toISOString(),
            timestamp: new Date().toISOString()
          });
          console.log('✅ Notificación WebSocket de documento firmado (individual) enviada al solicitante');
        }
      } catch (wsError) {
        console.error('⚠️ Error enviando notificación WebSocket:', wsError.message);
      }

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
        message: 'Documento firmado exitosamente',
        solicitud: {
          id: solicitud._id,
          estado: solicitud.estado,
          fechaFirma: solicitud.fechaFirma
        }
      });

    } catch (error) {
      console.error('❌ Error firmando por solicitud:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Rechazar solicitud de firma
  rechazarSolicitud: async (req, res) => {
    try {
      const { solicitudId } = req.params;
      const { motivo } = req.body;

      console.log('🔍 Rechazando solicitud:', solicitudId);

      const solicitud = await SolicitudFirma.findOne({
        _id: solicitudId,
        firmanteId: req.usuario.id,
        estado: 'pendiente'
      }).populate('solicitanteId documentoId');

      if (!solicitud) {
        return res.status(404).json({ error: 'Solicitud no encontrada' });
      }

      solicitud.estado = 'rechazado';
      await solicitud.save();

      // Notificar al solicitante por email
      try {
        await emailService.enviarNotificacionFirmaRechazada({
          solicitanteEmail: solicitud.solicitanteId.email,
          solicitanteNombre: solicitud.solicitanteId.nombre,
          firmanteNombre: req.usuario.nombre,
          documentoNombre: solicitud.documentoId.nombre,
          motivo: motivo
        });
      } catch (emailError) {
        console.error('⚠️ Error enviando email de rechazo:', emailError.message);
      }

      // Notificar al solicitante por WebSocket
      try {
        // Importar la función si no está disponible
        const { enviarNotificacionWebSocket } = require('./solicitudMultipleController');
        
        await enviarNotificacionWebSocket(solicitud.solicitanteId._id, {
          tipo: 'firma_rechazada_individual',
          solicitudId: solicitud._id.toString(),
          documentoNombre: solicitud.documentoId.nombre,
          firmanteNombre: req.usuario.nombre,
          firmanteEmail: req.usuario.email,
          motivo: motivo || 'Sin motivo especificado',
          mensaje: `${req.usuario.nombre} ha rechazado la solicitud de firma para "${solicitud.documentoId.nombre}"`,
          fechaRechazo: new Date().toISOString(),
          timestamp: new Date().toISOString()
        });
        console.log('✅ Notificación WebSocket de rechazo individual enviada al solicitante');
      } catch (wsError) {
        console.error('⚠️ Error enviando notificación WebSocket:', wsError.message);
      }

      res.json({
        message: 'Solicitud rechazada exitosamente',
        solicitud: {
          id: solicitud._id,
          estado: solicitud.estado
        }
      });

    } catch (error) {
      console.error('❌ Error rechazando solicitud:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Obtener detalles de una solicitud
  obtenerSolicitud: async (req, res) => {
    try {
      const { solicitudId } = req.params;

      const solicitud = await SolicitudFirma.findById(solicitudId)
        .populate('documentoId', 'nombre ruta')
        .populate('solicitanteId', 'nombre email')
        .populate('firmanteId', 'nombre email')
        .populate('certificadoId', 'nombreComun organizacion');

      if (!solicitud) {
        return res.status(404).json({ error: 'Solicitud no encontrada' });
      }

      // Verificar que el usuario tiene permisos para ver esta solicitud
      if (solicitud.firmanteId._id.toString() !== req.usuario.id &&
        solicitud.solicitanteId._id.toString() !== req.usuario.id) {
        return res.status(403).json({ error: 'No tienes permisos para ver esta solicitud' });
      }

      res.json(solicitud);

    } catch (error) {
      console.error('❌ Error obteniendo solicitud:', error);
      res.status(500).json({ error: error.message });
    }
  }
};



async function EnviarNotificacionWS(firmanteId, solicitud) {
  const res = await fetch(`${process.env.WEBSOCKET_URL || 'http://localhost:3000'}/emitir`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: firmanteId,
      documento: solicitud
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`WS emitir falló: ${res.status} ${text}`);
  }
}

module.exports = solicitudFirmaController; 