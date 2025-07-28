import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, FileText, Send, AlertCircle, CheckCircle } from 'lucide-react';

// Configurar axios para incluir el token automáticamente
const API_BASE_URL = 'http://localhost:3001/api';

function SolicitarFirma({ documentoId, posicionFirma, onSolicitudEnviada }) {
  const [usuarios, setUsuarios] = useState([]);
  const [firmanteSeleccionado, setFirmanteSeleccionado] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

        {firmanteSeleccionadoData && (
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

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Mensaje (opcional)
          </label>
          <textarea
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows="3"
            placeholder="Mensaje personalizado para el firmante..."
          />
        </div>

        {posicionFirma && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-md">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-900 dark:text-green-100">
                Posición de firma seleccionada:
              </span>
            </div>
            <p className="text-sm text-green-800 dark:text-green-200 mt-1">
              Página {posicionFirma.page} - Coordenadas ({posicionFirma.x}, {posicionFirma.y})
            </p>
          </div>
        )}

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

        <button
          type="submit"
          disabled={enviando || !firmanteSeleccionado || !posicionFirma}
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
              Enviar Solicitud de Firma
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default SolicitarFirma; 