import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Navigation from '../layout/Navigation'
import DocumentUpload from '../documentos/DocumentUpload'
import DocumentList from '../documentos/DocumentList'
import Notification from '../layout/Notification'
import PDFViewer from '../documentos/PDFViewer'
import api from '../../services/api' 


interface Document {
  _id: string
  nombre: string
  ruta: string
  fechaSubida?: string
}

interface NotificationType {
  message: string
  type: 'success' | 'error' | 'warning'
}

function HomePage() {
  const navigate = useNavigate()
  const [pdfs, setPdfs] = useState<Document[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [notification, setNotification] = useState<NotificationType | null>(null)
  const [viewingPDF, setViewingPDF] = useState<{ url: string; name: string } | null>(null)

  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    try {
      const res = await api.get('/documentos')
      setPdfs(res.data as Document[])
    } catch (err) {
      showNotification('Error al cargar documentos', 'error')
    }
  }

  const handleUpload = async (file: File) => {
    setIsUploading(true)
    const formData = new FormData()
    formData.append('pdf', file)
    
    try {
      await api.post('/documentos/subir', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      showNotification('Documento subido correctamente', 'success')
      loadDocuments()
    } catch (err) {
      showNotification('Error al subir el documento', 'error')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/documentos/${id}`)
      showNotification('Documento eliminado', 'success')
      setPdfs(pdfs.filter(pdf => pdf._id !== id))
    } catch (err) {
      showNotification('Error al eliminar documento', 'error')
    }
  }

  const handleView = (url: string) => {
    // Usar la URL del documento real proporcionada por el backend
    const doc = pdfs.find(pdf => url.includes(pdf.ruta))
    const fileName = doc ? doc.nombre : 'Documento PDF'
    
    setViewingPDF({
      url: url,
      name: fileName
    })
  }

  const handleClosePDFViewer = () => {
    setViewingPDF(null)
  }

  const handleLogout = () => {
    showNotification('¡Sesión cerrada exitosamente!', 'success')
    localStorage.removeItem('token')
    
    setTimeout(() => {
      navigate('/login', { replace: true })
    }, 1500)
  }

  const showNotification = (message: string, type: 'success' | 'error' | 'warning') => {
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
            <DocumentUpload onUpload={handleUpload} isUploading={isUploading} />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 bg-white dark:bg-background-light rounded-xl shadow border border-gray-200 dark:border-gray-700"
          >
            <DocumentList
              documents={pdfs}
              onDelete={handleDelete}
              onView={handleView}
            />
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {viewingPDF && (
          <PDFViewer
            pdfUrl={viewingPDF.url}
            fileName={viewingPDF.name}
            onClose={handleClosePDFViewer}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default HomePage