import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, FileText, Send, AlertCircle, CheckCircle, Users, Plus, X } from 'lucide-react';
import { io } from 'socket.io-client';
// Configurar axios para incluir el token automáticamente
const API_BASE_URL = '/api';

function SolicitarFirma({ documentoId, posicionFirma, onSolicitudEnviada }) {
  const [usuarios, setUsuarios] = useState([]);
  const [firmanteSeleccionado, setFirmanteSeleccionado] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Nuevos estados para solicitudes múltiples
  const [tipoSolicitud, setTipoSolicitud] = useState('individual'); // 'individual' o 'multiple'
  const [firmantesMultiples, setFirmantesMultiples] = useState([]);
  const [tituloSolicitud, setTituloSolicitud] = useState('');
  const [descripcionSolicitud, setDescripcionSolicitud] = useState('');
  const [prioridad, setPrioridad] = useState('normal');
  const [fechaExpiracion, setFechaExpiracion] = useState('');

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      console.log('🔍 Cargando usuarios...');

      // Obtener token del localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('❌ No hay token de autenticación');
        setError('No hay sesión activa. Por favor, inicia sesión.');
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/usuarios`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('📦 Response data:', response.data);
      console.log('📋 Tipo de response.data:', typeof response.data);
      console.log('📋 Es array?', Array.isArray(response.data));

      // Asegurar que response.data sea un array
      const usuariosData = Array.isArray(response.data) ? response.data : [];
      console.log('📋 Usuarios data:', usuariosData);

      // Filtrar usuarios verificados y excluir al usuario actual
      const usuariosFiltrados = usuariosData.filter(usuario =>
        usuario.emailVerificado && usuario._id !== localStorage.getItem('userId')
      );
      console.log('✅ Usuarios filtrados:', usuariosFiltrados);
      setUsuarios(usuariosFiltrados);
    } catch (error) {
      console.error('❌ Error cargando usuarios:', error);
      console.error('📋 Error response:', error.response);
      setError('Error cargando lista de usuarios');
      setUsuarios([]); // Establecer array vacío en caso de error
    }
  };

  const enviarSolicitud = async (e) => {
    e.preventDefault();

    if (tipoSolicitud === 'multiple') {
      return enviarSolicitudMultiple(e);
    }

    if (!firmanteSeleccionado) {
      setError('Selecciona un firmante');
      return;
    }

    if (!posicionFirma) {
      setError('Debes seleccionar una posición en el documento');
      return;
    }

    setEnviando(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE_URL}/solicitudes/crear`, {
        documentoId,
        firmanteId: firmanteSeleccionado,
        posicionFirma,
        mensaje
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setSuccess('Solicitud enviada exitosamente');
      setFirmanteSeleccionado('');
      setMensaje('');

      // Notificar al componente padre
      if (onSolicitudEnviada) {
        onSolicitudEnviada(response.data.solicitud);
      }

    } catch (error) {
      console.error('Error enviando solicitud:', error);
      setError(error.response?.data?.error || 'Error enviando solicitud');
    } finally {
      setEnviando(false);
    }
  };

  const firmanteSeleccionadoData = usuarios.find(u => u._id === firmanteSeleccionado);

  // Funciones para solicitudes múltiples
  const agregarFirmanteMultiple = () => {
    if (firmantesMultiples.length >= 5) {
      setError('No se pueden agregar más de 5 firmantes');
      return;
    }
    
    const nuevoFirmante = {
      id: Date.now(),
      usuarioId: '',
      nombre: '',
      email: ''
    };
    
    setFirmantesMultiples([...firmantesMultiples, nuevoFirmante]);
  };

  const removerFirmanteMultiple = (id) => {
    setFirmantesMultiples(firmantesMultiples.filter(f => f.id !== id));
  };

  const actualizarFirmanteMultiple = (id, campo, valor) => {
    setFirmantesMultiples(firmantesMultiples.map(f => {
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

  const validarSolicitudMultiple = () => {
    if (!tituloSolicitud.trim()) {
      setError('El título es obligatorio para solicitudes múltiples');
      return false;
    }

    if (!posicionFirma) {
      setError('Debes seleccionar una posición en el documento antes de crear la solicitud múltiple');
      return false;
    }

    if (firmantesMultiples.length === 0) {
      setError('Debe agregar al menos un firmante');
      return false;
    }

    const firmantesValidos = firmantesMultiples.every(f => f.usuarioId);
    if (!firmantesValidos) {
      setError('Todos los firmantes deben ser seleccionados');
      return false;
    }

    // Verificar que no haya firmantes duplicados
    const firmantesIds = firmantesMultiples.map(f => f.usuarioId);
    const firmantesUnicos = new Set(firmantesIds);
    if (firmantesUnicos.size !== firmantesMultiples.length) {
      setError('No se pueden agregar firmantes duplicados');
      return false;
    }

    return true;
  };

  const enviarSolicitudMultiple = async (e) => {
    e.preventDefault();
    
    if (!validarSolicitudMultiple()) return;

    setEnviando(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const solicitudData = {
        documentoId,
        firmantes: firmantesMultiples.map(f => f.usuarioId),
        posicionFirma,
        mensaje,
        titulo: tituloSolicitud,
        descripcion: descripcionSolicitud,
        prioridad,
        fechaExpiracion: fechaExpiracion || 
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      };

      const response = await axios.post(`${API_BASE_URL}/solicitudes-multiples/crear`, solicitudData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setSuccess('Solicitud múltiple enviada exitosamente');
      
      // Limpiar formulario
      setFirmantesMultiples([]);
      setTituloSolicitud('');
      setDescripcionSolicitud('');
      setPrioridad('normal');
      setFechaExpiracion('');
      setMensaje('');

      // Notificar al componente padre
      if (onSolicitudEnviada) {
        onSolicitudEnviada(response.data.solicitudMultiple);
      }

    } catch (error) {
      console.error('Error enviando solicitud múltiple:', error);
      setError(error.response?.data?.error || 'Error enviando solicitud múltiple');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <div className="flex items-center gap-2 mb-4">
        <Send className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Solicitar Firma
        </h3>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          {success}
        </div>
      )}

      <form onSubmit={enviarSolicitud}>
        {/* Selector de tipo de solicitud */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Tipo de Solicitud
          </label>
          <div className="flex space-x-6">
            <label className="flex items-center p-3 border-2 rounded-lg transition-all duration-200 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
              <input
                type="radio"
                value="individual"
                checked={tipoSolicitud === 'individual'}
                onChange={(e) => setTipoSolicitud(e.target.value)}
                className="mr-3 text-blue-600"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                <User className="w-4 h-4 inline mr-2" />
                Individual (1 firmante)
              </span>
            </label>
            <label className="flex items-center p-3 border-2 rounded-lg transition-all duration-200 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
              <input
                type="radio"
                value="multiple"
                checked={tipoSolicitud === 'multiple'}
                onChange={(e) => setTipoSolicitud(e.target.value)}
                className="mr-3 text-blue-600"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                <Users className="w-4 h-4 inline mr-2" />
                Múltiple (hasta 5 firmantes)
              </span>
            </label>
          </div>
        </div>

        {/* Campos para solicitud individual */}
        {tipoSolicitud === 'individual' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Seleccionar Firmante
            </label>
            <select
              value={firmanteSeleccionado}
              onChange={(e) => setFirmanteSeleccionado(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Selecciona un usuario...</option>
              {Array.isArray(usuarios) && usuarios.map(usuario => (
                <option key={usuario._id} value={usuario._id}>
                  {usuario.nombre} ({usuario.email})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Campos para solicitud múltiple */}
        {tipoSolicitud === 'multiple' && (
          <>
            {/* Layout Horizontal Principal - Mejorado */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
              {/* Columna Izquierda - Información Básica */}
              <div className="xl:col-span-1 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Título de la Solicitud *
                  </label>
                  <input
                    type="text"
                    value={tituloSolicitud}
                    onChange={(e) => setTituloSolicitud(e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: Aprobación de Contrato"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Prioridad
                  </label>
                  <select
                    value={prioridad}
                    onChange={(e) => setPrioridad(e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="baja">Baja</option>
                    <option value="normal">Normal</option>
                    <option value="alta">Alta</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fecha de Expiración
                  </label>
                  <input
                    type="datetime-local"
                    value={fechaExpiracion}
                    onChange={(e) => setFechaExpiracion(e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Columna Central - Descripción */}
              <div className="xl:col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descripción
                </label>
                <textarea
                  value={descripcionSolicitud}
                  onChange={(e) => setDescripcionSolicitud(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="6"
                  placeholder="Descripción opcional de la solicitud..."
                />
              </div>

              {/* Columna Derecha - Información Importante */}
              <div className="xl:col-span-1">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 h-full">
                  <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-3">
                    ℹ️ Información Importante
                  </h4>
                  <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-2">
                    <li>• Todos los firmantes recibirán un email</li>
                    <li>• Cada firmante puede firmar independientemente</li>
                    <li>• La solicitud expira en la fecha configurada</li>
                    <li>• Se completará cuando todos firmen</li>
                    <li>• Máximo 5 firmantes por solicitud</li>
                  </ul>
                </div>
              </div>
            </div>



            {/* Firmantes múltiples - Layout Horizontal Mejorado */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Firmantes ({firmantesMultiples.length}/5)
                </label>
                <button
                  type="button"
                  onClick={agregarFirmanteMultiple}
                  disabled={firmantesMultiples.length >= 5}
                  className="flex items-center px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Firmante
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {firmantesMultiples.map((firmante, index) => (
                  <div key={firmante.id} className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200">
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                          {index + 1}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <select
                        value={firmante.usuarioId}
                        onChange={(e) => actualizarFirmanteMultiple(firmante.id, 'usuarioId', e.target.value)}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        required
                      >
                        <option value="">Seleccionar usuario...</option>
                        {Array.isArray(usuarios) && usuarios.map(usuario => (
                          <option key={usuario._id} value={usuario._id}>
                            {usuario.nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => removerFirmanteMultiple(firmante.id)}
                      className="flex-shrink-0 p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-md transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {firmantesMultiples.length === 0 && (
                  <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-base font-medium mb-1">No hay firmantes agregados</p>
                    <p className="text-sm">Haz clic en "Agregar Firmante" para comenzar</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {tipoSolicitud === 'individual' && firmanteSeleccionadoData && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-md">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Firmante seleccionado:
              </span>
            </div>
            <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
              {firmanteSeleccionadoData.nombre} ({firmanteSeleccionadoData.email})
            </p>
          </div>
        )}

        {/* Layout Horizontal para Mensaje y Posición */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mensaje (opcional)
            </label>
            <textarea
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="4"
              placeholder="Mensaje personalizado para el firmante..."
            />
          </div>

          {posicionFirma ? (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-900 dark:text-green-100">
                  Posición de firma seleccionada:
                </span>
              </div>
              <p className="text-sm text-green-800 dark:text-green-200">
                Página {posicionFirma.page} - Coordenadas ({posicionFirma.x}, {posicionFirma.y})
              </p>
            </div>
          ) : (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-red-900 dark:text-red-100">
                  Posición de firma requerida:
                </span>
              </div>
              <p className="text-sm text-red-800 dark:text-red-200">
                Debes hacer clic en el documento para seleccionar dónde colocar la firma antes de crear la solicitud.
              </p>
            </div>
          )}
        </div>

        {/* Información importante solo para solicitudes individuales */}
        {tipoSolicitud === 'individual' && (
          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-md">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                <p className="font-medium mb-1">Información importante:</p>
                <ul className="text-xs space-y-1">
                  <li>• El firmante recibirá un email con el enlace</li>
                  <li>• La solicitud expira en 7 días</li>
                  <li>• El firmante necesitará su certificado digital</li>
                  <li>• La firma se posicionará automáticamente</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={enviando || 
            (tipoSolicitud === 'individual' && !firmanteSeleccionado) ||
            (tipoSolicitud === 'multiple' && firmantesMultiples.length === 0) ||
            !posicionFirma
          }
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-md font-medium transition-colors duration-200 flex items-center justify-center gap-2"
        >
          {enviando ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Enviando...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              {tipoSolicitud === 'individual' 
                ? 'Enviar Solicitud de Firma' 
                : 'Enviar Solicitud Múltiple'
              }
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default SolicitarFirma; 