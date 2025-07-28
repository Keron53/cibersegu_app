import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FileText, User, Clock, CheckCircle, XCircle, AlertCircle, Download } from 'lucide-react';
import PDFViewerEmbedded from './PDFViewerEmbedded';
import CertificateList from '../certificados/CertificateList';
import Navigation from '../layout/Navigation';

// Configurar axios para incluir el token automáticamente
const API_BASE_URL = 'http://localhost:3001/api';

function FirmarPorSolicitud() {
  const { solicitudId } = useParams();
  const navigate = useNavigate();
  
  const [solicitud, setSolicitud] = useState(null);
  const [certificados, setCertificados] = useState([]);
  const [certificadoSeleccionado, setCertificadoSeleccionado] = useState('');
  const [password, setPassword] = useState('');
  const [firmando, setFirmando] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    cargarSolicitud();
    cargarCertificados();
  }, [solicitudId]);

  const cargarSolicitud = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/solicitudes/${solicitudId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setSolicitud(response.data);
    } catch (error) {
      console.error('Error cargando solicitud:', error);
      setError('Error cargando la solicitud de firma');
    } finally {
      setLoading(false);
    }
  };

  const cargarCertificados = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/certificados`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      // Asegurar que siempre sea un array
      setCertificados(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error cargando certificados:', error);
      setCertificados([]); // Establecer array vacío en caso de error
    }
  };

  const firmarDocumento = async (e) => {
    e.preventDefault();
    
    if (!certificadoSeleccionado) {
      setError('Selecciona un certificado');
      return;
    }

    if (!password) {
      setError('Ingresa la contraseña del certificado');
      return;
    }

    setFirmando(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE_URL}/solicitudes/firmar/${solicitudId}`, {
        certificadoId: certificadoSeleccionado,
        password
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setSuccess('Documento firmado exitosamente');
      
      // Redirigir después de 2 segundos
      setTimeout(() => {
        navigate('/home');
      }, 2000);
      
    } catch (error) {
      console.error('Error firmando documento:', error);
      setError(error.response?.data?.error || 'Error firmando documento');
    } finally {
      setFirmando(false);
    }
  };

  const rechazarSolicitud = async () => {
    const motivo = prompt('Motivo del rechazo (opcional):');
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/solicitudes/rechazar/${solicitudId}`, {
        motivo: motivo || 'Sin motivo especificado'
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setSuccess('Solicitud rechazada exitosamente');
      setTimeout(() => {
        navigate('/home');
      }, 2000);
      
    } catch (error) {
      console.error('Error rechazando solicitud:', error);
      setError('Error rechazando la solicitud');
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      <Navigation onLogout={handleLogout} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-300">Cargando solicitud...</span>
          </div>
        ) : error && !solicitud ? (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        ) : !solicitud ? (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Solicitud no encontrada</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Firmar Documento por Solicitud
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Documento: {solicitud.documentoId?.nombre}
              </p>
            </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Información de la Solicitud */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Información de la Solicitud
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Documento:
                </p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {solicitud.documentoId?.nombre}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Solicitado por:
                </p>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    {solicitud.solicitanteId?.nombre}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {solicitud.solicitanteId?.email}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Estado:
                </p>
                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getEstadoColor(solicitud.estado)}`}>
                  {solicitud.estado === 'pendiente' && <Clock className="w-3 h-3" />}
                  {solicitud.estado === 'firmado' && <CheckCircle className="w-3 h-3" />}
                  {solicitud.estado === 'rechazado' && <XCircle className="w-3 h-3" />}
                  {solicitud.estado === 'expirado' && <AlertCircle className="w-3 h-3" />}
                  {solicitud.estado}
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Fecha de solicitud:
                </p>
                <p className="text-sm text-gray-900 dark:text-white">
                  {formatearFecha(solicitud.fechaSolicitud)}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Expira:
                </p>
                <p className="text-sm text-gray-900 dark:text-white">
                  {formatearFecha(solicitud.fechaExpiracion)}
                </p>
              </div>

              {solicitud.mensaje && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Mensaje:
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white p-3 bg-gray-50 dark:bg-gray-700 rounded">
                    {solicitud.mensaje}
                  </p>
                </div>
              )}

              {solicitud.posicionFirma && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Posición de firma:
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    Página {solicitud.posicionFirma.page} - Coordenadas ({solicitud.posicionFirma.x}, {solicitud.posicionFirma.y})
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Formulario de Firma */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Firmar Documento
              </h3>
            </div>

            {solicitud.estado === 'pendiente' && new Date() < new Date(solicitud.fechaExpiracion) ? (
              <form onSubmit={firmarDocumento} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Seleccionar Certificado
                  </label>
                  <select
                    value={certificadoSeleccionado}
                    onChange={(e) => setCertificadoSeleccionado(e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Selecciona un certificado...</option>
                    {Array.isArray(certificados) && certificados.map(cert => (
                      <option key={cert._id} value={cert._id}>
                        {cert.nombreComun} - {cert.organizacion}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Contraseña del Certificado
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ingresa la contraseña del certificado"
                    required
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={firmando || !certificadoSeleccionado || !password}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-md font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                  >
                    {firmando ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Firmando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Firmar Documento
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={rechazarSolicitud}
                    className="bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-md font-medium transition-colors duration-200 flex items-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Rechazar
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-8">
                {solicitud.estado === 'firmado' ? (
                  <>
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Documento ya firmado
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      Este documento ya ha sido firmado.
                    </p>
                  </>
                ) : solicitud.estado === 'rechazado' ? (
                  <>
                    <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Solicitud rechazada
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      Esta solicitud ha sido rechazada.
                    </p>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Solicitud expirada
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      Esta solicitud ha expirado.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Visor de PDF */}
        {solicitud.documentoId?.ruta && (
          <div className="mt-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex items-center gap-2 mb-4">
              <Download className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Vista Previa del Documento
              </h3>
            </div>
            <div className="h-96 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <PDFViewerEmbedded documentId={solicitud.documentoId._id} documentName={solicitud.documentoId.nombre} />
            </div>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
}

export default FirmarPorSolicitud; 