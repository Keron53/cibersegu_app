import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PasswordStrengthBar from './PasswordStrengthBar';
import SuccessModal from './SuccessModal';

const RegisterFormSimple = ({ onSwitchToWhatsApp }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    username: '',
    email: '',
    cedula: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [usernameStatus, setUsernameStatus] = useState(''); // 'available', 'unavailable', 'checking'
  const [emailStatus, setEmailStatus] = useState(''); // 'available', 'unavailable', 'checking', 'invalid'
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const navigate = useNavigate();

  // Función para verificar disponibilidad del usuario
  const checkUsernameAvailability = async (username) => {
    if (username.length < 3) {
      setUsernameStatus('');
      return;
    }
    
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
    // Validar formato básico de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailStatus('invalid');
      return;
    }
    
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
    
    // Validar usuario en tiempo real
    if (name === 'username') {
      checkUsernameAvailability(value);
    }
    
    // Validar email en tiempo real
    if (name === 'email') {
      checkEmailAvailability(value);
    }
    
    // Mostrar requisitos de contraseña cuando se empiece a escribir
    if (name === 'password') {
      setShowPasswordRequirements(value.length > 0);
    }
  };

  const validateForm = () => {
    if (!formData.nombre || !formData.username || !formData.email || !formData.cedula || !formData.password || !formData.confirmPassword) {
      setError('Todos los campos son requeridos');
      return false;
    }

    // Validar cédula (básico: 10 dígitos)
    const cedulaLimpia = String(formData.cedula).replace(/\D/g, '');
    if (!/^\d{10}$/.test(cedulaLimpia)) {
      setError('La cédula debe tener 10 dígitos');
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

    // Verificar si el email ya existe
    if (emailStatus === 'unavailable') {
      setError('El correo electrónico ya está registrado. Por favor usa otro correo.');
      return false;
    }

    // Verificar si el email es inválido
    if (emailStatus === 'invalid') {
      setError('Por favor ingresa un correo electrónico válido.');
      return false;
    }

    // Verificar si el email está siendo verificado
    if (emailStatus === 'checking') {
      setError('Espera mientras verificamos la disponibilidad del correo electrónico.');
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

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/usuarios/registro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nombre: formData.nombre,
          username: formData.username,
          email: formData.email,
          cedula: String(formData.cedula).replace(/\D/g, ''),
          password: formData.password
        })
      });

      const data = await response.json();

      if (response.ok) {
        setRegisteredEmail(formData.email);
        setShowSuccessModal(true);
      } else {
        setError(data.message || 'Error en el registro');
      }
    } catch (error) {
      setError('Error de conexión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessModalClose = () => {
    console.log('🔍 handleSuccessModalClose ejecutado');
    console.log('📧 Email registrado:', registeredEmail);
    setShowSuccessModal(false);
    // Redirigir a la página de verificación de email
    navigate('/verificar-email', { 
      state: { email: registeredEmail } 
    });
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto"
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="text-center mb-8">
          <User className="mx-auto h-12 w-12 text-blue-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Registro con Email
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Completa tus datos para crear tu cuenta
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
              <div className="relative">
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="usuario123"
                  className={`w-full pl-10 pr-10 py-2 border ${usernameStatus === 'unavailable' ? 'border-red-500' : usernameStatus === 'available' ? 'border-green-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white`}
                />
                {usernameStatus === 'checking' && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  </div>
                )}
                {usernameStatus === 'available' && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                )}
                {usernameStatus === 'unavailable' && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500">
                    <XCircle className="h-5 w-5" />
                  </div>
                )}
              </div>
              {usernameStatus === 'available' && (
                <p className="mt-1 text-xs text-green-500">Nombre de usuario disponible</p>
              )}
              {usernameStatus === 'unavailable' && (
                <p className="mt-1 text-xs text-red-500">Este nombre de usuario ya está en uso</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="tu@email.com"
                  className={`w-full pl-10 pr-10 py-2 border ${emailStatus === 'unavailable' || emailStatus === 'invalid' ? 'border-red-500' : emailStatus === 'available' ? 'border-green-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white`}
                />
                {emailStatus === 'checking' && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  </div>
                )}
                {emailStatus === 'available' && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                )}
                {(emailStatus === 'unavailable' || emailStatus === 'invalid') && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500">
                    <XCircle className="h-5 w-5" />
                  </div>
                )}
              </div>
              {emailStatus === 'available' && (
                <p className="mt-1 text-xs text-green-500">Correo electrónico disponible</p>
              )}
              {emailStatus === 'unavailable' && (
                <p className="mt-1 text-xs text-red-500">Este correo electrónico ya está registrado</p>
              )}
              {emailStatus === 'invalid' && (
                <p className="mt-1 text-xs text-red-500">Por favor ingresa un correo electrónico válido</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Cédula
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                name="cedula"
                value={formData.cedula}
                onChange={handleInputChange}
                placeholder="0123456789"
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
            
            {/* Barra de fortaleza de contraseña */}
            <div className="mt-2">
              <PasswordStrengthBar password={formData.password} />
            </div>
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
            <div className="text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Registrando...' : 'Registrarse con Email'}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={onSwitchToWhatsApp}
              className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 text-sm"
            >
              ¿Prefieres registrarte con WhatsApp?
            </button>
          </div>
        </form>
      </div>
    </motion.div>
    
    {/* Modal de éxito */}
    <SuccessModal 
      isOpen={showSuccessModal}
      onClose={handleSuccessModalClose}
      message="¡Registro exitoso! Revisa tu email para verificar tu cuenta."
    />
    </>
  );
};

export default RegisterFormSimple; 