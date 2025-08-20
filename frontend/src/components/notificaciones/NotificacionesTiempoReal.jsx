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
      console.log('🔍 Datos completos:', JSON.stringify(data, null, 2));
      
      // Calcular tiempo hasta expiración
      const fechaExpiracion = new Date(data.fechaExpiracion);
      const ahora = new Date();
      const diasRestantes = Math.ceil((fechaExpiracion - ahora) / (1000 * 60 * 60 * 24));
      
      const nuevaNotificacion = {
        id: Date.now(),
        tipo: 'solicitud_multiple',
        titulo: '📋 Solicitud de Firma Digital',
        remitente: data.solicitanteNombre,
        documentoNombre: data.documentoNombre,
        mensajePersonalizado: data.mensaje,
        solicitudId: data.solicitudId,
        fechaExpiracion: data.fechaExpiracion,
        diasRestantes: diasRestantes,
        timestamp: data.timestamp || new Date().toISOString(),
        leida: false
      };

      notificationService.add(nuevaNotificacion);
      
      // Mostrar notificación automáticamente
      setShowNotifications(true);
    });

    // Escuchar mensajes genéricos
    newSocket.on('mensaje', (data) => {
      console.log('📨 Mensaje genérico recibido:', data);
      console.log('🔍 Tipo de mensaje:', typeof data, data);
      
      // Si el mensaje parece ser una solicitud múltiple en formato JSON (string)
      if (typeof data === 'string' && data.includes('solicitud_multiple')) {
        try {
          const parsedData = JSON.parse(data);
          console.log('🔄 Convirtiendo mensaje genérico a solicitud múltiple:', parsedData);
          
          // Calcular tiempo hasta expiración
          const fechaExpiracion = new Date(parsedData.fechaExpiracion);
          const ahora = new Date();
          const diasRestantes = Math.ceil((fechaExpiracion - ahora) / (1000 * 60 * 60 * 24));
          
          const nuevaNotificacion = {
            id: Date.now(),
            tipo: 'solicitud_multiple',
            titulo: '📋 Solicitud de Firma Digital',
            remitente: parsedData.solicitanteNombre || 'Usuario',
            documentoNombre: parsedData.documentoNombre || 'Documento',
            mensajePersonalizado: parsedData.mensaje,
            solicitudId: parsedData.solicitudId,
            fechaExpiracion: parsedData.fechaExpiracion,
            diasRestantes: diasRestantes,
            timestamp: parsedData.timestamp || new Date().toISOString(),
            leida: false
          };

          notificationService.add(nuevaNotificacion);
          setShowNotifications(true);
          return;
        } catch (e) {
          console.warn('❌ No se pudo parsear como solicitud múltiple:', e);
        }
      }
      
      // Si llega como objeto y tiene los campos característicos, tratarlo como solicitud múltiple
      if (typeof data === 'object' && data !== null) {
        const pareceSolicitudMultiple =
          (typeof data.tipo === 'string' && data.tipo.toLowerCase().trim() === 'solicitud_multiple') ||
          ('solicitudId' in data && 'documentoNombre' in data && 'solicitanteNombre' in data);

        if (pareceSolicitudMultiple) {
          const fechaExpiracion = data.fechaExpiracion ? new Date(data.fechaExpiracion) : null;
          const ahora = new Date();
          const diasRestantes = fechaExpiracion ? Math.ceil((fechaExpiracion - ahora) / (1000 * 60 * 60 * 24)) : null;

          const nuevaNotificacion = {
            id: Date.now(),
            tipo: 'solicitud_multiple',
            titulo: '📋 Solicitud de Firma Digital',
            remitente: data.solicitanteNombre || 'Usuario',
            documentoNombre: data.documentoNombre || 'Documento',
            mensajePersonalizado: data.mensaje,
            solicitudId: data.solicitudId,
            fechaExpiracion: data.fechaExpiracion,
            diasRestantes: diasRestantes ?? undefined,
            timestamp: data.timestamp || new Date().toISOString(),
            leida: false
          };

          notificationService.add(nuevaNotificacion);
          setShowNotifications(true);
          return;
        }
      }
      
      const nuevaNotificacion = {
        id: Date.now(),
        tipo: 'mensaje',
        titulo: '📨 Nueva Notificación',
        mensaje: data.mensaje || data.message || 'Has recibido una nueva notificación',
        timestamp: data.timestamp || new Date().toISOString(),
        leida: false
      };

      notificationService.add(nuevaNotificacion);
    });

    // Escuchar notificaciones de firma completada
    newSocket.on('firma_completada', (data) => {
      console.log('✅ Notificación de firma completada recibida:', data);
      
      const nuevaNotificacion = {
        id: Date.now(),
        tipo: 'firma_completada',
        titulo: '✅ Firma Completada',
        remitente: data.firmanteNombre || 'Usuario',
        documentoNombre: data.documentoNombre || 'Documento',
        mensaje: data.mensaje || `${data.firmanteNombre} ha firmado el documento`,
        solicitudId: data.solicitudId,
        porcentajeCompletado: data.porcentajeCompletado,
        firmasCompletadas: data.firmasCompletadas,
        totalFirmantes: data.totalFirmantes,
        timestamp: data.timestamp || new Date().toISOString(),
        leida: false
      };

      notificationService.add(nuevaNotificacion);
      setShowNotifications(true);
    });

    // Escuchar notificaciones de firma rechazada
    newSocket.on('firma_rechazada', (data) => {
      console.log('❌ Notificación de firma rechazada recibida:', data);
      
      const nuevaNotificacion = {
        id: Date.now(),
        tipo: 'firma_rechazada',
        titulo: '❌ Firma Rechazada',
        remitente: data.firmanteNombre || 'Usuario',
        documentoNombre: data.documentoNombre || 'Documento',
        mensaje: data.mensaje || `${data.firmanteNombre} ha rechazado la firma`,
        motivo: data.motivo,
        solicitudId: data.solicitudId,
        timestamp: data.timestamp || new Date().toISOString(),
        leida: false
      };

      notificationService.add(nuevaNotificacion);
      setShowNotifications(true);
    });

    // Escuchar notificaciones de documento firmado (individual)
    newSocket.on('documento_firmado', (data) => {
      console.log('📝 Notificación de documento firmado recibida:', data);
      
      const nuevaNotificacion = {
        id: Date.now(),
        tipo: 'documento_firmado',
        titulo: '📝 Documento Firmado',
        remitente: data.firmanteNombre || 'Usuario',
        documentoNombre: data.documentoNombre || 'Documento',
        mensaje: data.mensaje || `${data.firmanteNombre} ha firmado tu documento`,
        documentoId: data.documentoId,
        timestamp: data.timestamp || new Date().toISOString(),
        leida: false
      };

      notificationService.add(nuevaNotificacion);
      setShowNotifications(true);
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
    console.log('🧹 Todas las notificaciones han sido limpiadas');
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
          <>
            {/* Overlay para cerrar al hacer clic fuera */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-40"
              onClick={() => setShowNotifications(false)}
            />
            
            {/* Panel lateral de notificaciones */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 h-full w-96 bg-white dark:bg-gray-900 shadow-2xl border-l border-gray-200 dark:border-gray-700 z-50 overflow-hidden flex flex-col"
            >
              {/* Header del panel lateral */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 text-white p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white/20 rounded-full">
                      <BellIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Notificaciones</h2>
                      <p className="text-sm opacity-90">
                        {unreadCount > 0 ? `${unreadCount} sin leer` : 'Todas leídas'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
                
                {/* Botones de acción */}
                <div className="flex items-center space-x-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={marcarTodasComoLeidas}
                      className="flex items-center space-x-2 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium"
                    >
                      <CheckIcon className="h-4 w-4" />
                      <span>Marcar leídas</span>
                    </button>
                  )}
                  <button
                    onClick={limpiarTodas}
                    className="flex items-center space-x-2 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium"
                  >
                    <TrashIcon className="h-4 w-4" />
                    <span>Limpiar</span>
                  </button>
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

              {/* Lista de notificaciones - usa todo el espacio disponible */}
              <div className="flex-1 overflow-y-auto">
              {notificaciones.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center text-gray-500 dark:text-gray-400">
                  <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-6">
                    <BellIcon className="h-12 w-12 opacity-50" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No hay notificaciones</h3>
                  <p className="text-sm opacity-75 max-w-sm">
                    Cuando recibas nuevas solicitudes de firma o mensajes importantes, aparecerán aquí en tiempo real.
                  </p>
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
                      className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200 ${
                        !notificacion.leida ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-l-4 border-l-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          {notificacion.tipo === 'solicitud_multiple' ? (
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full">
                              <DocumentIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                          ) : notificacion.tipo === 'firma_completada' ? (
                            <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-full">
                              <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                          ) : notificacion.tipo === 'firma_rechazada' ? (
                            <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-full">
                              <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
                            </div>
                          ) : notificacion.tipo === 'documento_firmado' ? (
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-full">
                              <DocumentIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            </div>
                          ) : (
                            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full">
                              <BellIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                              {notificacion.titulo}
                            </h4>
                            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                              {new Date(notificacion.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          
                          {/* Formato de notificación mejorado */}
                          {notificacion.tipo === 'solicitud_multiple' ? (
                            <div className="space-y-3">
                              {/* Mensaje principal */}
                              <div className="text-sm text-gray-700 dark:text-gray-300">
                                <span className="font-semibold text-blue-600 dark:text-blue-400">
                                  {notificacion.remitente}
                                </span>
                                <span> te solicita firmar </span>
                                <span className="font-semibold">
                                  '{notificacion.documentoNombre}'
                                </span>
                              </div>
                              
                              {/* Mensaje personalizado */}
                              {notificacion.mensajePersonalizado && (
                                <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 p-3 rounded-lg border-l-3 border-blue-400">
                                  <div className="flex items-start space-x-2">
                                    <span className="text-blue-500 mt-0.5">💬</span>
                                    <span className="italic">"{notificacion.mensajePersonalizado}"</span>
                                  </div>
                                </div>
                              )}
                              
                              {/* Información de expiración */}
                              <div className="flex items-center space-x-2 text-sm">
                                <ClockIcon className="h-4 w-4 text-amber-500" />
                                <span className={`font-medium ${
                                  notificacion.diasRestantes <= 1 
                                    ? 'text-red-600 dark:text-red-400' 
                                    : notificacion.diasRestantes <= 3 
                                    ? 'text-amber-600 dark:text-amber-400'
                                    : 'text-gray-600 dark:text-gray-400'
                                }`}>
                                  {notificacion.diasRestantes <= 0 
                                    ? '⚠️ Vence hoy' 
                                    : notificacion.diasRestantes === 1
                                    ? '⚠️ Vence mañana'
                                    : `Expira en ${notificacion.diasRestantes} días`
                                  }
                                </span>
                              </div>
                              
                              {/* Botón de acción mejorado */}
                              <div className="pt-2">
                                <button
                                  onClick={() => {
                                    window.location.href = '/solicitudes-pendientes';
                                    setShowNotifications(false);
                                  }}
                                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 shadow-md hover:shadow-lg transform hover:scale-105"
                                >
                                  <DocumentIcon className="h-4 w-4" />
                                  <span>Firmar Ahora</span>
                                </button>
                              </div>
                            </div>
                          ) : notificacion.tipo === 'firma_completada' ? (
                            /* Notificación de firma completada */
                            <div className="space-y-3">
                              <div className="text-sm text-gray-700 dark:text-gray-300">
                                <span className="font-semibold text-green-600 dark:text-green-400">
                                  {notificacion.remitente}
                                </span>
                                <span> ha firmado </span>
                                <span className="font-semibold">
                                  '{notificacion.documentoNombre}'
                                </span>
                              </div>
                              
                              {notificacion.porcentajeCompletado && (
                                <div className="flex items-center space-x-2 text-sm">
                                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div 
                                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                      style={{ width: `${notificacion.porcentajeCompletado}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-green-600 dark:text-green-400 font-medium">
                                    {notificacion.porcentajeCompletado}%
                                  </span>
                                </div>
                              )}
                              
                              {notificacion.firmasCompletadas && notificacion.totalFirmantes && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {notificacion.firmasCompletadas} de {notificacion.totalFirmantes} firmas completadas
                                </div>
                              )}
                            </div>
                          ) : notificacion.tipo === 'firma_rechazada' ? (
                            /* Notificación de firma rechazada */
                            <div className="space-y-3">
                              <div className="text-sm text-gray-700 dark:text-gray-300">
                                <span className="font-semibold text-red-600 dark:text-red-400">
                                  {notificacion.remitente}
                                </span>
                                <span> ha rechazado la firma de </span>
                                <span className="font-semibold">
                                  '{notificacion.documentoNombre}'
                                </span>
                              </div>
                              
                              {notificacion.motivo && (
                                <div className="text-sm text-gray-600 dark:text-gray-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border-l-3 border-red-400">
                                  <div className="flex items-start space-x-2">
                                    <span className="text-red-500 mt-0.5">💭</span>
                                    <div>
                                      <span className="font-medium text-red-700 dark:text-red-400">Motivo:</span>
                                      <span className="ml-1 italic">"{notificacion.motivo}"</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : notificacion.tipo === 'documento_firmado' ? (
                            /* Notificación de documento firmado individual */
                            <div className="space-y-3">
                              <div className="text-sm text-gray-700 dark:text-gray-300">
                                <span className="font-semibold text-purple-600 dark:text-purple-400">
                                  {notificacion.remitente}
                                </span>
                                <span> ha firmado tu documento </span>
                                <span className="font-semibold">
                                  '{notificacion.documentoNombre}'
                                </span>
                              </div>
                              
                              <div className="pt-2">
                                <button
                                  onClick={() => {
                                    window.location.href = '/documentos';
                                    setShowNotifications(false);
                                  }}
                                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
                                >
                                  <DocumentIcon className="h-4 w-4" />
                                  <span>Ver Documento</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* Notificaciones genéricas */
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {notificacion.mensaje || 'Nueva notificación'}
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
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificacionesTiempoReal;
