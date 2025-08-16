import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PlusIcon, 
  XMarkIcon, 
  DocumentIcon, 
  UserIcon, 
  CalendarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const CrearSolicitudMultiple = ({ 
  documento, 
  onClose, 
  onSolicitudCreada 
}) => {
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    mensaje: '',
    prioridad: 'normal',
    tipo: 'libre',
    fechaExpiracion: '',
    tags: []
  });

  const [firmantes, setFirmantes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tagInput, setTagInput] = useState('');

  // Cargar usuarios disponibles
  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      const response = await fetch('/api/usuarios', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Filtrar usuarios que no sean el usuario actual
        const usuariosFiltrados = data.usuarios.filter(
          usuario => usuario._id !== JSON.parse(localStorage.getItem('user')).id
        );
        setUsuarios(usuariosFiltrados);
      }
    } catch (error) {
      console.error('Error cargando usuarios:', error);
    }
  };

  const agregarFirmante = () => {
    if (firmantes.length >= 5) {
      setError('No se pueden agregar más de 5 firmantes');
      return;
    }

    const nuevoFirmante = {
      id: Date.now(),
      usuarioId: '',
      nombre: '',
      email: ''
    };

    setFirmantes([...firmantes, nuevoFirmante]);
  };

  const removerFirmante = (id) => {
    setFirmantes(firmantes.filter(f => f.id !== id));
  };

  const actualizarFirmante = (id, campo, valor) => {
    setFirmantes(firmantes.map(f => {
      if (f.id === id) {
        const actualizado = { ...f, [campo]: valor };
        
        // Si se seleccionó un usuario, actualizar nombre y email
        if (campo === 'usuarioId') {
          const usuario = usuarios.find(u => u._id === valor);
          if (usuario) {
            actualizado.nombre = usuario.nombre;
            actualizado.email = usuario.email;
          }
        }
        
        return actualizado;
      }
      return f;
    }));
  };

  const agregarTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const removerTag = (tag) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag)
    });
  };

  const validarFormulario = () => {
    if (!formData.titulo.trim()) {
      setError('El título es obligatorio');
      return false;
    }

    if (firmantes.length === 0) {
      setError('Debe agregar al menos un firmante');
      return false;
    }

    const firmantesValidos = firmantes.every(f => f.usuarioId);
    if (!firmantesValidos) {
      setError('Todos los firmantes deben ser seleccionados');
      return false;
    }

    // Verificar que no haya firmantes duplicados
    const firmantesIds = firmantes.map(f => f.usuarioId);
    const firmantesUnicos = new Set(firmantesIds);
    if (firmantesUnicos.size !== firmantes.length) {
      setError('No se pueden agregar firmantes duplicados');
      return false;
    }

    return true;
  };

  const crearSolicitud = async () => {
    if (!validarFormulario()) return;

    setLoading(true);
    setError('');

    try {
      const solicitudData = {
        documentoId: documento._id,
        firmantes: firmantes.map(f => f.usuarioId),
        posicionFirma: {
          x: 100,
          y: 100,
          page: 1,
          qrSize: 100
        },
        ...formData,
        fechaExpiracion: formData.fechaExpiracion || 
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      };

      const response = await fetch('/api/solicitudes-multiples/crear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(solicitudData)
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess('Solicitud múltiple creada exitosamente');
        
        setTimeout(() => {
          onSolicitudCreada(data.solicitudMultiple);
          onClose();
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al crear la solicitud');
      }
    } catch (error) {
      setError('Error de conexión al crear la solicitud');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 50 }}
        animate={{ y: 0 }}
        exit={{ y: 50 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <DocumentIcon className="h-8 w-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Crear Solicitud Múltiple
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Enviar documento a múltiples firmantes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Documento */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              📄 Documento a Firmar
            </h3>
            <p className="text-blue-800 dark:text-blue-200">
              {documento?.nombre || 'Documento seleccionado'}
            </p>
          </div>

          {/* Información Básica */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Título de la Solicitud *
              </label>
              <input
                type="text"
                value={formData.titulo}
                onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Ej: Aprobación de Contrato"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Prioridad
              </label>
              <select
                value={formData.prioridad}
                onChange={(e) => setFormData({...formData, prioridad: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="baja">Baja</option>
                <option value="normal">Normal</option>
                <option value="alta">Alta</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descripción
            </label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="Descripción opcional de la solicitud..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mensaje para los Firmantes
            </label>
            <textarea
              value={formData.mensaje}
              onChange={(e) => setFormData({...formData, mensaje: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="Mensaje personalizado que verán los firmantes..."
            />
          </div>

          {/* Configuración */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo de Firma
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="libre"
                    checked={formData.tipo === 'libre'}
                    onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Libre (cada uno firma cuando puede)
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="secuencial"
                    checked={formData.tipo === 'secuencial'}
                    onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Secuencial (orden específico)
                  </span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha de Expiración
              </label>
              <input
                type="datetime-local"
                value={formData.fechaExpiracion}
                onChange={(e) => setFormData({...formData, fechaExpiracion: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Etiquetas
            </label>
            <div className="flex space-x-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && agregarTag()}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Agregar etiqueta..."
              />
              <button
                onClick={agregarTag}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Agregar
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                >
                  {tag}
                  <button
                    onClick={() => removerTag(tag)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Firmantes */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                👥 Firmantes ({firmantes.length}/5)
              </h3>
              <button
                onClick={agregarFirmante}
                disabled={firmantes.length >= 5}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Agregar Firmante
              </button>
            </div>

            <div className="space-y-4">
              {firmantes.map((firmante, index) => (
                <motion.div
                  key={firmante.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center space-x-4 p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700"
                >
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                        {index + 1}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1">
                    <select
                      value={firmante.usuarioId}
                      onChange={(e) => actualizarFirmante(firmante.id, 'usuarioId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:text-white"
                    >
                      <option value="">Seleccionar usuario...</option>
                      {usuarios.map(usuario => (
                        <option key={usuario._id} value={usuario._id}>
                          {usuario.nombre} ({usuario.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex-shrink-0">
                    <button
                      onClick={() => removerFirmante(firmante.id)}
                      className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                </motion.div>
              ))}

              {firmantes.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <UserIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No hay firmantes agregados</p>
                  <p className="text-sm">Haz clic en "Agregar Firmante" para comenzar</p>
                </div>
              )}
            </div>
          </div>

          {/* Mensajes de Error y Éxito */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
              >
                <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
                <span className="text-red-800 dark:text-red-200">{error}</span>
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
              >
                <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-green-800 dark:text-green-200">{success}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={crearSolicitud}
            disabled={loading || firmantes.length === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creando...
              </>
            ) : (
              <>
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                Crear Solicitud Múltiple
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CrearSolicitudMultiple;
