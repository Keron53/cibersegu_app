import React, { useState } from 'react';
import { motion } from 'framer-motion';

const RegisterMethodSelectorSimple = () => {
  const [selectedMethod, setSelectedMethod] = useState(null);

  const handleMethodSelect = (method) => {
    setSelectedMethod(method);
  };

  const handleSwitchMethod = () => {
    setSelectedMethod(null);
  };

  if (selectedMethod === 'email') {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Registro con Email
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Funcionalidad temporalmente no disponible.
        </p>
        <button
          onClick={handleSwitchMethod}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm"
        >
          ← Volver
        </button>
      </div>
    );
  }

  if (selectedMethod === 'whatsapp') {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Registro con WhatsApp
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Funcionalidad temporalmente no disponible.
        </p>
        <button
          onClick={handleSwitchMethod}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm"
        >
          ← Volver
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Crear Cuenta
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Selecciona cómo quieres registrarte
          </p>
        </div>

        <div className="space-y-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleMethodSelect('email')}
            className="w-full p-4 border-2 border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-colors group"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-900/40 transition-colors">
                <span className="text-blue-600 dark:text-blue-400">📧</span>
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Registro con Email
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Recibirás un código por email
                </p>
              </div>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleMethodSelect('whatsapp')}
            className="w-full p-4 border-2 border-gray-200 dark:border-gray-600 rounded-lg hover:border-green-500 dark:hover:border-green-500 transition-colors group"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg group-hover:bg-green-200 dark:group-hover:bg-green-900/40 transition-colors">
                <span className="text-green-600 dark:text-green-400">📱</span>
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Registro con WhatsApp
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Recibirás un código por WhatsApp
                </p>
              </div>
            </div>
          </motion.button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            ¿Ya tienes una cuenta?{' '}
            <a href="/login" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
              Inicia sesión
            </a>
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default RegisterMethodSelectorSimple; 