import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, Phone, MessageSquare, Eye, EyeOff, CheckCircle, XCircle, X, Check } from 'lucide-react';
import PasswordStrengthBar from './PasswordStrengthBar';
import PasswordPolicy from './PasswordPolicy';

const RegisterWhatsAppForm = ({ onSwitchToEmail, onRegisterSuccess }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    username: '',
    telefono: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [verificationData, setVerificationData] = useState({
    username: '',
    codigo: ''
  });
  
  // Nuevos estados para validación en tiempo real
  const [usernameStatus, setUsernameStatus] = useState(''); // 'available', 'unavailable', 'checking'
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false); // Inicialmente oculto

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
    
    // Validar usuario en tiempo real
    if (name === 'username' && value.length >= 3) {
      checkUsernameAvailability(value);
    } else if (name === 'username') {
      setUsernameStatus('');
    }
    
    // Mostrar requisitos de contraseña SOLO cuando se empiece a escribir
    if (name === 'password') {
      // Solo mostrar si hay al menos 1 carácter
      const shouldShow = value.length > 0;
      setShowPasswordRequirements(shouldShow);
    }
  };

  // Función para verificar disponibilidad del usuario
  const checkUsernameAvailability = async (username) => {
    if (username.length < 3) return;
    
    setUsernameStatus('checking');
    
    try {
      const response = await fetch('http://localhost:3001/api/usuarios/check-username', {
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

  const validateForm = () => {
    if (!formData.nombre || !formData.username || !formData.telefono || !formData.password || !formData.confirmPassword) {
      setError('Todos los campos son requeridos');
      return false;
    }

    // Verificar si el usuario ya existe
    if (usernameStatus === 'unavailable') {
      setError('El nombre de usuario ya está en uso. Por favor elige otro.');
      return false;
    }

    // Verificar si el usuario está siendo verificado
    if (usernameStatus === 'checking') {
      setError('Espera mientras verificamos la disponibilidad del usuario.');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return false;
    }

    if (formData.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return false;
    }

    if (!/[A-Z]/.test(formData.password)) {
      setError('La contraseña debe contener al menos una letra mayúscula');
      return false;
    }

    if (!/[a-z]/.test(formData.password)) {
      setError('La contraseña debe contener al menos una letra minúscula');
      return false;
    }

    if (!/\d/.test(formData.password)) {
      setError('La contraseña debe contener al menos un número');
      return false;
    }

    // Validar formato de teléfono básico
    const telefonoLimpio = formData.telefono.replace(/[\s\-\(\)]/g, '');
    if (telefonoLimpio.length < 10) {
      setError('El número de teléfono debe tener al menos 10 dígitos');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      console.log('📝 Enviando registro de usuario...');
      console.log('📝 Datos del formulario:', formData);
      
      const response = await fetch('http://localhost:3001/api/usuarios/registro-whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nombre: formData.nombre,
          username: formData.username,
          telefono: formData.telefono,
          password: formData.password
        })
      });

      const data = await response.json();
      console.log('📝 Respuesta del registro:', response.status, data);

      if (response.ok) {
        console.log('✅ Registro exitoso, mostrando verificación...');
        setVerificationData(prev => ({ ...prev, username: formData.username }));
        setShowVerification(true);
        if (onRegisterSuccess) {
          onRegisterSuccess(data);
        }
      } else {
        console.log('❌ Error en registro:', data.mensaje);
        setError(data.mensaje || 'Error al registrar el usuario');
      }
    } catch (err) {
      console.error('❌ Error de conexión en registro:', err);
      setError('Error de conexión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationSubmit = async (e) => {
    e.preventDefault();
    
    if (!verificationData.codigo) {
      setError('Por favor ingresa el código de verificación');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('🔍 Enviando verificación de WhatsApp...');
      console.log('📱 Datos enviados:', verificationData);
      
      const response = await fetch('http://localhost:3001/api/usuarios/verificar-whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: verificationData.username,
          codigo: verificationData.codigo
        })
      });

      const data = await response.json();
      console.log('📱 Respuesta del servidor:', response.status, data);

      if (response.ok) {
        console.log('✅ Verificación exitosa, mostrando modal...');
        setShowSuccessModal(true);
      } else {
        console.log('❌ Error en verificación:', data.mensaje);
        setError(data.mensaje || 'Error al verificar el código');
      }
    } catch (err) {
      console.error('❌ Error de conexión:', err);
      setError('Error de conexión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3001/api/usuarios/reenviar-codigo-whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: verificationData.username
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert('Nuevo código enviado por WhatsApp');
      } else {
        setError(data.mensaje || 'Error al reenviar el código');
      }
    } catch (err) {
      setError('Error de conexión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    window.location.href = '/login';
  };

  // Modal de confirmación de éxito
  if (showSuccessModal) {
    console.log('🎉 Renderizando modal de éxito...');
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
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
                ¡Registro Exitoso!
              </h3>
              <button
                onClick={handleSuccessModalClose}
                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 text-center">
              <div className="mb-4">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  ¡Teléfono Verificado Exitosamente!
                </h4>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Tu cuenta ha sido creada y verificada. Ya puedes iniciar sesión con tu usuario y contraseña.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleSuccessModalClose}
                  className="w-full bg-primary hover:bg-primary-dark dark:bg-primary-light dark:hover:bg-primary text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
                >
                  <Check className="w-5 h-5 mr-2" />
                  Ir al Login
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  if (showVerification) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto"
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="text-center mb-6">
            <MessageSquare className="mx-auto h-12 w-12 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Verificar WhatsApp
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Ingresa el código de 6 dígitos enviado a tu WhatsApp
            </p>
          </div>

          <form onSubmit={handleVerificationSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Código de Verificación
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={verificationData.codigo}
                  onChange={(e) => setVerificationData(prev => ({ ...prev, codigo: e.target.value }))}
                  placeholder="123456"
                  maxLength="6"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 text-sm">
                <XCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Verificando...' : 'Verificar Código'}
            </button>

            <button
              type="button"
              onClick={handleResendCode}
              disabled={loading}
              className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Reenviar Código
            </button>
          </form>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="text-center mb-6">
          <MessageSquare className="mx-auto h-12 w-12 text-green-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Registro con WhatsApp
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Recibirás un código de verificación por WhatsApp
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nombre Completo
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                placeholder="Tu nombre completo"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nombre de Usuario
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="usuario123"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            {usernameStatus === 'checking' && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Verificando disponibilidad...
              </p>
            )}
            {usernameStatus === 'available' && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                Nombre de usuario disponible.
              </p>
            )}
            {usernameStatus === 'unavailable' && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                Nombre de usuario no disponible.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Número de Teléfono
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleInputChange}
                placeholder="0991234567"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Tu contraseña"
                className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <PasswordStrengthBar password={formData.password} />
            
            {/* Mostrar requisitos de contraseña solo cuando se empiece a escribir */}
            {showPasswordRequirements && (
              <div className="mt-2">
                <PasswordPolicy />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Confirmar Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirma tu contraseña"
                className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 text-sm">
              <XCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || usernameStatus === 'unavailable' || usernameStatus === 'checking'}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Registrando...' : 
             usernameStatus === 'checking' ? 'Verificando usuario...' :
             usernameStatus === 'unavailable' ? 'Usuario no disponible' :
             'Registrarse con WhatsApp'}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={onSwitchToEmail}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm"
            >
              ¿Prefieres registrarte con email?
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default RegisterWhatsAppForm; 