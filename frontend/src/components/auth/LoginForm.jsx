import React, { useState, useContext } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import { authService } from '../../services/api'
import LoadingSpinner from './LoadingSpinner'
import PasswordPolicy from './PasswordPolicy'
import ForgotPasswordModal from './ForgotPasswordModal'
import PasswordErrorModal from './PasswordErrorModal'
import { SessionContext } from '../../context/SessionContext'

function LoginForm() {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false)
  const [showPasswordErrorModal, setShowPasswordErrorModal] = useState(false)
  const [passwordErrorMessage, setPasswordErrorMessage] = useState('')
  
  const { hideSessionExpiredModal } = useContext(SessionContext)
  const navigate = useNavigate()
  
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
    
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      })
    }
  }
  
  const validate = () => {
    const newErrors = {}
    
    if (!formData.username.trim()) {
      newErrors.username = 'El nombre de usuario es requerido'
    }
    
    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    
    setIsLoading(true)
    setSuccessMessage('')
    setErrors({})
    
    try {
      const response = await authService.login(formData)
      console.log('Inicio de sesión exitoso:', response)
      
      // Verificar si el backend requiere verificación de email
      if (response.requiereVerificacion) {
        setErrors({
          form: `Debes verificar tu email antes de iniciar sesión. Revisa tu email: ${response.email}`,
          type: 'warning'
        })
        return
      }
      
      // Guardar el token en localStorage
      if (response.token) {
        localStorage.setItem('token', response.token)
      }
      
      // Guardar datos del usuario si están disponibles
      if (response.usuario) {
        localStorage.setItem('userData', JSON.stringify(response.usuario))
      }
      
      setSuccessMessage('¡Inicio de sesión exitoso!')
      
      // Navegar inmediatamente a home
      navigate('/home', { replace: true })
      
    } catch (error) {
      console.error('Error de inicio de sesión:', error)
      
      // Manejar errores específicos del backend
      const backendMsg = error.response?.data?.mensaje || error.response?.data?.error || error.message || 'Error al iniciar sesión. Por favor, intenta de nuevo.'
      
      // Detectar si es un error de credenciales incorrectas
      const isPasswordError = 
        backendMsg.toLowerCase().includes('credenciales') ||
        backendMsg.toLowerCase().includes('incorrectas') ||
        backendMsg.toLowerCase().includes('password') ||
        backendMsg.toLowerCase().includes('contraseña') ||
        backendMsg.toLowerCase().includes('usuario') ||
        backendMsg.toLowerCase().includes('no encontrado') ||
        error.response?.status === 401 ||
        error.response?.status === 400
      
      if (isPasswordError) {
        hideSessionExpiredModal() // Cierra el modal de sesión expirada
        setPasswordErrorMessage(backendMsg)
        setShowPasswordErrorModal(true)
        setErrors({})
      } else {
        setErrors({
          form: backendMsg,
          type: 'error'
        })
      }
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <>
      <motion.form 
        onSubmit={handleSubmit}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {successMessage && (
          <div className="mb-4 p-3 bg-green-500/20 border border-green-500 rounded text-green-500 text-sm">
            {successMessage}
          </div>
        )}
        
        {errors.form && (
          <div className={`mb-4 p-3 border rounded text-sm ${
            errors.type === 'warning' 
              ? 'bg-yellow-500/20 border-yellow-500 text-yellow-600'
              : errors.type === 'error'
              ? 'bg-red-500/20 border-red-500 text-red-500'
              : 'bg-red-500/20 border-red-500 text-red-500'
          }`}>
            {errors.form}
          </div>
        )}
        
        <div className="space-y-5">
          <div className="mb-4">
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Nombre de Usuario
            </label>
            <input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoComplete="username"
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoComplete="current-password"
            />
          </div>
          
          <div className="text-right">
            <button
              type="button"
              onClick={() => setShowForgotPasswordModal(true)}
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
          
          <motion.button
            type="submit"
            className="primary-button"
            disabled={isLoading}
            whileTap={{ scale: 0.97 }}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <LoadingSpinner className="mr-2" />
                Iniciando sesión...
              </span>
            ) : (
              'Iniciar Sesión'
            )}
          </motion.button>
        </div>
        
        <div className="mt-6 text-center text-sm text-gray-400">
          ¿No tienes una cuenta?{' '}
          <Link 
            to="/register"
            className="secondary-button font-medium"
          >
            Regístrate ahora
          </Link>
        </div>
        
        <PasswordPolicy className="mt-4" />
      </motion.form>

      {/* Modal de Recuperación de Contraseña */}
      <ForgotPasswordModal
        isOpen={showForgotPasswordModal}
        onClose={() => setShowForgotPasswordModal(false)}
      />

      {/* Modal de Error de Contraseña */}
      <PasswordErrorModal
        isOpen={showPasswordErrorModal}
        onClose={() => setShowPasswordErrorModal(false)}
        errorMessage={passwordErrorMessage}
      />
    </>
  )
}

export default LoginForm