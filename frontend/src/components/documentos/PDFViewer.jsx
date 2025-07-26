import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download } from 'lucide-react'
import { documentoService } from '../../services/api'

function PDFViewer({ documentId, documentName, onClose }) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pdfUrl, setPdfUrl] = useState(null)
  const iframeRef = useRef(null)

  useEffect(() => {
    if (documentId) {
      loadDocument()
    }
  }, [documentId])

  const loadDocument = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      console.log('🔍 Cargando documento:', documentId)
      const blob = await documentoService.ver(documentId)
      const url = URL.createObjectURL(blob)
      setPdfUrl(url)
      setIsLoading(false)
    } catch (error) {
      console.error('❌ Error al cargar el documento:', error)
      setError('Error al cargar el documento')
      setIsLoading(false)
    }
  }

  const handleDownload = async () => {
    try {
      const blob = await documentoService.ver(documentId)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = documentName || 'documento.pdf'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error al descargar el documento:', error)
    }
  }

  const handleClose = () => {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl)
    }
    onClose()
  }

  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl)
      }
    }
  }, [pdfUrl])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Visualizar Documento
              </h2>
              {documentName && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {documentName}
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handleDownload}
                className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-800/20 rounded-lg transition-colors"
                title="Descargar documento"
              >
                <Download className="w-5 h-5" />
              </button>
              
              <button
                onClick={handleClose}
                className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-4 overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-300">Cargando documento...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <X className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <p className="text-red-600 dark:text-red-400">{error}</p>
                  <button
                    onClick={loadDocument}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Reintentar
                  </button>
                </div>
              </div>
            ) : pdfUrl ? (
              <div className="h-full w-full">
                <iframe
                  ref={iframeRef}
                  src={pdfUrl}
                  className="w-full h-full border-0 rounded-lg"
                  title="Visualizador de PDF"
                />
              </div>
            ) : null}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default PDFViewer 