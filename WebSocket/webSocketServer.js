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

  // Heurística: aunque no venga tipo, detectar por campos característicos
  const pareceSolicitudMultiple =
    tipoNormalizado === 'solicitud_multiple' ||
    (doc && typeof doc === 'object' && 'solicitudId' in doc && 'documentoNombre' in doc && 'solicitanteNombre' in doc);

  console.log(`📨 Intentando enviar notificación a usuario ${userId}:`);
  console.log('🔍 Documento normalizado:', JSON.stringify(doc, null, 2));
  console.log('🔍 Tipo normalizado:', tipoNormalizado, '→ Parece solicitud múltiple:', pareceSolicitudMultiple);

  if (connectedUsers[userId]) {
    if (pareceSolicitudMultiple) {
      // Emitir evento específico de solicitud múltiple
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