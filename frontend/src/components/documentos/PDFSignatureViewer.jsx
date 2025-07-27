import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MousePointer, Check, RotateCcw, QrCode, FileText } from 'lucide-react'
import { documentoService } from '../../services/api'
import { certificadoService } from '../../services/api'
import QRCodeGenerator from './QRCodeGenerator'

// Función utilitaria para generar los datos del QR a partir del certificado y el documento
function generateQRCodeData(certificateData, documentInfo, userData) {
  return {
    signer: certificateData.nombreComun || `${userData?.nombre || 'Usuario'} ${userData?.apellido || ''}`,
    organization: certificateData.organizacion || '',
    email: certificateData.email || userData?.email || '',
    serialNumber: certificateData.numeroSerie || '',
    document: documentInfo?.name || '',
    documentId: documentInfo?.id || '',
    date: new Date().toISOString(),
    validator: 'Digital Sign PUCESE'
  };
}

function PDFSignatureViewer({ documentId, documentName, onClose, onPositionSelected }) {
  const [pdfUrl, setPdfUrl] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isSelectingPosition, setIsSelectingPosition] = useState(false)
  const [signaturePosition, setSignaturePosition] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [userData, setUserData] = useState(null)
  const [qrData, setQrData] = useState(null)
  const [certificates, setCertificates] = useState([])
  const [selectedCertificate, setSelectedCertificate] = useState(null)
  const [showCertificateSelector, setShowCertificateSelector] = useState(false)
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const iframeRef = useRef(null)

  // Estado para el posicionamiento visual interactivo
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [previewPosition, setPreviewPosition] = useState(null)

  // Estado para la firma con node-signpdf
  const [signing, setSigning] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadDocument()
    loadUserData()
    loadCertificates()
    
    // Cleanup function para liberar la URL del blob
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl)
      }
    }
  }, [documentId])

  // Event listeners para el arrastre
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging])

  const loadDocument = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('📥 Cargando documento:', documentId)
      
      const blob = await documentoService.ver(documentId)
      console.log('📦 Blob recibido:', blob)
      console.log('📏 Tamaño del blob:', blob.size, 'bytes')
      console.log('📋 Tipo del blob:', blob.type)
      
      // Crear un objeto URL para el blob y establecerlo en el iframe
      const pdfUrl = URL.createObjectURL(blob)
      setPdfUrl(pdfUrl)
      console.log('✅ PDF URL establecido en estado')
      
      // Obtener información del PDF desde el backend
      try {
        console.log('🔍 Obteniendo información del PDF desde el backend...')
        const info = await documentoService.infoDocumento(documentId)
        console.log('📄 Información del PDF obtenida:', info)
        setTotalPages(info.numPages || 1)
      } catch (error) {
        console.error('❌ Error al obtener información del PDF:', error)
        // Si no se puede obtener info, usar valor por defecto
        setTotalPages(1)
      }
    } catch (err) {
      console.error('❌ Error al cargar el documento:', err)
      setError('Error al cargar el documento: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadUserData = () => {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}')
    setUserData(userData)
  }

  const loadCertificates = async () => {
    try {
      const certs = await certificadoService.listar()
      setCertificates(certs)
      if (certs.length > 0) {
        setSelectedCertificate(certs[0])
      }
    } catch (error) {
      console.error('Error al cargar certificados:', error)
    }
  }

  const generateCertificateDisplayName = (cert) => {
    if (cert.nombreComun) return cert.nombreComun
    if (cert.nombre) return cert.nombre
    if (cert.filename) return cert.filename
    return 'Certificado sin nombre'
  }

  const handleStartPositionSelection = () => {
    if (!Array.isArray(certificates) || certificates.length === 0) {
      alert('No tienes certificados disponibles.\n\nPara firmar documentos necesitas:\n1. Subir un certificado .p12, o\n2. Generar un nuevo certificado\n\nVe a la sección "Mis Certificados" para agregar uno.')
      return
    }

    setIsSelectingPosition(true)
    setSignaturePosition(null)
    setPreviewPosition(null)
    console.log('🎯 Modo de selección de posición activado')
  }

  const handleCertificateSelect = (certificate) => {
    setSelectedCertificate(certificate)
    setShowCertificateSelector(false)
    // Generar QR code con los datos del certificado y documento
    const documentInfo = {
      name: documentName,
      id: documentId,
      page: signaturePosition?.page || currentPage
    }
    const qrObj = generateQRCodeData(certificate, documentInfo, userData)
    setQrData(JSON.stringify(qrObj))
    console.log('Información completa de firma digital (QR):', qrObj)
  }

  // Modificar handleCanvasClick para usar el canvas PDF.js
  const handleCanvasClick = (event) => {
    if (!isSelectingPosition) return
    
    const rect = iframeRef.current.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    
    console.log('🎯 Click detectado en:', { x, y })
    console.log('📏 Dimensiones del iframe:', rect.width, 'x', rect.height)
    
    const position = {
      x: x,
      y: y,
      page: currentPage,
      width: 80,
      height: 80,
      originalCoords: { x, y },
      canvasWidth: rect.width,
      canvasHeight: rect.height
    }
    setSignaturePosition(position)
    setIsSelectingPosition(false)
    
    console.log('📍 Posición de firma establecida:', position)
  }

  const handleReposition = () => {
    setSignaturePosition(null)
    setPreviewPosition(null)
    setIsSelectingPosition(true)
  }

  const handleConfirmPosition = async () => {
    if (!signaturePosition || !selectedCertificate || !qrData) {
      alert('Por favor selecciona una posición y un certificado antes de firmar.')
      return
    }

    try {
      // Si no hay datos QR, generarlos
      if (!qrData) {
        const documentInfo = {
          name: documentName,
          id: documentId,
          page: signaturePosition?.page || currentPage
        }
        const qrObj = generateQRCodeData(selectedCertificate, documentInfo, userData)
        setQrData(JSON.stringify(qrObj))
      }

      // Parsear los datos QR para obtener la información de firma
      const signatureData = qrData ? JSON.parse(qrData) : null

      const signatureInfo = {
        position: signaturePosition,
        certificateData: selectedCertificate,
        qrData: qrData,
        signatureData: signatureData,
        userData: userData,
        documentId: documentId,
        documentName: documentName
      }

      console.log('Información completa de firma digital:', signatureInfo)
      onPositionSelected(signatureInfo)
      onClose()
    } catch (error) {
      console.error('Error al firmar documento:', error)
      alert('Error al firmar el documento. Por favor intenta nuevamente.')
    }
  }

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      console.log('📄 Cambiando de página', currentPage, 'a', newPage)
      setCurrentPage(newPage)
      if (signaturePosition) {
        const updatedPosition = {
          ...signaturePosition,
          page: newPage
        }
        console.log('🎯 Actualizando posición a página', newPage, ':', updatedPosition)
        setSignaturePosition(updatedPosition)
      }
    }
  }

  const cleanup = () => {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl)
    }
  }

  useEffect(() => {
    return cleanup
  }, [pdfUrl])

  const handleMouseDown = (event) => {
    event.preventDefault()
    setIsDragging(true)
    const rect = event.currentTarget.getBoundingClientRect()
    setDragOffset({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    })
  }

  const handleMouseMove = (event) => {
    if (!isDragging || !signaturePosition) return

    const container = containerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    const newX = event.clientX - rect.left - dragOffset.x
    const newY = event.clientY - rect.top - dragOffset.y

    setPreviewPosition({ x: newX, y: newY })
  }

  const handleMouseUp = () => {
    if (isDragging && previewPosition && signaturePosition) {
      const updatedPosition = {
        ...signaturePosition,
        x: previewPosition.x,
        y: previewPosition.y
      }
      setSignaturePosition(updatedPosition)
      setPreviewPosition(null)
    }
    setIsDragging(false)
  }

  const confirmPosition = () => {
    if (!signaturePosition) return
    
    if (!Array.isArray(certificates) || certificates.length === 0) {
      alert('No tienes certificados disponibles.\n\nPara firmar documentos necesitas:\n1. Subir un certificado .p12, o\n2. Generar un nuevo certificado\n\nVe a la sección "Mis Certificados" para agregar uno.')
      return
    }
    
    if (certificates.length === 1) {
      handleCertificateSelect(certificates[0])
    } else {
      setShowCertificateSelector(true)
    }
  }

  const handleSignWithNode = async () => {
    if (!selectedCertificate) {
      alert('Selecciona un certificado')
      return
    }
    if (!certPassword) {
      alert('Ingresa la contraseña del certificado')
      return
    }
    if (!pdfUrl) {
      alert('No se ha cargado el PDF')
      return
    }
    setSigning(true)
    setMessage('')
    setError('')
    try {
      // Descargar el PDF como blob
      const pdfBlob = await fetch(pdfUrl).then(r => r.blob())
      // Descargar el certificado .p12 del backend
      const certBlob = await certificadoService.descargar(selectedCertificate.id, certPassword)
      // Crear archivos para enviar
      const pdfFile = new File([pdfBlob], documentName || 'documento.pdf', { type: 'application/pdf' })
      const certFile = new File([certBlob], selectedCertificate.filename || 'certificado.p12', { type: 'application/x-pkcs12' })
      // Firmar usando node-signpdf
      const signedPdfBlob = await documentoService.firmarNode(pdfFile, certFile, certPassword)
      // Descargar el PDF firmado
      const link = document.createElement('a')
      link.href = URL.createObjectURL(signedPdfBlob)
      link.download = `firmado_${documentName || 'documento'}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setMessage('Documento firmado y descargado exitosamente')
    } catch (err) {
      setError('Error al firmar el documento: ' + (err?.response?.data?.error || err.message))
      console.error(err)
    } finally {
      setSigning(false)
    }
  }

  const handleSignWithQRNode = async () => {
    if (!selectedCertificate) {
      alert('Selecciona un certificado')
      return
    }
    if (!pdfUrl) {
      alert('No se ha cargado el PDF')
      return
    }
    if (!signaturePosition) {
      alert('Selecciona la posición en el PDF')
      return
    }
    
    // Solicitar contraseña al usuario
    const password = prompt('Ingresa la contraseña del certificado:')
    if (!password) {
      return // Usuario canceló
    }
    setSigning(true)
    setMessage('')
    setError('')
    try {
      // Descargar el PDF como blob
      const pdfBlob = await fetch(pdfUrl).then(r => r.blob())
      // Descargar el certificado .p12 del backend
      const certBlob = await certificadoService.descargar(selectedCertificate.id, password)
      // Crear archivos para enviar
      const pdfFile = new File([pdfBlob], documentName || 'documento.pdf', { type: 'application/pdf' })
      const certFile = new File([certBlob], selectedCertificate.filename || 'certificado.p12', { type: 'application/x-pkcs12' })
      
      // Usar datos del certificado para el QR
      const nombre = selectedCertificate.nombreComun || 'Usuario'
      const correo = selectedCertificate.email || 'usuario@ejemplo.com'
      const organizacion = selectedCertificate.organizacion || 'Organización'
      
      // Firmar usando el endpoint QR, enviando posición y tamaño del canvas
      const canvasRect = containerRef.current?.getBoundingClientRect();
      const canvasWidth = canvasRect?.width || 1;
      const canvasHeight = canvasRect?.height || 1;
      const signedPdfBlob = await documentoService.firmarQRNode(
        pdfFile,
        certFile,
        password,
        nombre,
        correo,
        organizacion,
        signaturePosition.x,
        signaturePosition.y,
        signaturePosition.page,
        canvasWidth,
        canvasHeight,
        100 // Tamaño fijo del QR
      )
      // Descargar el PDF firmado
      const link = document.createElement('a')
      link.href = URL.createObjectURL(signedPdfBlob)
      link.download = `firmado_${documentName || 'documento'}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setMessage('Documento firmado y descargado exitosamente')
    } catch (err) {
      setError('Error al firmar el documento: ' + (err?.response?.data?.error || err.message))
      console.error(err)
    } finally {
      setSigning(false)
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Cargando documento...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    )
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full h-full max-w-[90vw] max-h-[85vh] bg-white dark:bg-gray-800 rounded-lg shadow-xl flex flex-col"
          style={{ maxHeight: '800px', maxWidth: '1400px', minHeight: '600px' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Seleccionar Posición de Firma Digital
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {documentName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Página {currentPage} de {totalPages} páginas detectadas
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              {selectedCertificate && (
                <div className="flex items-center px-3 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <FileText className="w-4 h-4 text-green-600 dark:text-green-400 mr-1" />
                  <span className="text-sm text-green-600 dark:text-green-400">
                    {generateCertificateDisplayName(selectedCertificate)}
                  </span>
                </div>
              )}

              {isSelectingPosition && (
                <div className="flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <MousePointer className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-1" />
                  <span className="text-sm text-blue-600 dark:text-blue-400">
                    Haz clic para posicionar en página {currentPage}
                  </span>
                </div>
              )}
              
              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleStartPositionSelection}
                disabled={isSelectingPosition}
                className="flex items-center px-4 py-2 bg-primary hover:bg-primary-dark dark:bg-primary-light dark:hover:bg-primary text-white font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                <MousePointer className="w-4 h-4 mr-2" />
                Seleccionar Posición
              </button>

              {signaturePosition && (
                <>
                  <button
                    onClick={confirmPosition}
                    className="flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Confirmar Posición
                  </button>

                  <button
                    onClick={handleReposition}
                    className="flex items-center px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reposicionar
                  </button>

                  <button
                    onClick={handleConfirmPosition}
                    disabled={!signaturePosition || !selectedCertificate || !qrData}
                    className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <QrCode className="w-4 h-4 mr-2" />
                    Firmar
                  </button>
                </>
              )}
            </div>

            {/* Navegación de páginas */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded disabled:opacity-50"
              >
                Anterior
              </button>
              
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Página {currentPage} de {totalPages}
              </span>
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>

          {/* Contenido Principal - Horizontal */}
          <div className="flex-1 flex flex-row min-h-0">
            {/* PDF Viewer - Lado Izquierdo */}
            <div 
              ref={containerRef}
              className="flex-1 relative bg-gray-100 dark:bg-gray-700 overflow-hidden"
              style={{ 
                minHeight: '600px',
                maxHeight: '600px',
                width: '100%'
              }}
            >
              {pdfUrl && (
                <iframe
                  ref={iframeRef}
                  src={pdfUrl}
                  className="w-full h-full border-0"
                  style={{ 
                    cursor: isSelectingPosition ? 'crosshair' : 'default',
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain'
                  }}
                  onClick={handleCanvasClick}
                />
              )}

              {/* Overlay transparente para capturar clics */}
              {isSelectingPosition && (
                <div
                  className="absolute inset-0 bg-transparent cursor-crosshair z-5"
                  onClick={handleCanvasClick}
                />
              )}

              {/* Vista previa de la posición de firma */}
              {signaturePosition && (
                <>
                  {/* Debug info */}
                  <div className="absolute top-2 left-2 bg-black text-white text-xs p-2 rounded z-30">
                    Debug: SP={signaturePosition?.page}, CP={currentPage}, Match={signaturePosition?.page === currentPage}
                  </div>
                  
                  {/* Indicador del punto de clic */}
                  {signaturePosition.originalCoords && (
                    <div
                      className="absolute w-4 h-4 bg-red-500 border-2 border-white rounded-full pointer-events-none z-20 shadow-lg"
                      style={{
                        left: signaturePosition.originalCoords.x - 8,
                        top: signaturePosition.originalCoords.y - 8
                      }}
                    />
                  )}
                  
                  {/* Vista previa de la firma arrastrable */}
                  <div
                    className="absolute border-2 border-primary bg-white dark:bg-gray-800 rounded-lg cursor-move z-10 shadow-lg"
                    style={{
                      left: signaturePosition.x - 50,
                      top: signaturePosition.y - 50,
                      width: 100,
                      height: 100
                    }}
                    onMouseDown={handleMouseDown}
                  >
                    <div className="flex items-center justify-center h-full p-3">
                      {qrData && selectedCertificate ? (
                        <div className="flex items-center space-x-3 w-full">
                          <div className="flex-shrink-0">
                            <QRCodeGenerator data={qrData} size={60} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-600 dark:text-gray-300 mb-1">
                              Firmado electrónicamente por:
                            </p>
                            <p className="text-sm font-bold text-gray-900 dark:text-white mb-1 truncate">
                              {selectedCertificate.nombreComun || `${userData?.nombre || 'Usuario'} ${userData?.apellido || ''}`}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Validar únicamente con Digital Sign PUCESE
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded mx-auto mb-2 flex items-center justify-center">
                            <QrCode className="w-6 h-6 text-gray-500" />
                          </div>
                          <span className="text-xs text-gray-600 dark:text-gray-300">
                            Firma Digital QR
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Panel lateral de información - Lado Derecho */}
            <div className="w-64 border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex flex-col">
              <div className="flex-1 overflow-y-auto p-3">
              {signaturePosition ? (
                <div className="p-3 space-y-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Información de Firma
                    </h3>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Coordenadas seleccionadas:
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">X:</span>
                        <span className="text-gray-900 dark:text-white font-medium">
                          {Math.round(signaturePosition.x)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">Y:</span>
                        <span className="text-gray-900 dark:text-white font-medium">
                          {Math.round(signaturePosition.y)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {message && (
                    <div className="mt-2 p-2 bg-green-100 text-green-800 rounded">{message}</div>
                  )}
                  {error && (
                    <div className="mt-2 p-2 bg-red-100 text-red-800 rounded">{error}</div>
                  )}
                </div>
              ) : (
                <div className="p-4">
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <MousePointer className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">
                      Selecciona una posición en el PDF para ver la información de firma
                    </p>
                  </div>
                </div>
              )}
              </div>
            </div>
          </div>

          {/* Modal de selección de certificado */}
          {showCertificateSelector && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden"
              >
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Seleccionar Certificado
                  </h3>
                  
                  <div className="space-y-3">
                    {Array.isArray(certificates) && certificates.map((cert, index) => (
                      <button
                        key={cert._id || `cert-${index}`}
                        onClick={() => handleCertificateSelect(cert)}
                        className="w-full p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary dark:hover:border-primary-light transition-colors text-left"
                      >
                        <div className="flex items-center space-x-3">
                          <FileText className="w-5 h-5 text-primary" />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {generateCertificateDisplayName(cert)}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {cert.organizacion || 'Sin organización'}
                            </p>
                            {cert.createdAt && (
                              <p className="text-xs text-gray-400 dark:text-gray-500">
                                Creado: {new Date(cert.createdAt).toLocaleDateString()}
                              </p>
                            )}
                            {cert.fechaCreacion && (
                              <p className="text-xs text-gray-400 dark:text-gray-500">
                                Creado: {new Date(cert.fechaCreacion).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={() => setShowCertificateSelector(false)}
                      className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default PDFSignatureViewer