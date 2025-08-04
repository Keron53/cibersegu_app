import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Lock, Eye, EyeOff } from 'lucide-react'

function PasswordErrorModal({ isOpen, onClose, errorMessage = 'Credenciales incorrectas' }) {
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
                <Lock className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
                  Error de Autenticación
                </h3>
                <p className="text-sm text-red-600 dark:text-red-400">
                  No se pudo iniciar sesión
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="text-center space-y-4">
              {/* Icono de candado */}
              <div className="flex justify-center">
                <div className="p-3 bg-red-100 dark:bg-red-800 rounded-full">
                  <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
              </div>

              {/* Mensaje principal */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Credenciales Incorrectas
                </h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                  {errorMessage}
                </p>
              </div>

              {/* Información adicional */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  🔍 <strong>Verifica:</strong> 
                  <br />• Tu nombre de usuario está escrito correctamente
                  <br />• Tu contraseña es la correcta
                  <br />• Las mayúsculas y minúsculas importan
                </p>
              </div>

              {/* Opciones adicionales */}
              <div className="space-y-2">
                <div className="flex items-center justify-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                  <Eye className="w-3 h-3" />
                  <span>¿Olvidaste tu contraseña?</span>
                </div>
                <div className="flex items-center justify-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                  <EyeOff className="w-3 h-3" />
                  <span>Verifica que no tengas el bloqueo de mayúsculas activado</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-center p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <button
              onClick={onClose}
              className="flex items-center px-6 py-3 bg-primary hover:bg-primary-dark dark:bg-primary-light dark:hover:bg-primary text-white font-medium rounded-lg transition-colors shadow-lg hover:shadow-xl"
            >
              Entendido
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default PasswordErrorModal 