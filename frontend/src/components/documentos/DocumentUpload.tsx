import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Upload, FileText, X } from 'lucide-react'

interface DocumentUploadProps {
  onUpload: (file: File) => void
  isUploading?: boolean
}

function DocumentUpload({ onUpload, isUploading = false }: DocumentUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    }
    else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const files = e.dataTransfer.files
    if (files && files[0] && files[0].type === 'application/pdf') {
      setSelectedFile(files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0]) {
      setSelectedFile(files[0])
    }
  }

  const handleUpload = () => {
    if (selectedFile) {
      onUpload(selectedFile)
      setSelectedFile(null)
    }
  }

  const clearFile = () => {
    setSelectedFile(null)
  }

  return (
    <div className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Subir Documento</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">Arrastra y suelta tu archivo PDF o selecciónalo</p>
      </div>

      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive 
            ? 'border-primary-light bg-primary/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isUploading}
        />
        
        {selectedFile ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-3">
              <FileText className="w-8 h-8 text-red-500" />
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedFile.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button
                onClick={clearFile}
                className="text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleUpload}
              disabled={isUploading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isUploading ? 'Subiendo...' : 'Subir Documento'}
            </motion.button>
          </div>
        ) : (
          <div className="space-y-4">
            <Upload className={`w-12 h-12 mx-auto ${dragActive ? 'text-blue-500' : 'text-gray-400 dark:text-gray-300'}`} />
            <div>
              <p className="text-gray-600 dark:text-gray-300">
                <span className="font-medium text-primary-light hover:text-primary cursor-pointer">
                  Haz clic para seleccionar
                </span>{' '}
                o arrastra tu archivo aquí
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Solo archivos PDF</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DocumentUpload