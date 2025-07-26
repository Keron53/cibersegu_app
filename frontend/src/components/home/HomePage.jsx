import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Upload, CheckCircle, XCircle } from 'lucide-react'
import Navigation from '../layout/Navigation.jsx'
import DocumentUpload from '../documentos/DocumentUpload.jsx'
import DocumentList from '../documentos/DocumentList.jsx'
import Notification from '../layout/Notification.jsx'
import { documentoService } from '../../services/api'

function HomePage() {
  const navigate = useNavigate()
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notification, setNotification] = useState(null)

  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    try {
      setLoading(true)
      const docs = await documentoService.listar()
      setDocuments(docs)
      setError(null)
    } catch (error) {
      console.error('Error al cargar documentos:', error)
      setError('Error al cargar los documentos')
    } finally {
      setLoading(false)
    }
  }

  const handleUploadSuccess = () => {
    loadDocuments()
    showNotification('Documento subido correctamente', 'success')
  }

  const handleDelete = (id) => {
    setDocuments(documents.filter(doc => doc._id !== id))
    showNotification('Documento eliminado', 'success')
  }

  const handleLogout = () => {
    showNotification('¡Sesión cerrada exitosamente!', 'success')
    localStorage.removeItem('token')

    setTimeout(() => {
      navigate('/login', { replace: true })
    }, 1500)
  }

  const showNotification = (message, type) => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 4000)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      <Navigation onLogout={handleLogout} />

      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Gestión de Documentos
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Administra tus documentos PDF de forma segura y eficiente. Visualiza y prepárate para firmar digitalmente.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1 bg-white dark:bg-background-light rounded-xl shadow border border-gray-200 dark:border-gray-700"
          >
            <DocumentUpload onUploadSuccess={handleUploadSuccess} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 bg-white dark:bg-background-light rounded-xl shadow border border-gray-200 dark:border-gray-700"
          >
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-300">Cargando documentos...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 dark:text-red-400">{error}</p>
                <button
                  onClick={loadDocuments}
                  className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Reintentar
                </button>
              </div>
            ) : (
              <DocumentList
                documents={documents}
                onDelete={handleDelete}
              />
            )}
          </motion.div>
        </div>

        {/* Botones de Certificados */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 flex flex-col sm:flex-row gap-4 justify-center"
        >
          <button
            onClick={() => navigate('/certificado')}
            className="flex items-center justify-center px-6 py-3 bg-primary hover:bg-primary-dark dark:bg-primary-light dark:hover:bg-primary text-white font-semibold rounded-lg shadow-lg transition-colors"
          >
            <Upload className="w-5 h-5 mr-2" />
            Subir Certificado Digital
          </button>
          
          <button
            onClick={() => navigate('/generar-certificado')}
            className="flex items-center justify-center px-6 py-3 bg-secondary hover:bg-secondary-dark dark:bg-secondary-light dark:hover:bg-secondary text-white font-semibold rounded-lg shadow-lg transition-colors"
          >
            <FileText className="w-5 h-5 mr-2" />
            Generar Nuevo Certificado
          </button>

          <button
            onClick={() => navigate('/mis-certificados')}
            className="flex items-center justify-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-lg transition-colors"
          >
            <FileText className="w-5 h-5 mr-2" />
            Ver Mis Certificados
          </button>
        </motion.div>
      </div>
    </div>
  )
}

export default HomePage 