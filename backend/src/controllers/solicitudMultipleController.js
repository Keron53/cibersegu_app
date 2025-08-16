const SolicitudMultiple = require('../models/SolicitudMultiple');
const SolicitudFirma = require('../models/SolicitudFirma');
const Documento = require('../models/Documento');
const Usuario = require('../models/Usuario');
const emailService = require('../services/emailService');
const { execSync } = require('child_process');
const fs = require('fs');
const tmp = require('tmp');
const path = require('path');

// Usar fetch nativo de Node.js (disponible desde Node.js 18+)
// Si estás usando Node.js < 18, instala: npm install node-fetch

const solicitudMultipleController = {
  // Crear solicitud múltiple de firma
  crearSolicitudMultiple: async (req, res) => {
    try {
      const {
        documentoId,
        firmantes, // Array de IDs de usuarios
        posicionFirma,
        mensaje,
        titulo,
        descripcion,
        prioridad = 'normal',
        tipo = 'libre',
        fechaExpiracion,
        tags = []
      } = req.body;

      console.log('🔍 Creando solicitud múltiple de firma...');
      console.log('📋 Datos recibidos:', { 
        documentoId, 
        firmantesCount: firmantes?.length, 
        tipo, 
        prioridad 
      });

      // Validaciones básicas
      if (!documentoId || !firmantes || !posicionFirma || !titulo) {
        return res.status(400).json({ 
          error: 'Faltan campos requeridos: documentoId, firmantes, posicionFirma, titulo' 
        });
      }

      if (!Array.isArray(firmantes) || firmantes.length === 0) {
        return res.status(400).json({ error: 'Debe especificar al menos un firmante' });
      }

      if (firmantes.length > 5) {
        return res.status(400).json({ error: 'No se pueden agregar más de 5 firmantes' });
      }

      // Verificar que el documento existe y pertenece al usuario
      const documento = await Documento.findOne({ 
        _id: documentoId, 
        usuario: req.usuario.id 
      });

      if (!documento) {
        return res.status(404).json({ error: 'Documento no encontrado o no autorizado' });
      }

      // Verificar que todos los firmantes existen
      const firmantesUsuarios = await Usuario.find({ 
        _id: { $in: firmantes } 
      }).select('_id nombre email');

      if (firmantesUsuarios.length !== firmantes.length) {
        return res.status(400).json({ error: 'Uno o más firmantes no existen' });
      }

      // Verificar que el solicitante no esté en la lista de firmantes
      if (firmantes.includes(req.usuario.id)) {
        return res.status(400).json({ error: 'El solicitante no puede ser firmante' });
      }

      // Preparar datos de firmantes
      const firmantesData = firmantesUsuarios.map((usuario, index) => ({
        usuarioId: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        orden: index + 1,
        obligatorio: true
      }));

      // Calcular fecha de expiración
      const fechaExp = fechaExpiracion ? new Date(fechaExpiracion) : 
        new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)); // 7 días por defecto

      // Crear la solicitud múltiple
      const solicitudMultiple = new SolicitudMultiple({
        documentoId,
        solicitanteId: req.usuario.id,
        firmantes: firmantesData,
        posicionFirma,
        mensaje,
        titulo,
        descripcion,
        prioridad,
        tipo,
        fechaExpiracion: fechaExp,
        tags,
        totalFirmantes: firmantesData.length
      });

      // Guardar la solicitud múltiple
      await solicitudMultiple.save();

      // Crear solicitudes individuales para cada firmante
      const solicitudesIndividuales = [];
      for (const firmante of firmantesData) {
        const solicitudIndividual = new SolicitudFirma({
          documentoId,
          solicitanteId: req.usuario.id,
          firmanteId: firmante.usuarioId,
          posicionFirma,
          mensaje,
          estado: 'pendiente',
          fechaExpiracion: fechaExp,
          solicitudMultipleId: solicitudMultiple._id, // Referencia a la solicitud múltiple
          ordenFirma: firmante.orden
        });

        await solicitudIndividual.save();
        solicitudesIndividuales.push(solicitudIndividual);
      }

      // Enviar notificaciones por email a todos los firmantes
      try {
        for (const firmante of firmantesData) {
          await emailService.enviarSolicitudFirmaMultiple({
            firmanteEmail: firmante.email,
            firmanteNombre: firmante.nombre,
            solicitanteNombre: req.usuario.nombre,
            documentoNombre: documento.nombre,
            titulo: titulo,
            mensaje: mensaje,
            fechaExpiracion: fechaExp,
            enlace: `${process.env.FRONTEND_URL}/firmar-multiple/${solicitudMultiple._id}`
          });
        }
        console.log('✅ Notificaciones enviadas a todos los firmantes');
      } catch (emailError) {
        console.error('⚠️ Error enviando notificaciones:', emailError.message);
        // No fallar la creación por errores de email
      }

      // Enviar notificaciones por WebSocket a todos los firmantes
      try {
        for (const firmante of firmantesData) {
          await enviarNotificacionWebSocket(firmante.usuarioId, {
            tipo: 'solicitud_multiple',
            solicitudId: solicitudMultiple._id,
            titulo: titulo,
            documentoNombre: documento.nombre,
            solicitanteNombre: req.usuario.nombre,
            mensaje: mensaje,
            fechaExpiracion: fechaExp
          });
        }
        console.log('✅ Notificaciones WebSocket enviadas a todos los firmantes');
      } catch (wsError) {
        console.error('⚠️ Error enviando notificaciones WebSocket:', wsError.message);
        // No fallar la creación por errores de WebSocket
      }

      // Agregar al historial
      await solicitudMultiple.agregarHistorial(
        'creada',
        req.usuario.id,
        `Solicitud múltiple creada con ${firmantesData.length} firmantes`
      );

      console.log('✅ Solicitud múltiple creada exitosamente');

      res.status(201).json({
        message: 'Solicitud múltiple creada exitosamente',
        solicitudMultiple: {
          id: solicitudMultiple._id,
          titulo: solicitudMultiple.titulo,
          estado: solicitudMultiple.estado,
          firmantes: solicitudMultiple.firmantes.length,
          fechaExpiracion: solicitudMultiple.fechaExpiracion,
          porcentajeCompletado: solicitudMultiple.porcentajeCompletado
        },
        solicitudesIndividuales: solicitudesIndividuales.length
      });

    } catch (error) {
      console.error('❌ Error creando solicitud múltiple:', error);
      res.status(500).json({ 
        error: 'Error al crear la solicitud múltiple',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Obtener solicitudes múltiples del usuario
  obtenerSolicitudesMultiples: async (req, res) => {
    try {
      const { estado, prioridad, page = 1, limit = 10 } = req.query;
      
      // Construir filtros
      const filtros = { solicitanteId: req.usuario.id };
      if (estado) filtros.estado = estado;
      if (prioridad) filtros.prioridad = prioridad;

      // Paginación
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      const solicitudes = await SolicitudMultiple.find(filtros)
        .populate('documentoId', 'nombre ruta')
        .populate('firmantes.usuarioId', 'nombre email')
        .sort({ fechaSolicitud: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await SolicitudMultiple.countDocuments(filtros);

      res.json({
        solicitudes,
        paginacion: {
          pagina: parseInt(page),
          limite: parseInt(limit),
          total,
          paginas: Math.ceil(total / parseInt(limit))
        }
      });

    } catch (error) {
      console.error('❌ Error obteniendo solicitudes múltiples:', error);
      res.status(500).json({ error: 'Error al obtener las solicitudes múltiples' });
    }
  },

  // Obtener solicitudes múltiples pendientes del usuario (como firmante)
  obtenerSolicitudesPendientes: async (req, res) => {
    try {
      const solicitudes = await SolicitudMultiple.obtenerSolicitudesPendientes(req.usuario.id);
      
      res.json({
        solicitudes,
        total: solicitudes.length
      });

    } catch (error) {
      console.error('❌ Error obteniendo solicitudes pendientes:', error);
      res.status(500).json({ error: 'Error al obtener las solicitudes pendientes' });
    }
  },

  // Obtener detalles de una solicitud múltiple
  obtenerSolicitudMultiple: async (req, res) => {
    try {
      const { solicitudId } = req.params;

      const solicitud = await SolicitudMultiple.findById(solicitudId)
        .populate('documentoId', 'nombre ruta')
        .populate('solicitanteId', 'nombre email')
        .populate('firmantes.usuarioId', 'nombre email')
        .populate('historial.usuarioId', 'nombre');

      if (!solicitud) {
        return res.status(404).json({ error: 'Solicitud múltiple no encontrada' });
      }

      // Verificar permisos
      const esSolicitante = solicitud.solicitanteId._id.toString() === req.usuario.id;
      const esFirmante = solicitud.firmantes.some(f => 
        f.usuarioId._id.toString() === req.usuario.id
      );

      if (!esSolicitante && !esFirmante) {
        return res.status(403).json({ error: 'No tienes permisos para ver esta solicitud' });
      }

      // Obtener solicitudes individuales relacionadas
      const solicitudesIndividuales = await SolicitudFirma.find({
        solicitudMultipleId: solicitudId
      }).populate('firmanteId', 'nombre email');

      res.json({
        solicitud,
        solicitudesIndividuales,
        permisos: {
          esSolicitante,
          esFirmante,
          puedeFirmar: esFirmante && solicitud.estado !== 'completado' && solicitud.estado !== 'expirado'
        }
      });

    } catch (error) {
      console.error('❌ Error obteniendo solicitud múltiple:', error);
      res.status(500).json({ error: 'Error al obtener la solicitud múltiple' });
    }
  },

  // Firmar documento de solicitud múltiple
  firmarSolicitudMultiple: async (req, res) => {
    try {
      const { solicitudId } = req.params;
      const { certificadoId, password } = req.body;

      console.log('🔍 Firmando documento de solicitud múltiple:', solicitudId);

      // Obtener la solicitud múltiple
      const solicitudMultiple = await SolicitudMultiple.findById(solicitudId)
        .populate('documentoId', 'nombre ruta')
        .populate('solicitanteId', 'nombre email');

      if (!solicitudMultiple) {
        return res.status(404).json({ error: 'Solicitud múltiple no encontrada' });
      }

      // Verificar que el usuario es firmante
      const esFirmante = solicitudMultiple.firmantes.some(f => 
        f.usuarioId.toString() === req.usuario.id
      );

      if (!esFirmante) {
        return res.status(403).json({ error: 'No eres firmante de esta solicitud' });
      }

      // Verificar estado de la solicitud
      if (solicitudMultiple.estado === 'completado') {
        return res.status(400).json({ error: 'Esta solicitud ya está completada' });
      }

      if (solicitudMultiple.estado === 'expirado') {
        return res.status(400).json({ error: 'Esta solicitud ha expirado' });
      }

      // Verificar que no haya firmado ya
      const solicitudIndividual = await SolicitudFirma.findOne({
        solicitudMultipleId: solicitudId,
        firmanteId: req.usuario.id
      });

      if (!solicitudIndividual) {
        return res.status(404).json({ error: 'Solicitud individual no encontrada' });
      }

      if (solicitudIndividual.estado === 'firmado') {
        return res.status(400).json({ error: 'Ya has firmado este documento' });
      }

      // Aquí iría la lógica de firma del documento
      // Por ahora solo actualizamos el estado
      
      // Actualizar solicitud individual
      solicitudIndividual.estado = 'firmado';
      solicitudIndividual.fechaFirma = new Date();
      await solicitudIndividual.save();

      // Actualizar solicitud múltiple
      await solicitudMultiple.agregarFirma();

      // Agregar al historial
      await solicitudMultiple.agregarHistorial(
        'firmado',
        req.usuario.id,
        `Documento firmado por ${req.usuario.nombre}`
      );

      // Notificar al solicitante
      try {
        await emailService.enviarNotificacionFirmaCompletada({
          solicitanteEmail: solicitudMultiple.solicitanteId.email,
          solicitanteNombre: solicitudMultiple.solicitanteId.nombre,
          firmanteNombre: req.usuario.nombre,
          documentoNombre: solicitudMultiple.documentoId.nombre,
          solicitudMultiple: solicitudMultiple.titulo
        });
      } catch (emailError) {
        console.error('⚠️ Error enviando notificación:', emailError.message);
      }

      console.log('✅ Documento firmado exitosamente en solicitud múltiple');

      res.json({
        message: 'Documento firmado exitosamente',
        solicitud: {
          id: solicitudMultiple._id,
          estado: solicitudMultiple.estado,
          firmasCompletadas: solicitudMultiple.firmasCompletadas,
          totalFirmantes: solicitudMultiple.totalFirmantes,
          porcentajeCompletado: solicitudMultiple.porcentajeCompletado
        }
      });

    } catch (error) {
      console.error('❌ Error firmando solicitud múltiple:', error);
      res.status(500).json({ error: 'Error al firmar el documento' });
    }
  },

  // Cancelar solicitud múltiple
  cancelarSolicitudMultiple: async (req, res) => {
    try {
      const { solicitudId } = req.params;
      const { motivo } = req.body;

      const solicitud = await SolicitudMultiple.findById(solicitudId);

      if (!solicitud) {
        return res.status(404).json({ error: 'Solicitud múltiple no encontrada' });
      }

      // Solo el solicitante puede cancelar
      if (solicitud.solicitanteId.toString() !== req.usuario.id) {
        return res.status(403).json({ error: 'Solo el solicitante puede cancelar esta solicitud' });
      }

      // Verificar que no esté completada
      if (solicitud.estado === 'completado') {
        return res.status(400).json({ error: 'No se puede cancelar una solicitud completada' });
      }

      // Actualizar estado
      solicitud.estado = 'cancelado';
      await solicitud.save();

      // Cancelar solicitudes individuales
      await SolicitudFirma.updateMany(
        { solicitudMultipleId: solicitudId },
        { estado: 'cancelado' }
      );

      // Agregar al historial
      await solicitud.agregarHistorial(
        'cancelada',
        req.usuario.id,
        `Solicitud cancelada: ${motivo || 'Sin motivo especificado'}`
      );

      // Notificar a los firmantes
      try {
        for (const firmante of solicitud.firmantes) {
          await emailService.enviarNotificacionSolicitudCancelada({
            firmanteEmail: firmante.email,
            firmanteNombre: firmante.nombre,
            solicitanteNombre: req.usuario.nombre,
            documentoNombre: solicitud.documentoId.nombre,
            motivo: motivo || 'Sin motivo especificado'
          });
        }
      } catch (emailError) {
        console.error('⚠️ Error enviando notificaciones de cancelación:', emailError.message);
      }

      res.json({
        message: 'Solicitud múltiple cancelada exitosamente',
        solicitud: {
          id: solicitud._id,
          estado: solicitud.estado
        }
      });

    } catch (error) {
      console.error('❌ Error cancelando solicitud múltiple:', error);
      res.status(500).json({ error: 'Error al cancelar la solicitud múltiple' });
    }
  },

  // Obtener estadísticas de solicitudes múltiples
  obtenerEstadisticas: async (req, res) => {
    try {
      const userId = req.usuario.id;

      // Solicitudes como solicitante
      const solicitudesComoSolicitante = await SolicitudMultiple.countDocuments({ 
        solicitanteId: userId 
      });

      // Solicitudes como firmante
      const solicitudesComoFirmante = await SolicitudMultiple.countDocuments({
        'firmantes.usuarioId': userId
      });

      // Solicitudes completadas
      const solicitudesCompletadas = await SolicitudMultiple.countDocuments({
        $or: [
          { solicitanteId: userId },
          { 'firmantes.usuarioId': userId }
        ],
        estado: 'completado'
      });

      // Solicitudes pendientes
      const solicitudesPendientes = await SolicitudMultiple.countDocuments({
        $or: [
          { solicitanteId: userId },
          { 'firmantes.usuarioId': userId }
        ],
        estado: { $in: ['pendiente', 'parcialmente_firmado'] }
      });

      // Promedio de tiempo de completado
      const solicitudesCompletadasData = await SolicitudMultiple.find({
        $or: [
          { solicitanteId: userId },
          { 'firmantes.usuarioId': userId }
        ],
        estado: 'completado',
        fechaCompletado: { $exists: true }
      });

      let tiempoPromedio = 0;
      if (solicitudesCompletadasData.length > 0) {
        const tiempos = solicitudesCompletadasData.map(s => 
          s.fechaCompletado - s.fechaSolicitud
        );
        tiempoPromedio = tiempos.reduce((a, b) => a + b, 0) / tiempos.length;
      }

      res.json({
        estadisticas: {
          solicitudesComoSolicitante,
          solicitudesComoFirmante,
          solicitudesCompletadas,
          solicitudesPendientes,
          tiempoPromedioCompletado: Math.round(tiempoPromedio / (1000 * 60 * 60 * 24)) // días
        }
      });

    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      res.status(500).json({ error: 'Error al obtener las estadísticas' });
    }
  }
};

// Función para enviar notificaciones por WebSocket
async function enviarNotificacionWebSocket(userId, datos) {
  try {
    const response = await fetch(`${process.env.WEBSOCKET_URL || 'http://localhost:3000'}/emitir`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: userId,
        documento: datos
      })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`WebSocket emitir falló: ${response.status} ${text}`);
    }
    
    console.log(`✅ Notificación WebSocket enviada al usuario ${userId}`);
  } catch (error) {
    console.error(`❌ Error enviando notificación WebSocket al usuario ${userId}:`, error.message);
    throw error;
  }
}

module.exports = solicitudMultipleController;
