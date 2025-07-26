import React, { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Upload, FileText, X } from 'lucide-react'
import { documentoService } from '../../services/api'

function DocumentUpload({ onUploadSuccess }) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [error, setError] = useState(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const validateFile = (file) => {
    if (file.type !== 'application/pdf') {
      setError('Solo se permiten archivos PDF')
      return false
    }
    if (file.size > 10 * 1024 * 1024) { // 10MB
      setError('El archivo no debe superar los 10MB')
      return false
    }
    return true
  }

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
    setError(null)

    const file = e.dataTransfer.files[0]
    if (file && validateFile(file)) {
      setSelectedFile(file)
    }
  }, [])

  const handleFileSelect = useCallback((e) => {
    setError(null)
    const file = e.target.files?.[0]
    if (file && validateFile(file)) {
      setSelectedFile(file)
    }
  }, [])

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('documento', selectedFile)
      
      await documentoService.subir(formData)
      setSelectedFile(null)
      onUploadSuccess()
    } catch (error) {
      console.error('Error al subir el documento:', error)
      setError('Error al subir el documento')
    } finally {
      setIsUploading(false)
    }
  }

  const removeFile = () => {
    setSelectedFile(null)
    setError(null)
  }

  return (
    <div className="bg-white dark:bg-background rounded-lg shadow-lg overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Subir Documento</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
          Arrastra y suelta tu archivo PDF o haz clic para seleccionarlo
        </p>
      </div>

      <div className="p-6">
        {!selectedFile ? (
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragging 
                ? 'border-primary bg-primary/5 dark:bg-primary/10' 
                : 'border-gray-300 dark:border-gray-600 hover:border-primary dark:hover:border-primary'
              }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('fileInput')?.click()}
          >
            <input
              id="fileInput"
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Upload className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-300 mb-2">
              Arrastra tu archivo PDF aquí o haz clic para seleccionarlo
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Máximo 10MB
            </p>
          </motion.div>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileText className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                onClick={removeFile}
                className="p-1 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {selectedFile && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleUpload}
            disabled={isUploading}
            className={`mt-4 w-full py-2 px-4 rounded-lg text-white font-medium
              ${isUploading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-primary hover:bg-primary/90'
              }`}
          >
            {isUploading ? 'Subiendo...' : 'Subir Documento'}
          </motion.button>
        )}
      </div>
    </div>
  )
}

export default DocumentUpload 