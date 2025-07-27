import React from 'react'
import { Shield, Check } from 'lucide-react'

function PasswordPolicy({ className = '' }) {
  return (
    <div className={`p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg ${className}`}>
      <div className="flex items-start space-x-2">
        <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Política de contraseñas seguras:</strong>
          <ul className="mt-2 space-y-1 text-xs">
            <li className="flex items-center space-x-1">
              <Check className="w-3 h-3 text-green-500" />
              <span>Mínimo 8 caracteres</span>
            </li>
            <li className="flex items-center space-x-1">
              <Check className="w-3 h-3 text-green-500" />
              <span>Al menos una letra mayúscula (A-Z)</span>
            </li>
            <li className="flex items-center space-x-1">
              <Check className="w-3 h-3 text-green-500" />
              <span>Al menos una letra minúscula (a-z)</span>
            </li>
            <li className="flex items-center space-x-1">
              <Check className="w-3 h-3 text-green-500" />
              <span>Al menos un número (0-9)</span>
            </li>
            <li className="flex items-center space-x-1">
              <Check className="w-3 h-3 text-green-500" />
              <span>Caracteres especiales opcionales (!@#$%^&*)</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default PasswordPolicy 