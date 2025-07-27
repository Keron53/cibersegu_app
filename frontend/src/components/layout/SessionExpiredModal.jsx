import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, LogIn, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

function SessionExpiredModal({ isOpen, onClose }) {
  const navigate = useNavigate()

  const handleRedirectToLogin = () => {
    // Limpiar datos de sesión
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('userData')
    
    // Redirigir al login
    navigate('/login', { replace: true })
    
    // Cerrar el modal
    if (onClose) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-center p-6 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 dark:bg-red-800 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
                  Sesión Expirada
                </h3>
                <p className="text-sm text-red-600 dark:text-red-400">
                  Tu sesión ha expirado por seguridad
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="text-center space-y-4">
              {/* Icono de reloj */}
              <div className="flex justify-center">
                <div className="p-3 bg-orange-100 dark:bg-orange-800 rounded-full">
                  <Clock className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                </div>
              </div>

              {/* Mensaje principal */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Sesión Expirada
                </h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                  Por razones de seguridad, tu sesión ha expirado automáticamente. 
                  Necesitas iniciar sesión nuevamente para continuar.
                </p>
              </div>

              {/* Información adicional */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  💡 <strong>Consejo:</strong> Para evitar esto en el futuro, 
                  mantén activa tu sesión realizando acciones periódicamente.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-center p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <button
              onClick={handleRedirectToLogin}
              className="flex items-center px-6 py-3 bg-primary hover:bg-primary-dark dark:bg-primary-light dark:hover:bg-primary text-white font-medium rounded-lg transition-colors shadow-lg hover:shadow-xl"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Ir al Login
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default SessionExpiredModal 