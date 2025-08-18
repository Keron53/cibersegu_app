import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, User, Calendar, FileSignature, Download, Eye, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import PDFViewerFirma from '../components/documentos/PDFViewerFirma';
import { certificadoService } from '../services/api';

const FirmarDocumento = () => {
  const { documentoId } = useParams();
  const navigate = useNavigate();
  const [documento, setDocumento] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [certificados, setCertificados] = useState([]);
  const [certificadoSeleccionado, setCertificadoSeleccionado] = useState('');
  const [password, setPassword] = useState('');
  const [posicionFirma, setPosicionFirma] = useState(null);
  const [firmando, setFirmando] = useState(false);
  const [showPDF, setShowPDF] = useState(true);
  const [showSolicitudMultiple, setShowSolicitudMultiple] = useState(false);

  useEffect(() => {
    cargarDocumento();
    cargarCertificados();
  }, [documentoId]);

  const cargarDocumento = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Primero obtener la información del documento (metadatos)
      const response = await fetch(`/api/documentos/${documentoId}/info`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📋 Información del documento cargada:', data);
        setDocumento(data.documento);
      } else {
        setError('Error al cargar la información del documento');
      }
    } catch (error) {
      console.error('Error cargando documento:', error);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const cargarCertificados = async () => {
    try {
      console.log('🔍 Cargando certificados...');
      const certs = await certificadoService.listar();
      console.log('📋 Certificados recibidos:', certs);
      console.log('📊 Certificados encontrados:', certs?.length || 0);
      setCertificados(certs || []);
      
      // Seleccionar el primer certificado por defecto si existe
      if (certs && certs.length > 0) {
        setCertificadoSeleccionado(certs[0]._id);
        console.log('✅ Primer certificado seleccionado:', certs[0]);
      }
    } catch (error) {
      console.error('❌ Error cargando certificados:', error);
    }
  };

  const handleFirmar = async () => {
    if (!certificadoSeleccionado || !password || !posicionFirma) {
      setError('Por favor completa todos los campos');
      return;
    }

    try {
      setFirmando(true);
      setError('');

      // Obtener información del certificado seleccionado
      const certificado = certificados.find(cert => cert._id === certificadoSeleccionado);
      if (!certificado) {
        setError('Certificado no encontrado');
        return;
      }

      const token = localStorage.getItem('token');
      const response = await fetch(`/api/documentos/${documentoId}/firmar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          certificadoId: certificadoSeleccionado,
          password: password,
          nombre: certificado.nombreComun,
          organizacion: certificado.organizacion,
          email: certificado.email,
          x: posicionFirma.x,
          y: posicionFirma.y,
          page: posicionFirma.page,
          canvasWidth: 800, // Dimensiones del canvas por defecto
          canvasHeight: 600
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Documento firmado exitosamente:', data);
        
        // Mostrar mensaje de éxito
        setError(''); // Limpiar errores previos
        
        // Redirigir a la lista de documentos con mensaje de éxito
        navigate('/home', { 
          state: { 
            message: 'Documento firmado exitosamente',
            type: 'success'
          }
        });
      } else {
        const errorData = await response.json();
        console.error('❌ Error del backend:', errorData);
        
        // Manejar errores específicos
        if (errorData.code === 'INVALID_PASSWORD') {
          setError('Contraseña del certificado incorrecta');
        } else if (errorData.code === 'VALIDATION_ERROR') {
          setError('Error al validar el certificado');
        } else if (errorData.code === 'DECRYPTION_ERROR') {
          setError('Error al procesar el certificado');
        } else {
          setError(errorData.error || 'Error al firmar el documento');
        }
      }
    } catch (error) {
      console.error('Error firmando documento:', error);
      setError('Error de conexión al firmar');
    } finally {
      setFirmando(false);
    }
  };

  const handlePosicionSeleccionada = (posicion) => {
    console.log('📍 Posición seleccionada:', posicion);
    setPosicionFirma({
      x: posicion.x,
      y: posicion.y,
      page: posicion.page,
      qrSize: posicion.qrSize || 100
    });
  };

  const handleCrearSolicitudMultiple = () => {
    if (!posicionFirma) {
      setError('Primero debes seleccionar la posición de firma');
      return;
    }
    
    // Redirigir a la página de crear solicitud múltiple con los datos del documento
    navigate('/crear-solicitud-multiple', {
      state: {
        documentoId: documentoId,
        documento: documento,
        posicionFirma: posicionFirma
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando documento...</p>
        </div>
      </div>
    );
  }

  if (error && !documento) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Error al cargar el documento
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => navigate('/documentos')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Volver a Documentos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header con breadcrumbs */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700"
      >
        <div className="max-w-7xl mx-auto px-4 py-4">
          <nav className="flex items-center space-x-4">
                                <button
                      onClick={() => navigate('/home')}
                      className="flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Volver a Documentos
                    </button>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 dark:text-white font-medium">
              Firmar Documento
            </span>
          </nav>
        </div>
      </motion.div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Visor PDF - 2/3 del ancho */}
          <div className="lg:col-span-2">
            {documento ? (
              <PDFViewerFirma
                documento={documento}
                onPositionSelected={handlePosicionSeleccionada}
                onClose={() => setShowPDF(false)}
              />
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Cargando Documento...
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Por favor espera mientras se carga el PDF
                  </p>
                </div>
                
                <div className="p-4">
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Panel de firma - 1/3 del ancho */}
          <div className="lg:col-span-1">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Firmar Documento
              </h3>

              {/* Información del documento */}
              {documento && (
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    Información del Documento
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <FileText className="w-4 h-4 mr-2" />
                      {documento.nombre}
                    </div>
                    {documento.firmas && documento.firmas.length > 0 && (
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <FileSignature className="w-4 h-4 mr-2" />
                        {documento.firmas.length} firma(s) existente(s)
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Selección de certificado */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Certificado de Firma
                </label>
                {certificados.length > 0 ? (
                  <select
                    value={certificadoSeleccionado}
                    onChange={(e) => setCertificadoSeleccionado(e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar certificado...</option>
                    {certificados.map((cert) => (
                      <option key={cert._id} value={cert._id}>
                        {cert.alias || cert.nombreComun} - {cert.propietario || cert.organizacion}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 border border-yellow-300 dark:border-yellow-600 rounded-md bg-yellow-50 dark:bg-yellow-900/20">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-yellow-700 dark:text-yellow-400">
                        Cargando certificados...
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Contraseña */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Contraseña del Certificado
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ingresa la contraseña"
                />
              </div>

              {/* Posición de firma */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Posición de Firma
                </label>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Haz clic en el PDF para seleccionar la posición
                </div>
                {posicionFirma ? (
                  <div className="text-sm text-green-600 dark:text-green-400 p-3 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="font-medium">Posición Seleccionada</span>
                    </div>
                    <div className="mt-2 space-y-1">
                      <div>📍 Coordenadas: ({posicionFirma.x}, {posicionFirma.y})</div>
                      <div>📄 Página: {posicionFirma.page}</div>
                      <div>📏 Tamaño QR: {posicionFirma.qrSize}px</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                      <span>⏳ Esperando selección de posición</span>
                    </div>
                    <div className="mt-1 text-xs">
                      Haz clic y arrastra en el PDF para seleccionar
                    </div>
                  </div>
                )}
              </div>

              {/* Botones de acción */}
              <div className="space-y-3">
                {/* Botón de firma individual */}
                <button
                  onClick={handleFirmar}
                  disabled={!certificadoSeleccionado || !password || !posicionFirma || firmando}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {firmando ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Firmando...
                    </>
                  ) : (
                    <>
                      <FileSignature className="w-4 h-4 mr-2" />
                      Firmar Documento
                    </>
                  )}
                </button>

                {/* Botón de solicitud múltiple */}
                <button
                  onClick={handleCrearSolicitudMultiple}
                  disabled={!posicionFirma}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Solicitar Firma Múltiple
                </button>
              </div>

              {/* Mensaje de error */}
              {error && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}
            </motion.div>
          </div>
        </motion.div>

        {/* Información adicional abajo */}
        {documento && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8"
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Detalles del Documento
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Propietario</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{documento.usuario?.nombre || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Fecha de Subida</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {documento.createdAt ? new Date(documento.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <FileSignature className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Estado</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {documento.firmas && documento.firmas.length > 0 ? 'Firmado' : 'Sin firmar'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default FirmarDocumento;
