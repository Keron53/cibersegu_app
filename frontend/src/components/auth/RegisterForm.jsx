import { useState, useContext } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import AuthContext from '../../context/AuthContext'
import InputField from './InputField'
import LoadingSpinner from './LoadingSpinner'
import PasswordStrengthBar from './PasswordStrengthBar'
import PasswordPolicy from './PasswordPolicy'
import { authService } from '../../services/api'

function RegisterForm() {
  const [formData, setFormData] = useState({
    nombre: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [showVerification, setShowVerification] = useState(false)
  const [verificationData, setVerificationData] = useState({
    email: '',
    codigo: ''
  })
  
  // Estados para validación en tiempo real
  const [usernameStatus, setUsernameStatus] = useState('') // 'available', 'unavailable', 'checking'
  const [emailStatus, setEmailStatus] = useState('') // 'available', 'unavailable', 'checking'
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false)
  
  const { login } = useContext(AuthContext)
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
    
    // Validar usuario en tiempo real
    if (name === 'username' && value.length >= 3) {
      checkUsernameAvailability(value);
    } else if (name === 'username') {
      setUsernameStatus('');
    }
    
    // Validar email en tiempo real
    if (name === 'email' && value.includes('@') && value.includes('.')) {
      checkEmailAvailability(value);
    } else if (name === 'email') {
      setEmailStatus('');
    }
    
    // Mostrar requisitos de contraseña SOLO cuando se empiece a escribir
    if (name === 'password') {
      const shouldShow = value.length > 0;
      setShowPasswordRequirements(shouldShow);
    }
  }

  const handleVerificationChange = (e) => {
    const { name, value } = e.target
    setVerificationData({
      ...verificationData,
      [name]: value
    })
  }

  // Función para verificar disponibilidad del usuario
  const checkUsernameAvailability = async (username) => {
    if (username.length < 3) return;
    
    setUsernameStatus('checking');
    
    try {
      const response = await fetch('/api/usuarios/check-username', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: username.toLowerCase() })
      });

      if (!response.ok) {
        console.error('❌ Error en respuesta:', response.status, response.statusText);
        setUsernameStatus('');
        return;
      }

      const data = await response.json();
      
      if (response.ok) {
        setUsernameStatus(data.available ? 'available' : 'unavailable');
      } else {
        setUsernameStatus('');
      }
    } catch (error) {
      console.error('❌ Error verificando usuario:', error);
      setUsernameStatus('');
    }
  };

  // Función para verificar disponibilidad del email
  const checkEmailAvailability = async (email) => {
    if (!email.includes('@') || !email.includes('.')) return;
    
    setEmailStatus('checking');
    
    try {
      const response = await fetch('/api/usuarios/check-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: email.toLowerCase() })
      });

      if (!response.ok) {
        console.error('❌ Error en respuesta:', response.status, response.statusText);
        setEmailStatus('');
        return;
      }

      const data = await response.json();
      
      if (response.ok) {
        setEmailStatus(data.available ? 'available' : 'unavailable');
      } else {
        setEmailStatus('');
      }
    } catch (error) {
      console.error('❌ Error verificando email:', error);
      setEmailStatus('');
    }
  };
  
  const validate = () => {
    const newErrors = {}
    
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre completo es requerido'
    }
    
    if (!formData.username.trim()) {
      newErrors.username = 'El nombre de usuario es requerido'
    } else if (formData.username.length < 3) {
      newErrors.username = 'El nombre de usuario debe tener al menos 3 caracteres'
    } else if (usernameStatus === 'unavailable') {
      newErrors.username = 'El nombre de usuario ya está en uso. Por favor elige otro.'
    } else if (usernameStatus === 'checking') {
      newErrors.username = 'Espera mientras verificamos la disponibilidad del usuario.'
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El formato del email no es válido'
    } else if (emailStatus === 'unavailable') {
      newErrors.email = 'El email ya está registrado. Por favor usa otro email.'
    } else if (emailStatus === 'checking') {
      newErrors.email = 'Espera mientras verificamos la disponibilidad del email.'
    }
    
    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida'
    } else if (formData.password.length < 8) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres'
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password = 'La contraseña debe contener al menos una letra mayúscula'
    } else if (!/[a-z]/.test(formData.password)) {
      newErrors.password = 'La contraseña debe contener al menos una letra minúscula'
    } else if (!/\d/.test(formData.password)) {
      newErrors.password = 'La contraseña debe contener al menos un número'
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'La confirmación de contraseña es requerida'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateVerification = () => {
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
    
    try {
      const { confirmPassword, ...registerData } = formData
      const response = await authService.register(registerData)
      
      // Mostrar formulario de verificación
      setShowVerification(true)
      setVerificationData({ email: formData.email, codigo: '' })
      setErrors({
        form: 'Usuario registrado exitosamente. Revisa tu email para el código de verificación.',
        type: 'success'
      })
    } catch (error) {
      const backendMsg = error.response?.data?.mensaje || error.response?.data?.error || error.message || 'Error al registrar. Por favor, intenta de nuevo.'
      setErrors({
        form: backendMsg,
        type: 'error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerification = async (e) => {
    e.preventDefault()
    if (!validateVerification()) return
    
    setIsLoading(true)
    
    try {
      await authService.verificarEmail(verificationData)
      setErrors({
        form: 'Email verificado exitosamente. Redirigiendo al inicio de sesión...',
        type: 'success'
      })
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } catch (error) {
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
      setErrors({
        form: 'Nuevo código enviado a tu email.',
        type: 'success'
      })
    } catch (error) {
      const backendMsg = error.response?.data?.mensaje || error.response?.data?.error || error.message || 'Error al reenviar código.'
      setErrors({
        form: backendMsg,
        type: 'error'
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  if (showVerification) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Verificar Email
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Ingresa el código de 6 dígitos enviado a {verificationData.email}
          </p>
        </div>

        {errors.form && (
          <div className={`mb-4 p-3 border rounded text-sm ${
            errors.type === 'success' 
              ? 'bg-green-500/20 border-green-500 text-green-500'
              : 'bg-red-500/20 border-red-500 text-red-500'
          }`}>
            {errors.form}
          </div>
        )}

        <motion.form 
          onSubmit={handleVerification}
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
              onChange={handleVerificationChange}
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
      </motion.div>
    )
  }
  
  return (
    <motion.form 
      onSubmit={handleSubmit}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      {errors.form && (
        <div className={`mb-4 p-3 border rounded text-sm ${
          errors.type === 'success' 
            ? 'bg-green-500/20 border-green-500 text-green-500'
            : 'bg-red-500/20 border-red-500 text-red-500'
        }`}>
          {errors.form}
        </div>
      )}
      
      <div className="space-y-5">
        <InputField
          type="text"
          name="nombre"
          label="Nombre Completo"
          value={formData.nombre}
          onChange={handleChange}
          error={errors.nombre}
          autoComplete="name"
        />

        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nombre de Usuario
          </label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="usuario123"
            autoComplete="username"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
          {usernameStatus === 'checking' && (
            <p className="text-xs text-blue-500 mt-1">
              Verificando disponibilidad...
            </p>
          )}
          {usernameStatus === 'available' && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              ✓ Nombre de usuario disponible
            </p>
          )}
          {usernameStatus === 'unavailable' && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              ✗ Nombre de usuario no disponible
            </p>
          )}
          {errors.username && (
            <p className="text-xs text-red-500 mt-1">
              {errors.username}
            </p>
          )}
        </div>

        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="usuario@ejemplo.com"
            autoComplete="email"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
          {emailStatus === 'checking' && (
            <p className="text-xs text-blue-500 mt-1">
              Verificando disponibilidad...
            </p>
          )}
          {emailStatus === 'available' && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              ✓ Email disponible
            </p>
          )}
          {emailStatus === 'unavailable' && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              ✗ Email no disponible
            </p>
          )}
          {errors.email && (
            <p className="text-xs text-red-500 mt-1">
              {errors.email}
            </p>
          )}
        </div>
        
        <InputField
          type="password"
          name="password"
          label="Contraseña"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          autoComplete="new-password"
        />
        
        {formData.password && (
          <div className="mt-2">
            <PasswordStrengthBar password={formData.password} />
          </div>
        )}
        
        <InputField
          type="password"
          name="confirmPassword"
          label="Confirmar Contraseña"
          value={formData.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          autoComplete="new-password"
        />
        
        <motion.button
          type="submit"
          className="primary-button"
          disabled={isLoading || usernameStatus === 'unavailable' || usernameStatus === 'checking' || emailStatus === 'unavailable' || emailStatus === 'checking'}
          whileTap={{ scale: 0.97 }}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <LoadingSpinner className="mr-2" />
              Registrando...
            </span>
          ) : usernameStatus === 'checking' || emailStatus === 'checking' ? (
            'Verificando disponibilidad...'
          ) : usernameStatus === 'unavailable' ? (
            'Usuario no disponible'
          ) : emailStatus === 'unavailable' ? (
            'Email no disponible'
          ) : (
            'Registrarse'
          )}
        </motion.button>
      </div>
      
      <div className="mt-6 text-center text-sm text-gray-400">
        ¿Ya tienes una cuenta?{' '}
        <Link 
          to="/login"
          className="secondary-button font-medium"
        >
          Volver al inicio de sesión
        </Link>
      </div>
      
      <PasswordPolicy className="mt-4" />
    </motion.form>
  )
}

export default RegisterForm