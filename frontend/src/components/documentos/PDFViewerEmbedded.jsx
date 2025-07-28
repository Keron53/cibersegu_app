import React, { useState, useEffect } from 'react'
import { documentoService } from '../../services/api'

function PDFViewerEmbedded({ documentId, documentName }) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pdfUrl, setPdfUrl] = useState(null)

  useEffect(() => {
    if (documentId) {
      loadDocument()
    }
  }, [documentId])

  const loadDocument = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      console.log('🔍 Cargando documento embebido:', documentId)
      console.log('🔍 Token en localStorage:', localStorage.getItem('token') ? 'existe' : 'no existe')
      
      // Primero probar si podemos acceder a usuarios (para verificar autenticación)
      try {
        const response = await fetch('http://localhost:3001/api/usuarios', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        console.log('🔍 Test usuarios response status:', response.status);
        if (response.ok) {
          const usuarios = await response.json();
          console.log('🔍 Usuarios cargados:', usuarios.length);
        }
      } catch (testError) {
        console.error('❌ Error test usuarios:', testError);
      }
      
      const blob = await documentoService.ver(documentId)
      const url = URL.createObjectURL(blob)
      setPdfUrl(url)
      setIsLoading(false)
    } catch (error) {
      console.error('❌ Error al cargar el documento embebido:', error)
      console.error('❌ Error response:', error.response)
      setError('Error al cargar el documento')
      setIsLoading(false)
    }
  }

  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl)
      }
    }
  }, [pdfUrl])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando documento...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-800">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    )
  }

  if (!pdfUrl) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-800">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">No se pudo cargar el documento</p>
        </div>
      </div>
    )
  }

  return (
    <iframe
      src={pdfUrl}
      className="w-full h-full border-0"
      title={documentName || 'Documento PDF'}
    />
  )
}

export default PDFViewerEmbedded 