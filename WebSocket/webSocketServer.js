const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      'https://af-systemstechnology.com', 
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173'
    ],
    methods: ['GET', 'POST'],
    credentials: true
  }
});


app.use(cors());
app.use(express.json());

let connectedUsers = {};

io.on('connection', (socket) => {
  console.log('🔌 Cliente conectado:', socket.id);

  socket.on('registrarUsuario', (userId) => {
    connectedUsers[userId] = socket.id;
    console.log(`✅ Usuario ${userId} registrado con socket ${socket.id}`);
  });

  socket.on('disconnect', () => {
    console.log('❌ Cliente desconectado:', socket.id);
    for (const userId in connectedUsers) {
      if (connectedUsers[userId] === socket.id) {
        delete connectedUsers[userId];
        break;
      }
    }
  });
});

// Endpoint de prueba para verificar WebSocket
app.get('/test', (req, res) => {
  res.json({
    message: 'Servidor WebSocket funcionando',
    usuariosConectados: Object.keys(connectedUsers),
    timestamp: new Date().toISOString()
  });
});

app.post('/emitir', (req, res) => {
  const { userId, documento } = req.body;

  // Normalizar el payload de documento
  let doc = documento;
  if (typeof doc === 'string') {
    try {
      doc = JSON.parse(doc);
    } catch (e) {
      console.warn('⚠️ Documento llegó como string no-JSON. Usando valor crudo.');
    }
  }

  // Algunos emisores podrían mandar { documento: {...} } anidado
  if (doc && typeof doc === 'object' && doc.documento && !doc.tipo) {
    doc = doc.documento;
  }

  const tipoNormalizado = (doc && doc.tipo ? String(doc.tipo) : '').trim().toLowerCase();

  // Detectar diferentes tipos de notificaciones
  const pareceSolicitudMultiple =
    tipoNormalizado === 'solicitud_multiple' ||
    (doc && typeof doc === 'object' && 'solicitudId' in doc && 'documentoNombre' in doc && 'solicitanteNombre' in doc);

  const esFirmaCompletada = tipoNormalizado === 'firma_completada';
  const esFirmaRechazada = tipoNormalizado === 'firma_rechazada' || tipoNormalizado === 'firma_rechazada_individual';
  const esDocumentoFirmado = tipoNormalizado === 'documento_firmado';

  console.log(`📨 Intentando enviar notificación a usuario ${userId}:`);
  console.log('🔍 Documento normalizado:', JSON.stringify(doc, null, 2));
  console.log('🔍 Tipo normalizado:', tipoNormalizado);
  console.log('🔍 Es firma completada:', esFirmaCompletada);
  console.log('🔍 Es firma rechazada:', esFirmaRechazada);
  console.log('🔍 Es documento firmado:', esDocumentoFirmado);
  console.log('🔍 Parece solicitud múltiple:', pareceSolicitudMultiple);

  if (connectedUsers[userId]) {
    // Manejar firma completada
    if (esFirmaCompletada) {
      io.to(connectedUsers[userId]).emit('firma_completada', {
        tipo: 'firma_completada',
        solicitudId: doc.solicitudId,
        titulo: doc.titulo,
        documentoNombre: doc.documentoNombre,
        firmanteNombre: doc.firmanteNombre,
        firmanteEmail: doc.firmanteEmail,
        mensaje: doc.mensaje,
        porcentajeCompletado: doc.porcentajeCompletado,
        firmasCompletadas: doc.firmasCompletadas,
        totalFirmantes: doc.totalFirmantes,
        fechaFirma: doc.fechaFirma,
        timestamp: doc.timestamp
      });
      console.log(`✅ Notificación de firma completada enviada al usuario ${userId}`);
      res.send({ message: `Notificación de firma completada enviada al usuario ${userId}`, tipo: 'firma_completada', timestamp: new Date().toISOString() });
      return;
    }

    // Manejar firma rechazada
    if (esFirmaRechazada) {
      io.to(connectedUsers[userId]).emit('firma_rechazada', {
        tipo: doc.tipo,
        solicitudId: doc.solicitudId,
        titulo: doc.titulo,
        documentoNombre: doc.documentoNombre,
        firmanteNombre: doc.firmanteNombre,
        firmanteEmail: doc.firmanteEmail,
        motivo: doc.motivo,
        mensaje: doc.mensaje,
        fechaRechazo: doc.fechaRechazo,
        estadoSolicitud: doc.estadoSolicitud,
        timestamp: doc.timestamp
      });
      console.log(`❌ Notificación de firma rechazada enviada al usuario ${userId}`);
      res.send({ message: `Notificación de firma rechazada enviada al usuario ${userId}`, tipo: 'firma_rechazada', timestamp: new Date().toISOString() });
      return;
    }

    // Manejar documento firmado (individual)
    if (esDocumentoFirmado) {
      io.to(connectedUsers[userId]).emit('documento_firmado', {
        tipo: 'documento_firmado',
        documentoId: doc.documentoId,
        documentoNombre: doc.documentoNombre,
        firmanteNombre: doc.firmanteNombre,
        firmanteEmail: doc.firmanteEmail,
        mensaje: doc.mensaje,
        fechaFirma: doc.fechaFirma,
        timestamp: doc.timestamp
      });
      console.log(`📝 Notificación de documento firmado enviada al usuario ${userId}`);
      res.send({ message: `Notificación de documento firmado enviada al usuario ${userId}`, tipo: 'documento_firmado', timestamp: new Date().toISOString() });
      return;
    }

    // Solicitud múltiple (original)
    if (pareceSolicitudMultiple) {
      io.to(connectedUsers[userId]).emit('solicitud_multiple', {
        tipo: 'solicitud_multiple',
        solicitudId: doc.solicitudId,
        titulo: doc.titulo,
        documentoNombre: doc.documentoNombre,
        solicitanteNombre: doc.solicitanteNombre,
        mensaje: doc.mensaje,
        fechaExpiracion: doc.fechaExpiracion,
        timestamp: new Date().toISOString()
      });
      console.log(`📋 Notificación de solicitud múltiple enviada al usuario ${userId}`);
      res.send({ message: `Notificación enviada al usuario ${userId}`, tipo: 'solicitud_multiple', timestamp: new Date().toISOString() });
      return;
    }

    // Fallback: notificación genérica
    io.to(connectedUsers[userId]).emit('mensaje', doc);
    console.log(`📨 Notificación genérica enviada al usuario ${userId}`);
    res.send({ message: `Notificación enviada al usuario ${userId}`, tipo: 'mensaje', timestamp: new Date().toISOString() });
  } else {
    console.log(`⚠️ Usuario ${userId} no está conectado. Usuarios conectados:`, Object.keys(connectedUsers));
    res.status(404).send({ message: 'Usuario no conectado', usuariosConectados: Object.keys(connectedUsers) });
  }
});

server.listen(3000, () => {
  console.log('🟢 Servidor WebSocket corriendo en http://localhost:3000');
});