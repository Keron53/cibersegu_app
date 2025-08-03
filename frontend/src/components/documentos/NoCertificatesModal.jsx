import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Upload, Plus, X, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NoCertificatesModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const handleUploadCertificate = () => {
    onClose();
    navigate('/certificado');
  };

  const handleGenerateCertificate = () => {
    onClose();
    navigate('/generar-certificado');
  };

  const handleRequestSignature = () => {
    onClose();
    // Aquí podrías navegar a la sección de solicitar firma o cerrar el modal
    // y permitir que el usuario use la funcionalidad de solicitar firma
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="mx-auto w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mb-4"
              >
                <AlertCircle className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
              </motion.div>
              
              <motion.h3
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-xl font-semibold text-gray-900 dark:text-white mb-2"
              >
                No tienes certificados disponibles
              </motion.h3>
              
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-gray-600 dark:text-gray-300 mb-6"
              >
                Para firmar documentos necesitas un certificado digital. Elige una de las siguientes opciones:
              </motion.p>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="space-y-3 mb-6"
              >
                <button
                  onClick={handleUploadCertificate}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>Subir certificado .p12</span>
                </button>

                <button
                  onClick={handleGenerateCertificate}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Generar nuevo certificado</span>
                </button>

                <button
                  onClick={handleRequestSignature}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Solicitar firma a otro usuario</span>
                </button>
              </motion.div>

              <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                onClick={onClose}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <X className="w-4 h-4" />
                <span>Cancelar</span>
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NoCertificatesModal; 