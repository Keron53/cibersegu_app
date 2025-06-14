import React from 'react'
import { motion } from 'framer-motion'
import { FileText, Eye, Trash2, Download, PenTool } from 'lucide-react'

interface Document {
  _id: string
  nombre: string
  ruta: string
  fechaSubida?: string
}

interface DocumentListProps {
  documents: Document[]
  onDelete: (id: string) => void
  onView: (url: string) => void
}

function DocumentList({ documents, onDelete, onView }: DocumentListProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Fecha no disponible'
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleView = (ruta: string) => {
    const url = `http://localhost:3001/uploads/${ruta}`
    onView(url)
  }

  const handleDownload = (ruta: string, nombre: string) => {
    const url = `http://localhost:3001/uploads/${ruta}`
    const link = document.createElement('a')
    link.href = url
    link.download = nombre
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (documents.length === 0) {
    return (
      <div className="p-8 text-center">
        <FileText className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No hay documentos</h3>
        <p className="text-gray-500 dark:text-gray-400">Sube tu primer documento PDF para comenzar</p>
      </div>
    )
  }

  return (
    <div>
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Mis Documentos</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">{documents.length} documento{documents.length !== 1 ? 's' : ''}</p>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc, index) => (
            <motion.div
              key={doc._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-background"
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-red-100 dark:bg-red-800/20 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-red-500 dark:text-red-400" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate" title={doc.nombre}>
                    {doc.nombre}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formatDate(doc.fechaSubida)}
                  </p>
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-800/20 text-green-700 dark:text-green-400">
                      <PenTool className="w-3 h-3 mr-1" />
                      Listo para firmar
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleView(doc.ruta)}
                    className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-800/20 rounded-lg transition-colors group/btn"
                    title="Visualizar documento"
                  >
                    <Eye className="w-4 h-4" />
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDownload(doc.ruta, doc.nombre)}
                    className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-800/20 rounded-lg transition-colors"
                    title="Descargar documento"
                  >
                    <Download className="w-4 h-4" />
                  </motion.button>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onDelete(doc._id)}
                  className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-800/20 rounded-lg transition-colors"
                  title="Eliminar documento"
                >
                  <Trash2 className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default DocumentList