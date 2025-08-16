import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DocumentIcon, 
  UserIcon, 
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  TrashIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

const SolicitudesMultiples = () => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [solicitudesPendientes, setSolicitudesPendientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('mis-solicitudes');
  const [selectedSolicitud, setSelectedSolicitud] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    cargarSolicitudes();
  }, [activeTab]);

  const cargarSolicitudes = async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'mis-solicitudes' 
        ? '/api/solicitudes-multiples/mis-solicitudes'
        : '/api/solicitudes-multiples/pendientes';

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (activeTab === 'mis-solicitudes') {
          setSolicitudes(data.solicitudes || []);
        } else {
          setSolicitudesPendientes(data.solicitudes || []);
        }
      } else {
        setError('Error al cargar las solicitudes');
      }
    } catch (error) {
      setError('Error de conexión');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const cancelarSolicitud = async (solicitudId, motivo = 'Cancelada por el solicitante') => {
    try {
      const response = await fetch(`/api/solicitudes-multiples/${solicitudId}/cancelar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ motivo })
      });

      if (response.ok) {
        // Recargar solicitudes
        cargarSolicitudes();
        setShowDetails(false);
        setSelectedSolicitud(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al cancelar la solicitud');
      }
    } catch (error) {
      setError('Error de conexión al cancelar');
    }
  };

  const obtenerEstadoColor = (estado) => {
    switch (estado) {
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'parcialmente_firmado':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'completado':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'expirado':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'cancelado':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const obtenerEstadoIcono = (estado) => {
    switch (estado) {
      case 'pendiente':
        return <ClockIcon className="h-5 w-5" />;
      case 'parcialmente_firmado':
        return <ExclamationTriangleIcon className="h-5 w-5" />;
      case 'completado':
        return <CheckCircleIcon className="h-5 w-5" />;
      case 'expirado':
        return <XCircleIcon className="h-5 w-5" />;
      case 'cancelado':
        return <XCircleIcon className="h-5 w-5" />;
      default:
        return <ClockIcon className="h-5 w-5" />;
    }
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calcularDiasRestantes = (fechaExpiracion) => {
    const ahora = new Date();
    const expiracion = new Date(fechaExpiracion);
    const diferencia = expiracion - ahora;
    const dias = Math.ceil(diferencia / (1000 * 60 * 60 * 24));
    
    if (dias < 0) return 'Expirado';
    if (dias === 0) return 'Expira hoy';
    if (dias === 1) return 'Expira mañana';
    return `${dias} días`;
  };

  const renderSolicitudCard = (solicitud) => (
    <motion.div
      key={solicitud._id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <DocumentIcon className="h-8 w-8 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {solicitud.titulo}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {solicitud.descripcion || 'Sin descripción'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${obtenerEstadoColor(solicitud.estado)}`}>
            {obtenerEstadoIcono(solicitud.estado)}
            <span className="ml-1 capitalize">
              {solicitud.estado.replace('_', ' ')}
            </span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <UserIcon className="h-4 w-4" />
          <span>{solicitud.firmantes?.length || 0} firmantes</span>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <CalendarIcon className="h-4 w-4" />
          <span>{formatearFecha(solicitud.fechaSolicitud)}</span>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <ClockIcon className="h-4 w-4" />
          <span>{calcularDiasRestantes(solicitud.fechaExpiracion)}</span>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
          <span>Progreso</span>
          <span>{solicitud.porcentajeCompletado || 0}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${solicitud.porcentajeCompletado || 0}%` }}
          ></div>
        </div>
      </div>

      {/* Firmantes */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Firmantes:
        </h4>
        <div className="flex flex-wrap gap-2">
          {solicitud.firmantes?.map((firmante, index) => (
            <span
              key={firmante.usuarioId?._id || index}
              className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              {firmante.nombre || firmante.usuarioId?.nombre || `Firmante ${index + 1}`}
            </span>
          ))}
        </div>
      </div>

      {/* Acciones */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            setSelectedSolicitud(solicitud);
            setShowDetails(true);
          }}
          className="flex items-center px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
        >
          <EyeIcon className="h-4 w-4 mr-1" />
          Ver Detalles
        </button>

        {activeTab === 'mis-solicitudes' && solicitud.estado !== 'completado' && solicitud.estado !== 'cancelado' && (
          <button
            onClick={() => cancelarSolicitud(solicitud._id)}
            className="flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <TrashIcon className="h-4 w-4 mr-1" />
            Cancelar
          </button>
        )}
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Solicitudes Múltiples
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gestiona tus solicitudes de firma múltiple y las que tienes pendientes
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('mis-solicitudes')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'mis-solicitudes'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Mis Solicitudes
          </button>
          <button
            onClick={() => setActiveTab('pendientes')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'pendientes'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Pendientes de Firma
          </button>
        </nav>
      </div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
        >
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-red-800 dark:text-red-200">{error}</span>
          </div>
        </motion.div>
      )}

      {/* Solicitudes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnimatePresence>
          {(activeTab === 'mis-solicitudes' ? solicitudes : solicitudesPendientes).map(renderSolicitudCard)}
        </AnimatePresence>
      </div>

      {/* Estado vacío */}
      {(activeTab === 'mis-solicitudes' ? solicitudes : solicitudesPendientes).length === 0 && (
        <div className="text-center py-12">
          <DocumentIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {activeTab === 'mis-solicitudes' ? 'No tienes solicitudes múltiples' : 'No tienes solicitudes pendientes'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {activeTab === 'mis-solicitudes' 
              ? 'Crea una nueva solicitud múltiple para comenzar'
              : 'Cuando recibas solicitudes de firma múltiple, aparecerán aquí'
            }
          </p>
        </div>
      )}

      {/* Modal de Detalles */}
      <AnimatePresence>
        {showDetails && selectedSolicitud && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDetails(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header del Modal */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Detalles de la Solicitud
                </h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Contenido del Modal */}
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                    Título
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {selectedSolicitud.titulo}
                  </p>
                </div>

                {selectedSolicitud.descripcion && (
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                      Descripción
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {selectedSolicitud.descripcion}
                    </p>
                  </div>
                )}

                {selectedSolicitud.mensaje && (
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                      Mensaje
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {selectedSolicitud.mensaje}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                      Estado
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${obtenerEstadoColor(selectedSolicitud.estado)}`}>
                      {obtenerEstadoIcono(selectedSolicitud.estado)}
                      <span className="ml-1 capitalize">
                        {selectedSolicitud.estado.replace('_', ' ')}
                      </span>
                    </span>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                      Prioridad
                    </h3>
                    <span className="capitalize text-gray-600 dark:text-gray-400">
                      {selectedSolicitud.prioridad}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                      Fecha de Solicitud
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {formatearFecha(selectedSolicitud.fechaSolicitud)}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                      Fecha de Expiración
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {formatearFecha(selectedSolicitud.fechaExpiracion)}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                    Progreso de Firmas
                  </h3>
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                        <span>Completado</span>
                        <span>{selectedSolicitud.porcentajeCompletado || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div 
                          className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${selectedSolicitud.porcentajeCompletado || 0}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedSolicitud.firmasCompletadas || 0} / {selectedSolicitud.totalFirmantes || 0}
                    </div>
                  </div>
                </div>

                {selectedSolicitud.tags && selectedSolicitud.tags.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                      Etiquetas
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedSolicitud.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer del Modal */}
              <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cerrar
                </button>
                
                {activeTab === 'mis-solicitudes' && selectedSolicitud.estado !== 'completado' && selectedSolicitud.estado !== 'cancelado' && (
                  <button
                    onClick={() => cancelarSolicitud(selectedSolicitud._id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Cancelar Solicitud
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SolicitudesMultiples;
