import { io, Socket } from 'socket.io-client';

let socket = null;

// URL del WebSocket tomada de la variable de entorno
const WS_URL = import.meta.env.VITE_WS_URL || window.location.origin;

/**
 * Conectar al servidor de WebSocket
 * @param {string} userId - ID del usuario para registrar la sesión
 */
export const connectSocket = (userId) => {
  if (socket) return socket;

  socket = io(WS_URL, {
    transports: ['websocket']
  });

  socket.on('connect', () => {
    console.log('🔌 Conectado al servidor WebSocket con ID:', socket.id);

    if (userId) {
      socket.emit('registrarUsuario', userId);
      console.log(`✅ Usuario ${userId} registrado en WebSocket`);
    }
  });

  socket.on('disconnect', () => {
    console.log('❌ Desconectado del servidor WebSocket');
  });

  socket.on('mensaje', (documento) => {
    console.log('📨 Notificación recibida:', documento);
    // Aquí puedes actualizar estados o disparar notificaciones
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
