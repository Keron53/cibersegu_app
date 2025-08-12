import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navigation from '../layout/Navigation'
import { useTheme } from '../../context/ThemeContext'
import { Download, Trash2, FileText, Calendar, AlertCircle } from 'lucide-react'

function CertificateList() {
  const [certificates, setCertificates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [downloadingId, setDownloadingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [selectedCertificate, setSelectedCertificate] = useState(null)
  const [password, setPassword] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [certificateToDelete, setCertificateToDelete] = useState(null)
  const navigate = useNavigate()
  const { theme } = useTheme()

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login', { replace: true })
  }

  useEffect(() => {
    loadCertificates()
  }, [])

  const loadCertificates = async () => {
    try {
      setLoading(true)
      setError('')
      
      const response = await fetch('/api/certificados', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar certificados');
      }

      const data = await response.json();
      setCertificates(data);
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cargar certificados');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (certificate) => {
    // Reset all states when starting a new operation
    setError('')
    setMessage('')
    setPassword('')
    setSelectedCertificate(certificate)
    setShowPasswordModal(true)
  }

  const validateCertificatePassword = async (certificateId, password) => {
    try {
      const token = localStorage.getItem('token')
      
      // Primero intentamos con el endpoint de validación dedicado
      try {
        const validationResponse = await fetch(`/api/certificados/${certificateId}/validate-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ password })
        });

        if (validationResponse.ok) {
          return { valid: true };
        }

        // Si el endpoint de validación falla, continuamos con el método alternativo
        const result = await validationResponse.json();
        return { 
          valid: false, 
          error: result.error || 'La contraseña es incorrecta'
        };
      } catch (validationError) {
        console.warn('Error usando el endpoint de validación, intentando con descarga...', validationError);
      }

      // Método alternativo usando el endpoint de descarga con validateOnly
      const response = await fetch(`/api/certificados/download/${certificateId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password, validateOnly: true })
      });

      if (response.status === 200) {
        return { valid: true };
      }

      // Si llegamos aquí, hubo un error
      const result = await response.json().catch(() => ({}));
      return { 
        valid: false, 
        error: result.error === 'Contraseña incorrecta' || response.status === 401
          ? 'La contraseña es incorrecta' 
          : result.error || 'Error al validar la contraseña' 
      };
    } catch (error) {
      console.error('Error validando contraseña:', error);
      return { 
        valid: false, 
        error: error.message && error.message.includes('Failed to fetch')
          ? 'Error de conexión al servidor' 
          : 'Error al validar la contraseña' 
      };
    }
  };

  const confirmDownload = async () => {
    if (!selectedCertificate) return

    // Reset messages when starting the operation
    setError('')
    setMessage('')

    if (!password.trim()) {
      setError('La contraseña es obligatoria')
      return
    }

    try {
      setDownloadingId(selectedCertificate._id)
      setError('')
      setMessage('')

      // Validate password first
      const validation = await validateCertificatePassword(selectedCertificate._id, password)
      
      if (!validation.valid) {
        setError(validation.error || 'La contraseña es incorrecta')
        return
      }

      // If validation passes, proceed with download
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/certificados/download/${selectedCertificate._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Contraseña incorrecta')
      }

      // Only proceed with download if we get a successful response
      const blob = await response.blob()
      
      // Check if the response is actually a JSON error (which would mean the download failed)
      if (blob.type === 'application/json') {
        const errorData = JSON.parse(await blob.text())
        throw new Error(errorData.error || 'Contraseña incorrecta')
      }

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = selectedCertificate.originalFilename || `${selectedCertificate.nombreComun || 'certificado'}.p12`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      setMessage('✅ Certificado descargado exitosamente')
      const closeModal = () => {
        setShowPasswordModal(false)
        setPassword('')
        setError('')
        setMessage('')
        setSelectedCertificate(null)
        setCertificateToDelete(null)
      }
      closeModal()
    } catch (error) {
      console.error('Contraseña incorrecta:', error)
      setError(error.message || 'Contraseña incorrecta. Por favor, inténtalo de nuevo.')
    } finally {
      setDownloadingId(null)
    }
  }

  const handleDelete = (certificate) => {
    // Reset all states when starting a delete operation
    setError('')
    setMessage('')
    setPassword('')
    setCertificateToDelete(certificate)
    setShowPasswordModal(true)
  }

  const confirmDelete = async () => {
    if (!certificateToDelete) return

    // Reset messages when starting the operation
    setError('')
    setMessage('')

    if (!password.trim()) {
      setError('La contraseña es obligatoria')
      return
    }

    try {
      setDeletingId(certificateToDelete._id)
      setError('')
      setMessage('')

      // First validate the password
      const validation = await validateCertificatePassword(certificateToDelete._id, password)
      
      if (!validation.valid) {
        setError(validation.error || 'La contraseña es incorrecta')
        setDeletingId(null)
        return
      }

      // If password is valid, proceed with delete
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/certificados/${certificateToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password }) // Send password for validation
      })

      const result = await response.json()

      if (response.ok) {
        setCertificates(certificates.filter(cert => cert._id !== certificateToDelete._id))
        setMessage('✅ Certificado eliminado exitosamente')
        setShowPasswordModal(false)
        setShowDeleteModal(false)
        setCertificateToDelete(null)
        setPassword('')
      } else {
        throw new Error(result.error || 'Error al eliminar el certificado')
      }
    } catch (error) {
      console.error('Error al eliminar el certificado:', error)
      setError(error.message || 'Error al eliminar el certificado. Por favor, inténtalo de nuevo.')
    } finally {
      setDeletingId(null)
    }
  }

  const cancelDelete = () => {
    setShowDeleteModal(false)
    setCertificateToDelete(null)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const generateCertificateDisplayName = (cert) => {
    if (cert.originalFilename) {
      return cert.originalFilename;
    }
    if (cert.nombreComun) {
      return cert.nombreComun;
    }
    
    // Generar nombre descriptivo basado en fecha e ID
    const date = new Date(cert.createdAt);
    const dateStr = date.toISOString().split('T')[0];
    const shortId = cert._id?.slice(-6) || 'N/A';
    return `Certificado_${dateStr}_${shortId}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      <Navigation onLogout={handleLogout} />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-background-light rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="bg-primary/10 dark:bg-primary/20 rounded-full p-3 mr-4">
                <FileText className="w-8 h-8 text-primary dark:text-primary-light" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mis Certificados</h1>
                <p className="text-gray-600 dark:text-gray-300">Gestiona todos tus certificados digitales</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/home')}
              className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg shadow-lg transition-colors"
            >
              Volver
            </button>
          </div>

          {message && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-green-800 dark:text-green-200">{message}</p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-300">Cargando certificados...</p>
            </div>
          ) : certificates.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No tienes certificados</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">Sube o genera tu primer certificado digital</p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => navigate('/certificado')}
                  className="px-6 py-3 bg-primary hover:bg-primary-dark dark:bg-primary-light dark:hover:bg-primary text-white font-semibold rounded-lg shadow-lg transition-colors"
                >
                  Subir Certificado
                </button>
                <button
                  onClick={() => navigate('/generar-certificado')}
                  className="px-6 py-3 bg-secondary hover:bg-secondary-dark dark:bg-secondary-light dark:hover:bg-secondary text-white font-semibold rounded-lg shadow-lg transition-colors"
                >
                  Generar Certificado
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {certificates.map((certificate) => (
                <div
                  key={certificate._id || certificate.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center space-x-4">
                    <div className="bg-primary/10 dark:bg-primary/20 rounded-full p-2">
                      <FileText className="w-6 h-6 text-primary dark:text-primary-light" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {generateCertificateDisplayName(certificate)}
                      </h3>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                        <Calendar className="w-4 h-4 mr-1" />
                        Creado: {formatDate(certificate.createdAt)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleDownload(certificate)}
                      disabled={downloadingId === certificate._id}
                      className="flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      {downloadingId === certificate._id ? 'Descargando...' : 'Descargar'}
                    </button>
                    
                    <button
                      onClick={() => handleDelete(certificate)}
                      disabled={deletingId === certificate._id}
                      className="flex items-center px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      {deletingId === certificate._id ? 'Eliminando...' : 'Eliminar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de confirmación de contraseña */}
      {showPasswordModal && (selectedCertificate || certificateToDelete) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4 dark:text-white">
              {certificateToDelete ? 'Confirmar eliminación' : 'Confirmar descarga'}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {certificateToDelete 
                ? 'Por favor, ingresa la contraseña del certificado para confirmar la eliminación.'
                : 'Por favor, ingresa la contraseña del certificado para continuar con la descarga.'}
            </p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white mb-4"
              placeholder="Contraseña del certificado"
              autoComplete="current-password"
            />
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            {message && <p className="text-green-500 text-sm mb-4">{message}</p>}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowPasswordModal(false)
                  setShowDeleteModal(false)
                  setPassword('')
                  setError('')
                  setSelectedCertificate(null)
                  setCertificateToDelete(null)
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                Cancelar
              </button>
              <button
                onClick={certificateToDelete ? confirmDelete : confirmDownload}
                disabled={downloadingId || deletingId}
                className={`px-4 py-2 text-white rounded ${
                  (downloadingId || deletingId) 
                    ? 'bg-blue-400' 
                    : certificateToDelete 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {deletingId 
                  ? 'Eliminando...' 
                  : downloadingId 
                    ? 'Descargando...' 
                    : certificateToDelete 
                      ? 'Eliminar' 
                      : 'Descargar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && certificateToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center mb-4">
              <div className="bg-red-100 dark:bg-red-900/20 rounded-full p-2 mr-3">
                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Eliminar Certificado
              </h3>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              ¿Estás seguro de que quieres eliminar el certificado{' '}
              <span className="font-semibold text-red-600 dark:text-red-400">
                "{generateCertificateDisplayName(certificateToDelete)}"
              </span>?
            </p>
            
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
              <p className="text-xs text-gray-600 dark:text-gray-300">
                <strong>Organización:</strong> {certificateToDelete.organizacion || 'N/A'}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-300">
                <strong>Email:</strong> {certificateToDelete.email || 'N/A'}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-300">
                <strong>Creado:</strong> {formatDate(certificateToDelete.createdAt)}
              </p>
            </div>
            
            <p className="text-xs text-red-600 dark:text-red-400 mb-4">
              ⚠️ Esta acción no se puede deshacer. El certificado será eliminado permanentemente.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                disabled={deletingId === certificateToDelete._id}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {deletingId === certificateToDelete._id ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CertificateList 