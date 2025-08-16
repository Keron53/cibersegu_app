const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['https://af-systemstechnology.com'], // agrega los que uses
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
  
  console.log(`📨 Intentando enviar notificación a usuario ${userId}:`, documento);
  
  if (connectedUsers[userId]) {
    // Enviar notificación específica según el tipo
    if (documento.tipo === 'solicitud_multiple') {
      io.to(connectedUsers[userId]).emit('solicitud_multiple', {
        tipo: 'solicitud_multiple',
        solicitudId: documento.solicitudId,
        titulo: documento.titulo,
        documentoNombre: documento.documentoNombre,
        solicitanteNombre: documento.solicitanteNombre,
        mensaje: documento.mensaje,
        fechaExpiracion: documento.fechaExpiracion,
        timestamp: new Date().toISOString()
      });
      console.log(`📋 Notificación de solicitud múltiple enviada al usuario ${userId}`);
    } else {
      // Notificación genérica
      io.to(connectedUsers[userId]).emit('mensaje', documento);
      console.log(`📨 Notificación genérica enviada al usuario ${userId}`);
    }
    
    res.send({ 
      message: `Notificación enviada al usuario ${userId}`,
      tipo: documento.tipo || 'mensaje',
      timestamp: new Date().toISOString()
    });
  } else {
    console.log(`⚠️ Usuario ${userId} no está conectado. Usuarios conectados:`, Object.keys(connectedUsers));
    res.status(404).send({ 
      message: 'Usuario no conectado',
      usuariosConectados: Object.keys(connectedUsers)
    });
  }
});

server.listen(3000, () => {
  console.log('🟢 Servidor WebSocket corriendo en http://localhost:3000');
});