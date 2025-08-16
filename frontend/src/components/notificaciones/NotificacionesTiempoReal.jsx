import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BellIcon, 
  XMarkIcon,
  DocumentIcon,
  UserIcon,
  ClockIcon,
  CheckCircleIcon,
  TrashIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import io from 'socket.io-client';
import notificationService from '../../services/notificationService';
import { getWebSocketUrl, getWebSocketUrlEmergency } from '../../config/websocket';

const NotificacionesTiempoReal = () => {
  const [notificaciones, setNotificaciones] = useState([]);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Cargar notificaciones al iniciar
  useEffect(() => {
    const loadNotifications = () => {
      const allNotifications = notificationService.getAll();
      setNotificaciones(allNotifications);
      setUnreadCount(notificationService.getUnreadCount());
    };

    loadNotifications();

    // Escuchar eventos de actualización
    const handleNotificationsUpdate = (event) => {
      setNotificaciones(event.detail.notifications);
      setUnreadCount(event.detail.unreadCount);
    };

    window.addEventListener('notificationsUpdated', handleNotificationsUpdate);
    return () => window.removeEventListener('notificationsUpdated', handleNotificationsUpdate);
  }, []);

  useEffect(() => {
    // Conectar al WebSocket usando la configuración
    const socketUrl = getWebSocketUrl();
    console.log('🔌 Intentando conectar a WebSocket:', socketUrl);
    console.log('📍 Frontend corriendo en:', window.location.origin);
    
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'], // Fallback a polling si WebSocket falla
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: 5,
      forceNew: true
    });

    newSocket.on('connect', () => {
      console.log('🔌 Conectado al WebSocket');
      console.log('🔗 URL de conexión:', socketUrl);
      console.log('🆔 Socket ID:', newSocket.id);
      setIsConnected(true);
      
      // Registrar usuario en el WebSocket
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const userId = userData._id || userData.id; // Intentar ambas posibles claves
      
      if (userId) {
        console.log('📤 Enviando evento registrarUsuario con ID:', userId);
        newSocket.emit('registrarUsuario', userId);
        console.log('✅ Evento registrarUsuario enviado');
        
        // Confirmar que el evento se envió correctamente
        setTimeout(() => {
          console.log('🔍 Estado del socket después del registro:', {
            connected: newSocket.connected,
            id: newSocket.id
          });
        }, 1000);
      } else {
        console.warn('⚠️ No se pudo obtener el ID del usuario del localStorage');
        console.log('🔍 Contenido del localStorage:', {
          user: localStorage.getItem('user'),
          userData: localStorage.getItem('userData'),
          userId: localStorage.getItem('userId')
        });
        console.log('🔍 Datos parseados del usuario:', userData);
      }
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Desconectado del WebSocket');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Error de conexión WebSocket:', error);
      setIsConnected(false);
      
      // Intentar conectar usando la URL de emergencia
      console.log('🆘 Intentando conexión de emergencia...');
      const emergencySocket = io(getWebSocketUrlEmergency(), {
        transports: ['websocket', 'polling'],
        timeout: 5000,
        forceNew: true
      });
      
      emergencySocket.on('connect', () => {
        console.log('✅ Conexión de emergencia exitosa');
        setIsConnected(true);
        setSocket(emergencySocket);
        
        // Registrar usuario en la conexión de emergencia
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const userId = userData._id || userData.id;
        
        if (userId) {
          emergencySocket.emit('registrarUsuario', userId);
          console.log('✅ Usuario registrado en WebSocket de emergencia:', userId);
        }
      });
      
      emergencySocket.on('connect_error', (emergencyError) => {
        console.error('❌ Conexión de emergencia también falló:', emergencyError);
      });
    });

    newSocket.on('error', (error) => {
      console.error('❌ Error en WebSocket:', error);
      setIsConnected(false);
    });

    // Escuchar notificaciones de solicitudes múltiples
    newSocket.on('solicitud_multiple', (data) => {
      console.log('📋 Notificación de solicitud múltiple recibida:', data);
      
      const nuevaNotificacion = {
        tipo: 'solicitud_multiple',
        titulo: data.titulo,
        documentoNombre: data.documentoNombre,
        solicitanteNombre: data.solicitanteNombre,
        mensaje: data.mensaje,
        fechaExpiracion: data.fechaExpiracion,
        timestamp: data.timestamp
      };

      notificationService.add(nuevaNotificacion);
      
      // Mostrar notificación automáticamente
      setShowNotifications(true);
    });

    // Escuchar mensajes genéricos
    newSocket.on('mensaje', (data) => {
      console.log('📨 Mensaje genérico recibido:', data);
      
      const nuevaNotificacion = {
        tipo: 'mensaje',
        titulo: 'Nueva notificación',
        mensaje: JSON.stringify(data),
        timestamp: new Date().toISOString()
      };

      notificationService.add(nuevaNotificacion);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const marcarComoLeida = (id) => {
    notificationService.markAsRead(id);
  };

  const eliminarNotificacion = (id) => {
    notificationService.remove(id);
  };

  const limpiarTodas = () => {
    notificationService.clear();
  };

  const marcarTodasComoLeidas = () => {
    notificationService.markAllAsRead();
  };

  return (
    <div className="relative">
      {/* Botón de notificaciones con indicador */}
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2 rounded-full text-gray-500 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-background transition-colors"
        title="Notificaciones"
      >
        <BellIcon className="h-5 w-5 transition-transform group-hover:scale-110" />
        
        {/* Indicador de notificaciones */}
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-red-600 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full animate-pulse"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
        
        <span className="sr-only">Notificaciones</span>
      </button>

      {/* Panel de notificaciones */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute right-0 mt-3 w-96 bg-white dark:bg-background rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden"
          >
            {/* Header con colores del tema */}
            <div className="bg-primary dark:bg-primary-light text-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-full">
                    <BellIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Notificaciones</h3>
                    <p className="text-sm text-blue-100">
                      {unreadCount > 0 ? `${unreadCount} sin leer` : 'Todas leídas'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={marcarTodasComoLeidas}
                      className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                      title="Marcar todas como leídas"
                    >
                      <CheckIcon className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={limpiarTodas}
                    className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                    title="Limpiar todas"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Estado de conexión */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                  <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                    {isConnected ? 'Conectado en tiempo real' : 'Desconectado'}
                  </span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date().toLocaleTimeString()}
                </span>
              </div>
            </div>

            {/* Lista de notificaciones */}
            <div className="max-h-96 overflow-y-auto">
              {notificaciones.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <BellIcon className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium mb-2">No hay notificaciones</p>
                  <p className="text-sm">Las notificaciones aparecerán aquí cuando lleguen</p>
                </div>
              ) : (
                <AnimatePresence>
                  {notificaciones.map((notificacion, index) => (
                    <motion.div
                      key={notificacion.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200 ${
                        !notificacion.leida ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-l-4 border-l-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          {notificacion.tipo === 'solicitud_multiple' ? (
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full">
                              <DocumentIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                          ) : (
                            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full">
                              <BellIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                              {notificacion.titulo}
                            </h4>
                            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                              {new Date(notificacion.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          
                          {notificacion.tipo === 'solicitud_multiple' && (
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2 text-sm">
                                <span className="text-gray-500 dark:text-gray-400">📄</span>
                                <span className="text-gray-700 dark:text-gray-300 font-medium">
                                  {notificacion.documentoNombre}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2 text-sm">
                                <span className="text-gray-500 dark:text-gray-400">👤</span>
                                <span className="text-gray-700 dark:text-gray-300">
                                  {notificacion.solicitanteNombre}
                                </span>
                              </div>
                              {notificacion.mensaje && (
                                <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 p-2 rounded-lg">
                                  💬 {notificacion.mensaje}
                                </div>
                              )}
                              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                                <ClockIcon className="h-4 w-4" />
                                <span>Expira: {new Date(notificacion.fechaExpiracion).toLocaleDateString()}</span>
                              </div>
                            </div>
                          )}
                          
                          {notificacion.tipo === 'mensaje' && (
                            <p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 p-2 rounded-lg">
                              {notificacion.mensaje}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex-shrink-0 flex items-center space-x-1">
                          {!notificacion.leida && (
                            <button
                              onClick={() => marcarComoLeida(notificacion.id)}
                              className="p-1.5 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-full transition-colors"
                              title="Marcar como leída"
                            >
                              <CheckIcon className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => eliminarNotificacion(notificacion.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-colors"
                            title="Eliminar"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Indicador de no leída */}
                      {!notificacion.leida && (
                        <div className="mt-3 flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                          <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                            Nueva
                          </span>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Total: {notificaciones.length} notificaciones</span>
                <span>Sin leer: {unreadCount}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificacionesTiempoReal;
