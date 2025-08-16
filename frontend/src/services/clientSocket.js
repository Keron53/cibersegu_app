import { io, Socket } from 'socket.io-client';

let socket = null;

// URL del WebSocket - usar la misma URL del frontend para evitar problemas de CSP
const WS_URL = window.location.origin;

/**
 * Conectar al servidor de WebSocket
 * @param {string} userId - ID del usuario para registrar la sesión
 */
export const connectSocket = (userId) => {
  if (socket) return socket;

  // Intentar conectar usando la misma URL del frontend
  const socketUrl = window.location.origin;
  console.log('🔌 Intentando conectar a WebSocket:', socketUrl);

  socket = io(socketUrl, {
    transports: ['websocket', 'polling'], // Fallback a polling si WebSocket falla
    timeout: 10000, // Timeout de 10 segundos
    forceNew: true
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

  socket.on('connect_error', (error) => {
    console.error('❌ Error de conexión WebSocket:', error);
    console.log('💡 Intentando fallback a polling...');
  });

  socket.on('error', (error) => {
    console.error('❌ Error en WebSocket:', error);
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
