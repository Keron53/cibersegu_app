import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, FileText, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react'
import QRCodeGenerator from './QRCodeGenerator'
import { useNavigate } from 'react-router-dom'

function SignatureConfirmationModal({ signatureInfo, onClose, onConfirm }) {
  const navigate = useNavigate()
  
  // Debug: Log de los datos recibidos
  console.log('SignatureConfirmationModal recibió:', {
    signatureInfo,
    certificateData: signatureInfo?.certificateData,
    signatureData: signatureInfo?.signatureData
  })

  // Extraer datos de la nueva estructura
  const { position, certificateData, qrData, documentId, documentName } = signatureInfo
  
  // Parsear los datos del QR para obtener la información de firma
  let signatureData = null
  try {
    signatureData = qrData ? JSON.parse(qrData) : null
  } catch (error) {
    console.error('Error al parsear datos del QR:', error)
    signatureData = null
  }

  // Debug: Verificar datos del certificado
  console.log('Datos del certificado:', certificateData)
  console.log('Datos de firma:', signatureData)
  const [certificatePassword, setCertificatePassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [isSigning, setIsSigning] = useState(false)
  const [showDownloadModal, setShowDownloadModal] = useState(false)

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const validatePassword = async () => {
    if (!certificatePassword.trim()) {
      setPasswordError('❌ La contraseña del certificado es obligatoria')
      return false
    }

    setIsValidating(true)
    setPasswordError('')

    try {
      // Verificar que tenemos datos del certificado
      if (!certificateData) {
        setPasswordError('❌ Error: No se encontró información del certificado')
        return false
      }

      const certificateId = certificateData._id || certificateData.id
      if (!certificateId) {
        setPasswordError('❌ Error: ID del certificado no válido')
        return false
      }

      // Validar la contraseña llamando al backend
      const response = await fetch(`http://localhost:3001/api/certificados/${certificateId}/validate-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ password: certificatePassword })
      })

      if (!response.ok) {
        const errorData = await response.json()
        setPasswordError(errorData.mensaje || '❌ Contraseña incorrecta')
        return false
      }

      return true
    } catch (error) {
      console.error('Error al validar contraseña:', error)
      setPasswordError('❌ Error al validar la contraseña')
      return false
    } finally {
      setIsValidating(false)
    }
  }

  const handleConfirm = async () => {
    const isValid = await validatePassword()
    if (isValid) {
      setIsSigning(true)
      setPasswordError('')
      
      try {
        // Pasar la contraseña validada al callback
        await onConfirm(certificatePassword)
        
        // Simular un pequeño delay para mostrar la animación
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        // Mostrar modal de descarga en lugar de redirigir
        setShowDownloadModal(true)
      } catch (error) {
        console.error('Error durante la firma:', error)
        setPasswordError('❌ Error durante la firma del documento')
        setIsSigning(false)
      }
    }
  }

  // Si no hay datos válidos, no renderizar el modal
  if (!signatureInfo || !signatureData || !certificateData) {
    console.error('Datos faltantes para el modal:', { 
      signatureInfo: !!signatureInfo, 
      signatureData: !!signatureData, 
      certificateData: !!certificateData 
    })
    return null
  }

  return (
    <AnimatePresence mode="wait">
      {/* Modal Principal de Confirmación */}
      {!showDownloadModal && (
        <motion.div
          key="confirmation-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full mx-4 overflow-hidden flex flex-col"
            style={{ maxHeight: '650px' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Firma Digital Completada
              </h3>
              <button
                onClick={onClose}
                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-3 flex-1 overflow-y-auto">
              {/* Document Info */}
              <div className="mb-2">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  Documento firmado:
                </h4>
                <p className="text-base font-semibold text-primary dark:text-primary-light">
                  {documentName}
                </p>
              </div>

              {/* Layout Horizontal */}
              <div className="flex space-x-3">
                {/* Columna Izquierda - Certificado y QR */}
                <div className="flex-1">
                  {/* Certificate Info */}
                  <div className="mb-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                        Certificado utilizado:
                      </span>
                    </div>
                    {certificateData ? (
                      <>
                        <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                          {certificateData.nombreComun || 'Certificado'}
                        </p>
                        {certificateData.organizacion && (
                          <p className="text-xs text-blue-600 dark:text-blue-400">
                            {certificateData.organizacion}
                          </p>
                        )}
                        {certificateData.email && (
                          <p className="text-xs text-blue-600 dark:text-blue-400">
                            {certificateData.email}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                        Certificado seleccionado
                      </p>
                    )}
                  </div>

                  {/* Signature Block */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <div className="flex items-start space-x-3">
                      {/* QR Code */}
                      <div className="flex-shrink-0">
                        <QRCodeGenerator data={qrData} size={80} />
                        <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
                          Escanear para validar
                        </p>
                      </div>

                      {/* Signature Text */}
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                          Firmado electrónicamente por:
                        </p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                          {signatureData?.signer || 'Firmante'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Validar únicamente con {signatureData?.validator || 'Digital Sign PUCESE'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Info Text */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mt-4">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      El código QR contiene toda la información para validar la firma, incluyendo los datos del certificado utilizado.
                    </p>
                  </div>
                </div>

                {/* Columna Derecha - Detalles y Contraseña */}
                <div className="flex-1">
                  {/* Signature Details */}
                  {signatureData && (
                    <div className="space-y-2 mb-3">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                        Detalles de la Firma:
                      </h4>
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-300">Firmante:</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {signatureData.signer}
                            </span>
                          </div>
                          {signatureData.organization && (
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-300">Organización:</span>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {signatureData.organization}
                              </span>
                            </div>
                          )}
                          {signatureData.email && (
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-300">Email:</span>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {signatureData.email}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-300">Documento:</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {signatureData.document}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-300">Fecha:</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {formatDate(signatureData.date)}
                            </span>
                          </div>
                          {signatureData.serialNumber && (
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-300">Número de Serie:</span>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {signatureData.serialNumber}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-300">Validador:</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {signatureData.validator}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Password Input */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Contraseña del Certificado
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={certificatePassword}
                        onChange={(e) => {
                          setCertificatePassword(e.target.value)
                          setPasswordError('') // Limpiar error al escribir
                        }}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                          passwordError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Ingresa la contraseña del certificado"
                        disabled={isValidating || isSigning}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isValidating || isSigning}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {passwordError && (
                      <div className="flex items-center mt-2 text-red-600 dark:text-red-400">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        <span className="text-sm">{passwordError}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex-shrink-0" style={{ minHeight: '60px' }}>
              <button
                onClick={handleConfirm}
                disabled={isValidating || isSigning || !certificatePassword.trim()}
                className={`flex items-center px-4 py-2 font-medium rounded-lg transition-colors ${
                  isValidating || isSigning || !certificatePassword.trim()
                    ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    : 'bg-primary hover:bg-primary-dark dark:bg-primary-light dark:hover:bg-primary text-white'
                }`}
              >
                {isValidating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Validando...
                  </>
                ) : isSigning ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Firmando documento...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Firmar Documento
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Modal de Descarga */}
      {showDownloadModal && (
        <motion.div
          key="download-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Documento Firmado
              </h3>
              <button
                onClick={() => {
                  setShowDownloadModal(false)
                  onClose()
                  navigate('/home')
                }}
                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 text-center">
              <div className="mb-4">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  ¡Documento Firmado Exitosamente!
                </h4>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  El documento "{documentName}" ha sido firmado digitalmente.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    // Solo cerrar modal y redirigir
                    setShowDownloadModal(false)
                    onClose()
                    navigate('/home')
                  }}
                  className="w-full bg-primary hover:bg-primary-dark dark:bg-primary-light dark:hover:bg-primary text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
                >
                  <FileText className="w-5 h-5 mr-2" />
                  Ir al Home
                </button>
                
                <button
                  onClick={() => {
                    setShowDownloadModal(false)
                    onClose()
                    navigate('/home')
                  }}
                  className="w-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default SignatureConfirmationModal 