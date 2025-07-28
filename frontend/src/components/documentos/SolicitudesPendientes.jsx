import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Clock, User, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Navigation from '../layout/Navigation';

// Configurar axios para incluir el token automáticamente
const API_BASE_URL = 'http://localhost:3001/api';

function SolicitudesPendientes() {
  const navigate = useNavigate();
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  const cargarSolicitudes = async () => {
    try {
      setLoading(true);
      console.log('🔍 Cargando solicitudes pendientes...');
      
      // Obtener token del localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('❌ No hay token de autenticación');
        setError('No hay sesión activa. Por favor, inicia sesión.');
        return;
      }
      
      const response = await axios.get(`${API_BASE_URL}/solicitudes/pendientes`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('📦 Response data:', response.data);
      console.log('📋 Tipo de response.data:', typeof response.data);
      console.log('📋 Es array?', Array.isArray(response.data));
      
      // Asegurar que siempre sea un array
      const solicitudesArray = Array.isArray(response.data) ? response.data : [];
      console.log('✅ Solicitudes procesadas:', solicitudesArray);
      setSolicitudes(solicitudesArray);
    } catch (error) {
      console.error('❌ Error cargando solicitudes:', error);
      console.error('📋 Error response:', error.response);
      setError('Error cargando solicitudes pendientes');
      setSolicitudes([]); // Establecer array vacío en caso de error
    } finally {
      setLoading(false);
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'pendiente':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'firmado':
        return 'text-green-600 bg-green-100 border-green-200';
      case 'rechazado':
        return 'text-red-600 bg-red-100 border-red-200';
      case 'expirado':
        return 'text-gray-600 bg-gray-100 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getEstadoIcon = (estado) => {
    switch (estado) {
      case 'pendiente':
        return <Clock className="w-4 h-4" />;
      case 'firmado':
        return <CheckCircle className="w-4 h-4" />;
      case 'rechazado':
        return <XCircle className="w-4 h-4" />;
      case 'expirado':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      <Navigation onLogout={handleLogout} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Solicitudes de Firma Pendientes
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Revisa y gestiona las solicitudes de firma que otros usuarios te han enviado.
          </p>
        </div>

        {loading ? (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-300">Cargando solicitudes...</span>
            </div>
          </div>
        ) : error ? (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          </div>
        ) : solicitudes.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No hay solicitudes pendientes
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                No tienes solicitudes de firma pendientes en este momento.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex items-center gap-2 mb-6">
              <Clock className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Solicitudes Pendientes ({solicitudes.length})
              </h3>
            </div>

            <div className="space-y-4">
              {Array.isArray(solicitudes) && solicitudes.map((solicitud) => (
                <div
                  key={solicitud._id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {solicitud.documentoId?.nombre || 'Documento'}
                      </h4>
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getEstadoColor(solicitud.estado)}`}>
                      {getEstadoIcon(solicitud.estado)}
                      {solicitud.estado}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Solicitado por:
                      </p>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {solicitud.solicitanteId?.nombre || 'Usuario'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {solicitud.solicitanteId?.email}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Fecha de solicitud:
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {formatearFecha(solicitud.fechaSolicitud)}
                      </p>
                    </div>
                  </div>

                  {solicitud.mensaje && (
                    <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Mensaje:
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {solicitud.mensaje}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Expira: {formatearFecha(solicitud.fechaExpiracion)}
                    </div>
                    
                    {solicitud.estado === 'pendiente' && (
                      <button
                        onClick={() => window.location.href = `/firmar-documento/${solicitud._id}`}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                      >
                        Firmar Documento
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SolicitudesPendientes; 