import React from 'react'
import { motion } from 'framer-motion'
import { Check, X } from 'lucide-react'

function PasswordStrengthBar({ password }) {
  // Función para calcular la fortaleza de la contraseña
  const calculateStrength = (password) => {
    let score = 0
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    }

    // Calcular puntuación
    if (requirements.length) score += 20
    if (requirements.uppercase) score += 20
    if (requirements.lowercase) score += 20
    if (requirements.number) score += 20
    if (requirements.special) score += 20

    // Determinar nivel de fortaleza
    let strength = 'muy débil'
    let color = 'bg-red-500'
    let textColor = 'text-red-500'

    if (score >= 80) {
      strength = 'muy fuerte'
      color = 'bg-green-500'
      textColor = 'text-green-500'
    } else if (score >= 60) {
      strength = 'fuerte'
      color = 'bg-blue-500'
      textColor = 'text-blue-500'
    } else if (score >= 40) {
      strength = 'media'
      color = 'bg-yellow-500'
      textColor = 'text-yellow-600'
    } else if (score >= 20) {
      strength = 'débil'
      color = 'bg-orange-500'
      textColor = 'text-orange-500'
    }

    return { score, strength, color, textColor, requirements }
  }

  const { score, strength, color, textColor, requirements } = calculateStrength(password)

  return (
    <div className="space-y-3">
      {/* Barra de progreso */}
      <div className="w-full">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Fortaleza de la contraseña:
          </span>
          <span className={`text-sm font-medium ${textColor}`}>
            {strength}
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <motion.div
            className={`h-2 rounded-full ${color}`}
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Lista de requisitos */}
      <div className="space-y-2">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Requisitos de seguridad:
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            {requirements.length ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <X className="w-4 h-4 text-red-500" />
            )}
            <span className={`text-sm ${requirements.length ? 'text-green-600' : 'text-red-500'}`}>
              Al menos 8 caracteres
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            {requirements.uppercase ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <X className="w-4 h-4 text-red-500" />
            )}
            <span className={`text-sm ${requirements.uppercase ? 'text-green-600' : 'text-red-500'}`}>
              Al menos una letra mayúscula
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            {requirements.lowercase ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <X className="w-4 h-4 text-red-500" />
            )}
            <span className={`text-sm ${requirements.lowercase ? 'text-green-600' : 'text-red-500'}`}>
              Al menos una letra minúscula
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            {requirements.number ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <X className="w-4 h-4 text-red-500" />
            )}
            <span className={`text-sm ${requirements.number ? 'text-green-600' : 'text-red-500'}`}>
              Al menos un número
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            {requirements.special ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <X className="w-4 h-4 text-red-500" />
            )}
            <span className={`text-sm ${requirements.special ? 'text-green-600' : 'text-red-500'}`}>
              Al menos un carácter especial (!@#$%^&*)
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PasswordStrengthBar 