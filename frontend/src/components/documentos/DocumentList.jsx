import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Eye, Download, Signature, Trash2, CheckCircle, PenTool, FileText, User } from 'lucide-react'
import { documentoService } from '../../services/api'
import PDFViewer from './PDFViewer.jsx'
import PDFSignatureViewer from './PDFSignatureViewer.jsx'
import SignatureConfirmationModal from './SignatureConfirmationModal.jsx'
import NotificationContainer from '../layout/NotificationContainer.jsx'
import QRCode from 'qrcode';

function DocumentList({ documents, onDelete }) {
  const [showSignatureViewer, setShowSignatureViewer] = useState(false)
  const [showViewer, setShowViewer] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [signatureInfo, setSignatureInfo] = useState(null)
  const [showConfirmationModal, setShowConfirmationModal] = useState(false)
  const [notifications, setNotifications] = useState([])

  const formatDate = (dateString) => {
    if (!dateString) return 'Fecha no disponible'
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getDocumentStatus = (document) => {
    // Verificar si tiene firmantes (nuevo sistema de solicitudes)
    if (document.firmantes && document.firmantes.length > 0) {
      const firmantes = document.firmantes.map(f => f.nombre || f.usuarioId?.nombre || 'Firmante desconocido');
      const fechaUltimaFirma = document.firmantes[document.firmantes.length - 1]?.fechaFirma;
      const fecha = fechaUltimaFirma ? new Date(fechaUltimaFirma).toLocaleDateString('es-ES') : 'Fecha no disponible';
      
      return {
        text: `Firmado por: ${firmantes.join(', ')}`,
        subtitle: `Fecha: ${fecha} | ${document.firmantes.length} firma(s)`,
        icon: 'CheckCircle',
        className: 'bg-blue-100 dark:bg-blue-800/20 text-blue-700 dark:text-blue-400',
        iconClassName: 'text-blue-600 dark:text-blue-400',
        isSigned: true,
        firmantes: document.firmantes
      }
    }
    
    // Verificar si tiene solicitudes pendientes
    if (document.solicitudesPendientes && document.solicitudesPendientes > 0) {
      return {
        text: `${document.solicitudesPendientes} solicitud(es) pendiente(s)`,
        subtitle: 'Esperando firmas',
        icon: 'PenTool',
        className: 'bg-yellow-100 dark:bg-yellow-800/20 text-yellow-700 dark:text-yellow-400',
        iconClassName: 'text-yellow-600 dark:text-yellow-400',
        isSigned: false,
        hasPendingRequests: true
      }
    }
    
    // Verificar firma digital antigua (sistema anterior)
    if (document.firmaDigital) {
      const firmaInfo = document.firmaDigital;
      const firmante = firmaInfo.nombreFirmante || 'Firmante desconocido';
      const fecha = firmaInfo.fechaFirma ? new Date(firmaInfo.fechaFirma).toLocaleDateString('es-ES') : 'Fecha no disponible';
      
      return {
        text: `Firmado por: ${firmante}`,
        subtitle: `Fecha: ${fecha}`,
        icon: 'CheckCircle',
        className: 'bg-blue-100 dark:bg-blue-800/20 text-blue-700 dark:text-blue-400',
        iconClassName: 'text-blue-600 dark:text-blue-400',
        isSigned: true
      }
    }
    
    return {
      text: 'Listo para firmar',
      icon: 'PenTool',
      className: 'bg-green-100 dark:bg-green-800/20 text-green-700 dark:text-green-400',
      iconClassName: 'text-green-600 dark:text-green-400',
      isSigned: false
    }
  }

  const handleView = async (id) => {
    try {
      // Buscar el documento completo en la lista
      const document = documents.find(doc => doc._id === id)
      if (document) {
        setSelectedDocument(document)
        setShowViewer(true)
      } else {
        console.error('Documento no encontrado en la lista:', id)
      }
    } catch (error) {
      console.error('Error al visualizar el documento:', error)
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
    } catch (error) {
      console.error('Error al descargar el documento:', error)
    }
  }

  const handleDelete = async (id) => {
    try {
      await documentoService.eliminar(id)
      onDelete(id)
    } catch (error) {
      console.error('Error al eliminar el documento:', error)
    }
  }

  const handleSignDocument = (document) => {
    setSelectedDocument(document)
    setShowSignatureViewer(true)
  }

  const handlePositionSelected = (signatureInfo) => {
    console.log('Información de firma digital:', signatureInfo)
    console.log('Documento:', selectedDocument)
    console.log('CertificateData recibido:', signatureInfo.certificateData)
    
    // Agregar el nombre del documento a la información de firma
    const completeSignatureInfo = {
      ...signatureInfo,
      documentName: selectedDocument?.nombre
    }
    
    console.log('Información completa a enviar al modal:', completeSignatureInfo)
    setSignatureInfo(completeSignatureInfo)
    setShowConfirmationModal(true)
  }

  const handleCloseViewer = () => {
    setShowViewer(false)
    setSelectedDocument(null)
  }

  const handleCloseSignatureViewer = () => {
    setShowSignatureViewer(false)
    setSelectedDocument(null)
  }

  const handleCloseConfirmationModal = () => {
    setShowConfirmationModal(false)
    setSignatureInfo(null)
    // No limpiar selectedDocument aquí para mantener la referencia
  }

  const handleConfirmSignature = async (certificatePassword) => {
    try {
      if (!signatureInfo) {
        showNotification('Error: Información de firma incompleta', 'error')
        return
      }

      const documentId = signatureInfo.documentId
      const certificateData = signatureInfo.certificateData ? {
        ...signatureInfo.certificateData,
        id: signatureInfo.certificateData._id || signatureInfo.certificateData.id
      } : null

      // Usar el nuevo endpoint que guarda la información de la firma
      const result = await documentoService.firmarDocumento(
        documentId,
        certificateData.id,
        certificatePassword,
        certificateData.nombreComun,
        certificateData.organizacion,
        certificateData.email
      )

      // El PDF ya está firmado y guardado en el servidor
      // No descargar automáticamente

      setShowConfirmationModal(false)
      setSignatureInfo(null)
      showNotification('✅ Documento firmado correctamente', 'success', 8000)
      
      // Recargar la lista de documentos para mostrar el nuevo estado
      window.location.reload()
    } catch (error) {
      console.error('Error al firmar documento:', error)
      showNotification('Error al firmar el documento', 'error', 10000)
    }
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
                  {doc.esCompartido && (
                    <div className="mt-1">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-800/20 text-purple-700 dark:text-purple-400">
                        <User className="w-3 h-3 mr-1" />
                        Compartido por: {doc.usuario?.nombre || 'Desconocido'}
                      </span>
                    </div>
                  )}
                  <div className="mt-2 space-y-1">
                    {(() => {
                      const status = getDocumentStatus(doc)
                      const IconComponent = status.icon === 'CheckCircle' ? CheckCircle : PenTool
                      return (
                        <>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${status.className}`}>
                            <IconComponent className={`w-3 h-3 mr-1 ${status.iconClassName}`} />
                            {status.text}
                          </span>
                          {status.subtitle && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {status.subtitle}
                            </p>
                          )}
                        </>
                      )
                    })()}
                  </div>
                </div>
              </div>
              
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleView(doc._id)}
                    className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-800/20 rounded-lg transition-colors group/btn"
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

                  <motion.button
                    whileHover={{ scale: (doc.firmaDigital || (doc.firmantes && doc.firmantes.length > 0) || doc.esCompartido) ? 1 : 1.05 }}
                    whileTap={{ scale: (doc.firmaDigital || (doc.firmantes && doc.firmantes.length > 0) || doc.esCompartido) ? 1 : 0.95 }}
                    onClick={() => !doc.firmaDigital && !(doc.firmantes && doc.firmantes.length > 0) && !doc.esCompartido && handleSignDocument(doc)}
                    className={`p-2 rounded-lg transition-colors ${
                      (doc.firmaDigital || (doc.firmantes && doc.firmantes.length > 0) || doc.esCompartido)
                        ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed' 
                        : 'text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-800/20'
                    }`}
                    title={(doc.firmaDigital || (doc.firmantes && doc.firmantes.length > 0)) ? 'Documento ya firmado' : doc.esCompartido ? 'Documento compartido - no puedes firmar' : 'Firmar documento'}
                    disabled={doc.firmaDigital || (doc.firmantes && doc.firmantes.length > 0) || doc.esCompartido}
                  >
                    <Signature className="w-4 h-4" />
                  </motion.button>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleDelete(doc._id)}
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

      {/* Visor simple para visualizar documentos */}
      {showViewer && selectedDocument && (
        <PDFViewer
          documentId={selectedDocument._id}
          documentName={selectedDocument.nombre}
          onClose={handleCloseViewer}
        />
      )}

      {/* Visor de selección de posición de firma */}
      {showSignatureViewer && selectedDocument && (
        <PDFSignatureViewer
          documentId={selectedDocument._id}
          documentName={selectedDocument.nombre}
          onClose={handleCloseSignatureViewer}
          onPositionSelected={handlePositionSelected}
        />
      )}

      {/* Modal de confirmación de firma */}
      {showConfirmationModal && signatureInfo && (
        <SignatureConfirmationModal
          signatureInfo={signatureInfo}
          onClose={handleCloseConfirmationModal}
          onConfirm={handleConfirmSignature}
        />
      )}

      {/* Contenedor de notificaciones */}
      <NotificationContainer
        notifications={notifications}
        onRemove={removeNotification}
      />
    </div>
  )
}

export default DocumentList 