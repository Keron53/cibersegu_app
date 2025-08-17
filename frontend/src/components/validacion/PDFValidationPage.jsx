import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, CheckCircle, XCircle, AlertTriangle, Info, FileText, Shield, Clock, User } from 'lucide-react';
import Navigation from '../layout/Navigation';
import { useNavigate } from 'react-router-dom';
import PDFPreview from './PDFPreview';

const PDFValidationPage = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [url, setUrl] = useState('');
  const [validationMode, setValidationMode] = useState('file'); // 'file' or 'url'
  const [loading, setLoading] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setError('');
    } else {
      setError('Por favor selecciona un archivo PDF válido');
      setSelectedFile(null);
    }
  };

  const handleUrlChange = (e) => {
    setUrl(e.target.value);
    setError('');
  };

  const validatePDF = async () => {
    if (validationMode === 'file' && !selectedFile) {
      setError('Por favor selecciona un archivo PDF');
      return;
    }

    if (validationMode === 'url' && !url) {
      setError('Por favor ingresa una URL válida');
      return;
    }

    setLoading(true);
    setError('');
    setValidationResult(null);

    try {
      let response;
      
      if (validationMode === 'file') {
        const formData = new FormData();
        formData.append('pdf', selectedFile);

        response = await fetch('/api/validacion/validar-pdf', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        });
      } else {
        response = await fetch('/api/validacion/validar-pdf-url', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ url })
        });
      }

      const data = await response.json();

      if (response.ok) {
        console.log('🔍 Respuesta del backend:', data);
        console.log('📊 Estructura de validation:', data.validation);
        console.log('📊 Campos disponibles:', Object.keys(data.validation));
        console.log('📊 Contenido de validation:', data.validation);
        setValidationResult(data);
        
        // Mostrar automáticamente el visor del PDF después de validar
        if (validationMode === 'file' && selectedFile) {
          setPreviewFile(selectedFile);
          setShowPreview(true);
        }
      } else {
        setError(data.message || 'Error al validar el PDF');
        setValidationResult(null);
      }
    } catch (err) {
      setError('Error de conexión. Intenta nuevamente.');
      setValidationResult(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (isValid) => {
    if (isValid) {
      return <CheckCircle className="w-8 h-8 text-green-500" />;
    } else {
      return <XCircle className="w-8 h-8 text-red-500" />;
    }
  };

  const getStatusColor = (isValid) => {
    return isValid ? 'text-green-600' : 'text-red-600';
  };

  const getStatusBgColor = (isValid) => {
    return isValid ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20';
  };



  const handleLogout = () => {
    // Limpiar datos de sesión
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userData');
    
    // Redirigir al login
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
              <Navigation onLogout={handleLogout} />
      
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Validar PDF Firmado
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Verifica la autenticidad e integridad de documentos PDF firmados digitalmente
            </p>
          </div>

          {/* Tabs */}
          <div className="flex justify-center mb-6">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setValidationMode('file')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  validationMode === 'file'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Subir Archivo
              </button>
              <button
                onClick={() => setValidationMode('url')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  validationMode === 'url'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                URL del PDF
              </button>
            </div>
          </div>

          {/* Upload Section */}
          <div className="bg-white dark:bg-background-light rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
            {validationMode === 'file' ? (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    id="pdf-upload"
                  />
                  <label
                    htmlFor="pdf-upload"
                    className="cursor-pointer text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    {selectedFile ? selectedFile.name : 'Haz clic para seleccionar un PDF'}
                  </label>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Máximo 50MB
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    URL del PDF
                  </label>
                  <input
                    type="url"
                    value={url}
                    onChange={handleUrlChange}
                    placeholder="https://ejemplo.com/documento.pdf"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 text-sm">
                <XCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={validatePDF}
              disabled={loading || (!selectedFile && validationMode === 'file') || (!url && validationMode === 'url')}
              className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Validando...' : 'Validar PDF'}
            </button>
          </div>

          {/* Results */}
          {validationResult && validationResult.validation && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-background-light rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Resultado de Validación
                </h2>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(validationResult.validation.isValid)}
                </div>
              </div>

              <div className={`p-4 rounded-lg ${getStatusBgColor(validationResult.validation.isValid)}`}>
                <p className={`font-medium ${getStatusColor(validationResult.validation.isValid)}`}>
                  {validationResult.validation.message}
                </p>
              </div>

              {/* Details */}
              <div className="mt-6 space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Detalles de Validación
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <Shield className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Firmas Digitales
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {validationResult.validation.signatureCount || 0} firma(s) encontrada(s)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Integridad
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {validationResult.validation.isModified ? 'Modificado' : 'Intacto'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-purple-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Sistema de Origen
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {validationResult.validation.isOurSystem ? 'Nuestro Sistema' : 'Otro Sistema'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-orange-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Certificado
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {validationResult.validation.isValid ? 'Válido' : 'Inválido'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* QR Information */}
                {validationResult.qrInfo && (
                  <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                      Información del Firmante
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {validationResult.qrInfo.signerName || 'No disponible'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Info className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {validationResult.qrInfo.organization || 'No disponible'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Visor del PDF inline */}
              {showPreview && previewFile && (
                <div className="mt-8">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Vista Previa del PDF
                  </h3>
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <PDFPreview
                      pdfFile={previewFile}
                      onClose={() => setShowPreview(false)}
                      showMarkers={false}
                      markers={[]}
                      inline={true}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default PDFValidationPage; 