import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, CreditCard, AlertCircle, CheckCircle } from 'lucide-react';

const ForgotUsernameModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    emailOCedula: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.emailOCedula.trim()) {
      setError('Por favor ingresa tu email o cédula');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/usuarios/recuperar-usuario', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          emailOCedula: formData.emailOCedula.trim()
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setFormData({ emailOCedula: '' });
      } else {
        setError(data.mensaje || 'Error al procesar la solicitud');
      }
    } catch (err) {
      setError('Error de conexión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ emailOCedula: '' });
    setError('');
    setSuccess(false);
    onClose();
  };

  const isEmail = formData.emailOCedula.includes('@');

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Recuperar Usuario
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Ingresa tu email o cédula
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {success ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-4"
                >
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    ¡Solicitud Enviada!
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Si los datos son correctos, recibirás tu nombre de usuario en tu email o WhatsApp registrado.
                  </p>
                  <button
                    onClick={handleClose}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                  >
                    Entendido
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email o Cédula
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                        {isEmail ? (
                          <Mail className="w-5 h-5 text-gray-400" />
                        ) : (
                          <CreditCard className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <input
                        type="text"
                        name="emailOCedula"
                        value={formData.emailOCedula}
                        onChange={handleChange}
                        placeholder="usuario@ejemplo.com o 1234567890"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        disabled={loading}
                      />
                    </div>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Ingresa el email o cédula con el que te registraste
                    </p>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center space-x-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg"
                    >
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{error}</span>
                    </motion.div>
                  )}

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="flex-1 px-4 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors"
                      disabled={loading}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !formData.emailOCedula.trim()}
                      className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Enviando...</span>
                        </div>
                      ) : (
                        'Recuperar Usuario'
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ForgotUsernameModal;
