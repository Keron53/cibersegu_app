import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import InputField from './InputField'
import LoadingSpinner from './LoadingSpinner'
import PasswordPolicy from './PasswordPolicy'
import { authService } from '../../services/api'

function EmailVerification({ email: propEmail, onVerificationSuccess }) {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [verificationData, setVerificationData] = useState({
    email: propEmail || location.state?.email || '',
    codigo: ''
  })
  
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  
  // Si no hay email, redirigir al registro
  useEffect(() => {
    if (!verificationData.email) {
      navigate('/register');
    }
  }, [verificationData.email, navigate]);
  
  const handleChange = (e) => {
    const { name, value } = e.target
    setVerificationData({
      ...verificationData,
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
    
    if (!verificationData.codigo.trim()) {
      newErrors.codigo = 'El código de verificación es requerido'
    } else if (verificationData.codigo.length !== 6) {
      newErrors.codigo = 'El código debe tener 6 dígitos'
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
      await authService.verificarEmail(verificationData)
      setSuccessMessage('Email verificado exitosamente')
      
      if (onVerificationSuccess) {
        onVerificationSuccess()
      } else {
        setTimeout(() => {
          navigate('/login')
        }, 2000)
      }
      
    } catch (error) {
      console.error('Error al verificar email:', error)
      const backendMsg = error.response?.data?.mensaje || error.response?.data?.error || error.message || 'Error al verificar email.'
      setErrors({
        form: backendMsg,
        type: 'error'
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleReenviarCodigo = async () => {
    setIsLoading(true)
    
    try {
      await authService.reenviarCodigo({ email: verificationData.email })
      setSuccessMessage('Nuevo código enviado a tu email')
    } catch (error) {
      console.error('Error al reenviar código:', error)
      const backendMsg = error.response?.data?.mensaje || error.response?.data?.error || error.message || 'Error al reenviar código.'
      setErrors({
        form: backendMsg,
        type: 'error'
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  // Si no hay email, mostrar mensaje de carga
  if (!verificationData.email) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="max-w-md mx-auto"
    >
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Verificar Email
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Ingresa el código de 6 dígitos enviado a {verificationData.email}
        </p>
      </div>

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

      <motion.form 
        onSubmit={handleSubmit}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="space-y-5">
          <InputField
            type="text"
            name="codigo"
            label="Código de Verificación"
            value={verificationData.codigo}
            onChange={handleChange}
            error={errors.codigo}
            placeholder="123456"
            maxLength={6}
          />
          
          <motion.button
            type="submit"
            className="primary-button w-full"
            disabled={isLoading}
            whileTap={{ scale: 0.97 }}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <LoadingSpinner className="mr-2" />
                Verificando...
              </span>
            ) : (
              'Verificar Email'
            )}
          </motion.button>

          <button
            type="button"
            onClick={handleReenviarCodigo}
            disabled={isLoading}
            className="secondary-button w-full"
          >
            Reenviar Código
          </button>
        </div>
      </motion.form>
      
      <PasswordPolicy className="mt-4" />
    </motion.div>
  )
}

export default EmailVerification 