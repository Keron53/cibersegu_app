import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Eye, Download, CheckCircle, FileText, User } from 'lucide-react'
import { documentoService } from '../../services/api'
import PDFViewer from './PDFViewer.jsx'
import NotificationContainer from '../layout/NotificationContainer.jsx'

function DocumentosFirmados() {
  const [documentos, setDocumentos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showViewer, setShowViewer] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    cargarDocumentosFirmados()
  }, [])

  const cargarDocumentosFirmados = async () => {
    try {
      setLoading(true)
      const data = await documentoService.listarFirmados()
      console.log('📄 Documentos firmados cargados:', data)
      setDocumentos(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('❌ Error cargando documentos firmados:', error)
      showNotification('Error al cargar documentos firmados', 'error')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Fecha no disponible'
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleView = async (documento) => {
    try {
      setSelectedDocument(documento)
      setShowViewer(true)
    } catch (error) {
      console.error('Error al visualizar el documento:', error)
      showNotification('Error al visualizar el documento', 'error')
    }
  }

  const handleDownload = async (id, nombre) => {
    try {
      const blob = await documentoService.ver(id)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = nombre
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      showNotification('Documento descargado exitosamente', 'success')
    } catch (error) {
      console.error('Error al descargar el documento:', error)
      showNotification('Error al descargar el documento', 'error')
    }
  }

  const showNotification = (message, type = 'info', duration = 4000) => {
    const id = Date.now()
    const notification = { id, message, type }
    setNotifications(prev => [...prev, notification])
    
    setTimeout(() => {
      removeNotification(id)
    }, duration)
  }

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }

  const handleCloseViewer = () => {
    setShowViewer(false)
    setSelectedDocument(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Documentos Firmados
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Documentos que has firmado para otros usuarios
        </p>
      </div>

      {documentos.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No has firmado documentos aún
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Los documentos que firmes para otros usuarios aparecerán aquí
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documentos.map((doc, index) => (
            <motion.div
              key={doc._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-background"
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800/20 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate" title={doc.nombre}>
                    {doc.nombre}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Propietario: {doc.usuario?.nombre || 'Desconocido'}
                  </p>
                  
                  {/* Información de la firma del usuario */}
                  {doc.miFirma && (
                    <div className="mt-2">
                      <div className="flex items-center space-x-1">
                        <User className="w-3 h-3 text-green-500" />
                        <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                          Firmado por ti
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(doc.miFirma.fechaFirma)}
                      </p>
                    </div>
                  )}
                  
                  {/* Información general de firmas */}
                  {doc.numeroFirmas > 0 && (
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-800/20 text-blue-700 dark:text-blue-400">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {doc.numeroFirmas} firma(s) total
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleView(doc)}
                    className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-800/20 rounded-lg transition-colors"
                    title="Visualizar documento"
                  >
                    <Eye className="w-4 h-4" />
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDownload(doc._id, doc.nombre)}
                    className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-800/20 rounded-lg transition-colors"
                    title="Descargar documento"
                  >
                    <Download className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Visor de PDF */}
      {showViewer && selectedDocument && (
        <PDFViewer
          documentId={selectedDocument._id}
          documentName={selectedDocument.nombre}
          onClose={handleCloseViewer}
        />
      )}

      {/* Notificaciones */}
      <NotificationContainer 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
    </div>
  )
}

export default DocumentosFirmados 