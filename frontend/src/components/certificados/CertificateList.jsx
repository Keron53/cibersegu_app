import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navigation from '../layout/Navigation'
import { useTheme } from '../../context/ThemeContext'
import { Download, Trash2, FileText, Calendar, AlertCircle, Eye, EyeOff } from 'lucide-react'

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
  const [certificateToDelete, setCertificateToDelete] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
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
    setSelectedCertificate(certificate)
    setShowPasswordModal(true)
  }

  const validateCertificatePassword = async (certificateId, password) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/certificados/${certificateId}/validate-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password })
      })

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Error al validar contraseña:', error)
      return { valid: false, message: 'Error al validar la contraseña' }
    }
  }

  const confirmDownload = async () => {
    if (!password.trim()) {
      setError('La contraseña es obligatoria')
      return
    }

    try {
      setDownloadingId(selectedCertificate._id)
      setError('')

      // Primero validar la contraseña
      const validation = await validateCertificatePassword(selectedCertificate._id, password)
      
      if (!validation.valid) {
        setError(validation.message || 'La contraseña es incorrecta')
        setDownloadingId(null)
        return
      }

      // Si la contraseña es válida, proceder con la descarga
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/certificados/download/${selectedCertificate._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password })
      })

      if (response.ok) {
        // Crear blob y descargar
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = selectedCertificate.originalFilename || `${selectedCertificate.nombreComun || 'certificado'}.p12`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        
        setMessage('Certificado descargado exitosamente')
        setShowPasswordModal(false)
        setPassword('')
        setShowPassword(false)
        setSelectedCertificate(null)
      } else {
        const result = await response.json()
        setError(result.error || 'Error al descargar el certificado')
      }
    } catch (err) {
      setError('Error al conectar con el servidor')
      console.error(err)
    } finally {
      setDownloadingId(null)
    }
  }

  const handleDelete = (certificate) => {
    setError('')
    setMessage('')
    setPassword('')
    setShowPassword(false)
    setCertificateToDelete(certificate)
    setShowPasswordModal(true)
  }

  const confirmDelete = async () => {
    if (!certificateToDelete) return

    if (!password.trim()) {
      setError('La contraseña es obligatoria')
      return
    }

    try {
      setDeletingId(certificateToDelete._id)
      setError('')

      // Primero validar la contraseña
      const validation = await validateCertificatePassword(certificateToDelete._id, password)
      
      if (!validation.valid) {
        setError(validation.message || 'La contraseña es incorrecta')
        setDeletingId(null)
        return
      }

      // Si la contraseña es válida, proceder con la eliminación
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/certificados/${certificateToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password })
      })

      const result = await response.json()

      if (response.ok) {
        setCertificates(certificates.filter(cert => cert._id !== certificateToDelete._id))
        setMessage('Certificado eliminado exitosamente')
        setShowDeleteModal(false)
        setShowPasswordModal(false)
        setPassword('')
        setShowPassword(false)
        setCertificateToDelete(null)
      } else {
        setError(result.error || 'Error al eliminar el certificado')
      }
    } catch (err) {
      setError('Error al conectar con el servidor')
      console.error(err)
    } finally {
      setDeletingId(null)
    }
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

      {/* Modal de contraseña */}
      {showPasswordModal && (selectedCertificate || certificateToDelete) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {certificateToDelete ? 'Confirmar eliminación' : 'Confirmar descarga'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              {certificateToDelete
                ? 'Por favor, ingresa la contraseña del certificado para confirmar la eliminación.'
                : 'Por favor, ingresa la contraseña del certificado para continuar con la descarga.'}
            </p>
            
            <div className="relative mb-4">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Contraseña del certificado"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            {message && <p className="text-green-500 text-sm mb-4">{message}</p>}
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowPasswordModal(false)
                  setPassword('')
                  setError('')
                  setShowPassword(false)
                  setSelectedCertificate(null)
                  setCertificateToDelete(null)
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={certificateToDelete ? confirmDelete : confirmDownload}
                disabled={downloadingId || deletingId}
                className={`px-4 py-2 text-white font-medium rounded-lg transition-colors disabled:opacity-50 ${
                  (downloadingId || deletingId)
                    ? 'bg-gray-400'
                    : certificateToDelete
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-primary hover:bg-primary-dark dark:bg-primary-light dark:hover:bg-primary'
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


    </div>
  )
}

export default CertificateList 