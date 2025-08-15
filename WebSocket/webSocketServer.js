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

app.post('/emitir', (req, res) => {
  const { userId, documento } = req.body;
  if (connectedUsers[userId]) {
    io.to(connectedUsers[userId]).emit('mensaje', documento);
    console.log(`📨 Notificación enviada al usuario ${userId}`);
    res.send({ message: `Notificación enviada al usuario ${userId}` });
  } else {
    console.log(`⚠️ Usuario ${userId} no está conectado`);
    res.status(404).send({ message: 'Usuario no conectado' });
  }
});

server.listen(3000, () => {
  console.log('🟢 Servidor WebSocket corriendo en http://localhost:3000');
});