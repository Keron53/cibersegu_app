// Configuración del WebSocket
export const WEBSOCKET_CONFIG = {
  // Opciones de conexión
  options: {
    transports: ['websocket', 'polling'], // Fallback a polling si WebSocket falla
    timeout: 10000, // Timeout de 10 segundos
    forceNew: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
  }
};

// Función para obtener la URL del WebSocket
export const getWebSocketUrl = () => {
  // En desarrollo, usar localhost:3000
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3000';
  }
  
  // En producción, usar la URL del WebSocket a través de nginx
  // El WebSocket está configurado en /socket.io/ en el mismo dominio
  return window.location.origin;
};

// Función de emergencia: siempre conectar al puerto 3000
export const getWebSocketUrlEmergency = () => {
  return 'http://localhost:3000';
};
