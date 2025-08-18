import React, { useState, useContext } from 'react'
import { motion } from 'framer-motion'
import { Eye, Download, Signature, Trash2, CheckCircle, PenTool, FileText, User } from 'lucide-react'
import { documentoService } from '../../services/api'
import PDFViewer from './PDFViewer.jsx'
import PDFSignatureViewer from './PDFSignatureViewer.jsx'
import SignatureConfirmationModal from './SignatureConfirmationModal.jsx'
import NotificationContainer from '../layout/NotificationContainer.jsx'
import AuthContext from '../../context/AuthContext.js'
import QRCode from 'qrcode';
import { useNavigate } from 'react-router-dom';

function DocumentList({ documents, onDelete }) {
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()
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

  // Verificar si el usuario actual ya firmó el documento
  const hasUserSigned = (document) => {
    if (!user || !document.firmantes) return false
    
    return document.firmantes.some(firmante => 
      firmante.usuarioId && firmante.usuarioId.toString() === user.id
    )
  }

  // Verificar si el usuario puede firmar el documento
  const canUserSign = (document) => {
    // No puede firmar si ya firmó
    if (hasUserSigned(document)) return false
    
    // No puede firmar si es un documento compartido (debe usar solicitudes)
    if (document.esCompartido) return false
    
    // Puede firmar si es el propietario o si tiene solicitudes pendientes
    return true
  }

  const getDocumentStatus = (document) => {
    // Verificar si tiene firmantes (nuevo sistema de solicitudes)
    if (document.firmantes && document.firmantes.length > 0) {
      const firmantes = Array.isArray(document.firmantes)
        ? document.firmantes.map(f => f?.nombre || f?.usuarioId?.nombre || 'Firmante desconocido')
        : [];
      const fechaUltimaFirma = document.firmantes[document.firmantes.length - 1]?.fechaFirma;
      const fecha = fechaUltimaFirma ? new Date(fechaUltimaFirma).toLocaleDateString('es-ES') : 'Fecha no disponible';
      
      // Verificar si el usuario actual ya firmó
      const userHasSigned = hasUserSigned(document);
      
      return {
        text: `Firmado por: ${firmantes.join(', ')}`,
        subtitle: `Fecha: ${fecha} | ${document.firmantes.length} firma(s)${userHasSigned ? ' | Ya firmaste' : ''}`,
        icon: 'CheckCircle',
        className: 'bg-blue-100 dark:bg-blue-800/20 text-blue-700 dark:text-blue-400',
        iconClassName: 'text-blue-600 dark:text-blue-400',
        isSigned: true,
        firmantes: document.firmantes,
        userHasSigned
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
    // Redirigir a la página dedicada para firmar
    navigate(`/firmar-documento-directo/${document._id}`)
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

  const handleSignatureSuccess = (message) => {
    showNotification(message, 'success', 8000)
    // Recargar la lista de documentos para mostrar el nuevo estado
    window.location.reload()
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

      // Extraer coordenadas de la posición de firma
      const position = signatureInfo.position || {}
      const { x, y, page } = position

      // Usar el nuevo endpoint que guarda la información de la firma con coordenadas
      const result = await documentoService.firmarDocumento(
        documentId,
        certificateData.id,
        certificatePassword,
        certificateData.nombreComun,
        certificateData.organizacion,
        certificateData.email,
        x,
        y,
        page
      )
      
      // Si llegamos aquí, la firma fue exitosa
      setShowConfirmationModal(false)
      setSignatureInfo(null)
      
      // Devolver el resultado para que el modal maneje el éxito
      return result
    } catch (error) {
      console.error('Error al firmar documento:', error);
      
      // Extraer información del error
      const errorResponse = error.response?.data || {};
      const errorMessage = error.message || '';
      const errorMessageLower = errorMessage.toLowerCase();
      const errorData = typeof errorResponse === 'string' ? errorResponse : JSON.stringify(errorResponse);
      
      // Mensaje de error por defecto
      let userFriendlyMessage = 'Error al firmar el documento';
      
      // Verificar si es un error de PKCS#12 (contraseña incorrecta o certificado inválido)
      const isPkcs12Error = 
        errorMessageLower.includes('pkcs12') || 
        errorMessageLower.includes('deserializar') || 
        errorMessageLower.includes('incorrecta') ||
        errorMessageLower.includes('contraseña') || 
        errorMessageLower.includes('password') ||
        errorMessageLower.includes('could not deserialize') ||
        errorMessageLower.includes('invalid password') ||
        (error.response && 
         error.response.data && 
         typeof error.response.data === 'string' && 
         error.response.data.toLowerCase().includes('pkcs12')) ||
        (error.response?.data?.error && 
         error.response.data.error.toString().toLowerCase().includes('pkcs12'));
      
      if (isPkcs12Error) {
        userFriendlyMessage = '❌ La contraseña del certificado es incorrecta o el certificado no es válido. Por favor, verifica la contraseña e inténtalo de nuevo.';
      } 
      // Manejar otros códigos de estado HTTP
      else if (error.response) {
        switch (error.response.status) {
          case 400:
            userFriendlyMessage = '❌ Solicitud incorrecta. Verifica los datos e inténtalo de nuevo.';
            break;
          case 401:
            userFriendlyMessage = '❌ No autorizado. Por favor, inicia sesión nuevamente.';
            break;
          case 403:
            userFriendlyMessage = '❌ No tienes permiso para realizar esta acción.';
            break;
          case 404:
            userFriendlyMessage = '❌ Recurso no encontrado.';
            break;
          case 500:
            userFriendlyMessage = '❌ Error en el servidor al procesar la firma. Por favor, inténtalo de nuevo más tarde.';
            break;
          case 503:
            userFriendlyMessage = '❌ El servicio no está disponible en este momento. Por favor, inténtalo más tarde.';
            break;
          default:
            userFriendlyMessage = `❌ Error del servidor (${error.response.status}): ${error.response.statusText}`;
        }
      } 
      // Manejar errores de red
      else if (error.request) {
        userFriendlyMessage = '❌ No se pudo conectar con el servidor. Verifica tu conexión a internet e inténtalo de nuevo.';
      }
      
      // Registrar detalles completos del error para depuración
      console.error('Detalles completos del error:', {
        message: error.message,
        response: errorResponse,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: errorData,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        }
      });
      
      // Mostrar notificación al usuario
      showNotification(userFriendlyMessage, 'error', 10000);
    }
  }

  const list = Array.isArray(documents)
    ? documents
    : Array.isArray(documents?.documentos)
      ? documents.documentos
      : Array.isArray(documents?.data)
        ? documents.data
        : [];

  if (list.length === 0) {
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
        <p className="text-sm text-gray-600 dark:text-gray-300">{list.length} documento{list.length !== 1 ? 's' : ''}</p>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((doc, index) => (
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
                    whileHover={{ scale: canUserSign(doc) ? 1.05 : 1 }}
                    whileTap={{ scale: canUserSign(doc) ? 0.95 : 1 }}
                    onClick={() => canUserSign(doc) && handleSignDocument(doc)}
                    className={`p-2 rounded-lg transition-colors ${
                      canUserSign(doc)
                        ? 'text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-800/20' 
                        : 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    }`}
                    title={
                      hasUserSigned(doc) 
                        ? 'Ya firmaste este documento' 
                        : doc.esCompartido 
                          ? 'Documento compartido - usa solicitudes de firma' 
                          : 'Firmar documento'
                    }
                    disabled={!canUserSign(doc)}
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
          onSuccess={handleSignatureSuccess}
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