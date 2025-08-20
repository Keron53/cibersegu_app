import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, User, Calendar, FileSignature, Download, Eye, Users, X } from 'lucide-react';
import { motion } from 'framer-motion';
import PDFViewerFirma from '../components/documentos/PDFViewerFirma';
import PositionSelector from '../components/documentos/PositionSelector';
import { certificadoService } from '../services/api';

const FirmarDocumento = () => {
  const { documentoId } = useParams();
  const navigate = useNavigate();
  const [documento, setDocumento] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [certificados, setCertificados] = useState([]);
  const [certificadoSeleccionado, setCertificadoSeleccionado] = useState('');
  const [password, setPassword] = useState('');
  const [posicionFirma, setPosicionFirma] = useState(null);
  const [firmando, setFirmando] = useState(false);
  const [showPDF, setShowPDF] = useState(true);
  const [showSolicitudMultiple, setShowSolicitudMultiple] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // State for password visibility
  
  // Estados para firma múltiple
  const [tituloSolicitud, setTituloSolicitud] = useState('');
  const [mensajeSolicitud, setMensajeSolicitud] = useState('');
  const [fechaExpiracion, setFechaExpiracion] = useState('');
  const [firmantes, setFirmantes] = useState([]); // Array de objetos: {email, nombre, posicion}
  const [nuevoFirmante, setNuevoFirmante] = useState('');
  
  // Estado para el nuevo selector de posición
  const [showPositionSelector, setShowPositionSelector] = useState(false);
  const [firmanteParaPosicion, setFirmanteParaPosicion] = useState(null);
  
  // Estados para lista de usuarios
  const [usuarios, setUsuarios] = useState([]); // Lista de usuarios del sistema
  const [cargandoUsuarios, setCargandoUsuarios] = useState(false);
  const [creandoSolicitud, setCreandoSolicitud] = useState(false);

  useEffect(() => {
    cargarDocumento();
    cargarCertificados();
  }, [documentoId]);

  // Cargar usuarios del sistema cuando se abre la solicitud múltiple
  useEffect(() => {
    if (showSolicitudMultiple) {
      cargarUsuarios();
    }
  }, [showSolicitudMultiple]);

  const cargarDocumento = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Primero obtener la información del documento (metadatos)
      const response = await fetch(`/api/documentos/${documentoId}/info`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📋 Información del documento cargada:', data);
        setDocumento(data.documento);
      } else {
        setError('Error al cargar la información del documento');
      }
    } catch (error) {
      console.error('Error cargando documento:', error);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const cargarCertificados = async () => {
    try {
      console.log('🔍 Cargando certificados...');
      const certs = await certificadoService.listar();
      console.log('📋 Certificados recibidos:', certs);
      console.log('📊 Certificados encontrados:', certs?.length || 0);
      setCertificados(certs || []);
      
      // Seleccionar el primer certificado por defecto si existe
      if (certs && certs.length > 0) {
        setCertificadoSeleccionado(certs[0]._id);
        console.log('✅ Primer certificado seleccionado:', certs[0]);
      }
    } catch (error) {
      console.error('❌ Error cargando certificados:', error);
    }
  };

  // Cargar usuarios del sistema
  const cargarUsuarios = async () => {
    try {
      setCargandoUsuarios(true);
      console.log('🔍 Cargando usuarios del sistema...');
      
      const token = localStorage.getItem('token');
      const response = await fetch('/api/usuarios', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📋 Respuesta completa del backend:', data);
        console.log('📋 Tipo de data:', typeof data);
        console.log('📋 Es array?', Array.isArray(data));
        console.log('📋 Keys de data:', Object.keys(data || {}));
        console.log('📋 data.usuarios existe?', data && data.usuarios);
        console.log('📋 data.data existe?', data && data.data);
        
        // Verificar la estructura de la respuesta
        let usuariosData = [];
        
        if (data && data.usuarios && Array.isArray(data.usuarios)) {
          // Estructura esperada: { usuarios: [...] }
          usuariosData = data.usuarios;
        } else if (data && Array.isArray(data)) {
          // Estructura alternativa: [...] (array directo)
          usuariosData = data;
        } else if (data && data.data && Array.isArray(data.data)) {
          // Estructura alternativa: { data: [...] }
          usuariosData = data.data;
        } else {
          console.error('❌ Estructura de respuesta inesperada:', data);
          setError('Formato de respuesta inesperado del servidor');
          setUsuarios([]);
          return;
        }
        
        console.log('📋 Usuarios extraídos:', usuariosData);
        console.log('📋 Estructura del primer usuario:', usuariosData[0]);
        console.log('📋 Keys del primer usuario:', usuariosData[0] ? Object.keys(usuariosData[0]) : 'null');
        
        // Filtrar usuarios que no sean el usuario actual
        // Intentar distintas claves y estructuras en localStorage y, como respaldo, decodificar el JWT
        const posiblesClaves = ['user', 'userData', 'usuario', 'authUser'];
        let usuarioActual = null;
        for (const key of posiblesClaves) {
          const raw = localStorage.getItem(key);
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              if (parsed) {
                usuarioActual = parsed;
                break;
              }
            } catch (e) {
              // ignorar errores de parseo
            }
          }
        }

        // Respaldo: intentar decodificar el token JWT si existe
        if (!usuarioActual) {
          const tokenLS = localStorage.getItem('token');
          if (tokenLS && tokenLS.split('.').length === 3) {
            try {
              const payload = JSON.parse(atob(tokenLS.split('.')[1]));
              usuarioActual = payload || null;
            } catch (e) {
              // no se pudo decodificar
            }
          }
        }

        console.log('🔍 Usuario actual detectado:', usuarioActual);
        console.log('🔍 Keys usuarioActual:', usuarioActual ? Object.keys(usuarioActual) : 'null');

        let usuarioActualId = null;
        if (usuarioActual) {
          // Campos directos
          usuarioActualId = usuarioActual.id || usuarioActual._id || usuarioActual.userId || usuarioActual.uid || usuarioActual.sub || null;
          // Anidados
          if (!usuarioActualId && usuarioActual.user) {
            usuarioActualId = usuarioActual.user.id || usuarioActual.user._id || usuarioActual.user.userId || null;
          }
          if (!usuarioActualId && usuarioActual.usuario) {
            usuarioActualId = usuarioActual.usuario.id || usuarioActual.usuario._id || usuarioActual.usuario.userId || null;
          }
        }
        
        if (!usuarioActualId) {
          console.error('❌ No se pudo obtener ID del usuario actual del localStorage');
          console.error('❌ Estructura completa:', usuarioActual);
          // En lugar de fallar, mostrar todos los usuarios
          console.log('⚠️ Mostrando todos los usuarios (sin filtrado)');
          setUsuarios(usuariosData);
          return;
        }
        
        console.log('✅ ID del usuario actual:', usuarioActualId);
        
        const usuariosFiltrados = usuariosData.filter(
          usuario => usuario && usuario._id && usuario._id !== usuarioActualId
        );
        
        console.log('✅ Usuarios filtrados:', usuariosFiltrados);
        setUsuarios(usuariosFiltrados);
      } else {
        console.error('❌ Error en respuesta de usuarios:', response.status);
        const errorText = await response.text();
        console.error('❌ Respuesta de error:', errorText);
        setError(`Error al cargar la lista de usuarios (${response.status})`);
        setUsuarios([]);
      }
    } catch (error) {
      console.error('❌ Error cargando usuarios:', error);
      setError('Error de conexión al cargar usuarios');
    } finally {
      setCargandoUsuarios(false);
    }
  };

  const handleFirmar = async () => {
    if (!certificadoSeleccionado || !password || !posicionFirma) {
      setError('Por favor completa todos los campos');
      return;
    }

    try {
      setFirmando(true);
      setError('');

      // Obtener información del certificado seleccionado
      const certificado = certificados.find(cert => cert._id === certificadoSeleccionado);
      if (!certificado) {
        setError('Certificado no encontrado');
        return;
      }

      const token = localStorage.getItem('token');
      const response = await fetch(`/api/documentos/${documentoId}/firmar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          certificadoId: certificadoSeleccionado,
          password: password,
          nombre: certificado.nombreComun,
          organizacion: certificado.organizacion,
          email: certificado.email,
          x: posicionFirma.x,
          y: posicionFirma.y,
          page: posicionFirma.page,
          canvasWidth: 800, // Dimensiones del canvas por defecto
          canvasHeight: 600
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Documento firmado exitosamente:', data);
        
        // Mostrar mensaje de éxito
        setError(''); // Limpiar errores previos
        
        // Redirigir a la lista de documentos con mensaje de éxito
        navigate('/home', { 
          state: { 
            message: 'Documento firmado exitosamente',
            type: 'success'
          }
        });
      } else {
        const errorData = await response.json();
        console.error('❌ Error del backend:', errorData);
        
        // Manejar errores específicos
        if (errorData.code === 'INVALID_PASSWORD') {
          setError('Contraseña del certificado incorrecta');
        } else if (errorData.code === 'VALIDATION_ERROR') {
          setError('Error al validar el certificado');
        } else if (errorData.code === 'DECRYPTION_ERROR') {
          setError('Error al procesar el certificado');
        } else {
          setError(errorData.error || 'Error al firmar el documento');
        }
      }
    } catch (error) {
      console.error('Error firmando documento:', error);
      setError('Error de conexión al firmar');
    } finally {
      setFirmando(false);
    }
  };

  const handlePosicionSeleccionada = (posicion) => {
    console.log('📍 Posición seleccionada:', posicion);
    setPosicionFirma({
      x: posicion.x,
      y: posicion.y,
      page: posicion.page,
      qrSize: posicion.qrSize || 100
    });
  };

  const handleCrearSolicitudMultiple = () => {
    // NO necesitamos posición previa para solicitud múltiple
    setShowSolicitudMultiple(true);
    
    // Establecer fecha de expiración por defecto (7 días desde ahora)
    const fechaPorDefecto = new Date();
    fechaPorDefecto.setDate(fechaPorDefecto.getDate() + 7);
    setFechaExpiracion(fechaPorDefecto.toISOString().slice(0, 16));
  };

  // Funciones para manejar firma múltiple
  const agregarFirmante = () => {
    // Limitar a máximo 1 firmante
    if (firmantes.length >= 1) {
      setError('Solo se permite un firmante en esta solicitud');
      return;
    }

    if (nuevoFirmante.trim()) {
      const usuarioId = nuevoFirmante.trim();
      const usuarioExiste = firmantes.some(f => f.usuarioId === usuarioId);
      
      if (!usuarioExiste) {
        // Buscar el usuario seleccionado en la lista
        const usuario = usuarios.find(u => u._id === usuarioId);
        if (usuario) {
          setFirmantes([...firmantes, { 
            usuarioId: usuario._id,
            email: usuario.email, 
            nombre: usuario.nombre,
            posicion: null // Sin posición seleccionada aún
          }]);
          setNuevoFirmante('');
        }
      } else {
        setError('Este usuario ya está en la lista de firmantes');
      }
    }
  };

  const removerFirmante = (index) => {
    setFirmantes(firmantes.filter((_, i) => i !== index));
  };

  // Función para abrir el selector de posición para un firmante específico
  const abrirSelectorPosicion = (usuarioId) => {
    const firmante = firmantes.find(f => f.usuarioId === usuarioId);
    if (firmante) {
      setFirmanteParaPosicion(firmante);
      setShowPositionSelector(true);
    }
  };

  // Función para manejar la posición seleccionada desde el modal
  const manejarPosicionSeleccionada = (posicion) => {
    console.log('📍 Nueva posición recibida:', posicion);
    
    setFirmantes(prev => prev.map(firmante => 
      firmante.usuarioId === posicion.firmanteId 
        ? { ...firmante, posicion }
        : firmante
    ));
    
    // Cerrar el selector
    setShowPositionSelector(false);
    setFirmanteParaPosicion(null);
    
    console.log('✅ Posición guardada para firmante:', posicion.firmanteId);
  };

  // Función para cerrar el selector de posición
  const cerrarSelectorPosicion = () => {
    setShowPositionSelector(false);
    setFirmanteParaPosicion(null);
  };

  const crearSolicitudMultiple = async () => {
    console.log('🧪 Validando creación. Firmantes actuales:', firmantes);
    if (!tituloSolicitud.trim()) {
      setError('Por favor completa el título de la solicitud');
      return;
    }

    if (firmantes.length !== 1) {
      setError('Debes seleccionar exactamente un firmante');
      return;
    }

    // Verificar que todos los firmantes tengan posición seleccionada
    const firmantesSinPosicion = firmantes.filter(f => !f.posicion);
    if (firmantesSinPosicion.length > 0) {
      setError(`Los siguientes firmantes no tienen posición seleccionada: ${firmantesSinPosicion.map(f => f.email).join(', ')}`);
      return;
    }

    try {
      setError('');
      setCreandoSolicitud(true);
      const token = localStorage.getItem('token');
      
      const solicitudData = {
        documentoId: documentoId,
        titulo: tituloSolicitud,
        mensaje: mensajeSolicitud,
        fechaExpiracion: new Date(fechaExpiracion).toISOString(),
        firmantes: firmantes.map(f => ({
          usuarioId: f.usuarioId,
          posicion: f.posicion
        }))
      };

      console.log('📤 Enviando solicitud (único firmante):', solicitudData);

      const response = await fetch('/api/solicitudes-multiples/crear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(solicitudData)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Solicitud múltiple creada:', data);
        
        // Limpiar formulario y cerrar sección
        setTituloSolicitud('');
        setMensajeSolicitud('');
        setFirmantes([]);
        setShowSolicitudMultiple(false);
        
        // Mostrar mensaje de éxito
        setError('');
        navigate('/home', { 
          state: { 
            message: 'Solicitud de firma múltiple creada exitosamente',
            type: 'success'
          }
        });
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al crear la solicitud múltiple');
        console.error('❌ Error creando solicitud:', errorData);
      }
    } catch (error) {
      console.error('Error creando solicitud múltiple:', error);
      setError('Error de conexión al crear la solicitud');
    } finally {
      setCreandoSolicitud(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando documento...</p>
        </div>
      </div>
    );
  }

  if (error && !documento) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Error al cargar el documento
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => navigate('/documentos')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Volver a Documentos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header con breadcrumbs */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700"
      >
        <div className="max-w-7xl mx-auto px-4 py-4">
          <nav className="flex items-center space-x-4">
                                <button
                      onClick={() => navigate('/home')}
                      className="flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Volver a Documentos
                    </button>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 dark:text-white font-medium">
              Firmar Documento
            </span>
          </nav>
        </div>
      </motion.div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Visor PDF - 2/3 del ancho */}
          <div className="lg:col-span-2">
            {documento ? (
              <PDFViewerFirma
                documento={documento}
                onPositionSelected={handlePosicionSeleccionada}
                onClose={() => setShowPDF(false)}
              />
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Cargando Documento...
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Por favor espera mientras se carga el PDF
                  </p>
                </div>
                
                <div className="p-4">
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Panel de firma - 1/3 del ancho */}
          <div className="lg:col-span-1">
            {!showSolicitudMultiple ? (
              /* SECCIÓN DE FIRMA INDIVIDUAL */
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Firmar Documento
                </h3>

              {/* Información del documento */}
              {documento && (
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    Información del Documento
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <FileText className="w-4 h-4 mr-2" />
                      {documento.nombre}
                    </div>
                    {documento.firmas && documento.firmas.length > 0 && (
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <FileSignature className="w-4 h-4 mr-2" />
                        {documento.firmas.length} firma(s) existente(s)
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Selección de certificado */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Certificado de Firma
                </label>
                {certificados.length > 0 ? (
                  <select
                    value={certificadoSeleccionado}
                    onChange={(e) => setCertificadoSeleccionado(e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar certificado...</option>
                    {certificados.map((cert) => (
                      <option key={cert._id} value={cert._id}>
                        {cert.alias || cert.nombreComun} - {cert.propietario || cert.organizacion}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 border border-yellow-300 dark:border-yellow-600 rounded-md bg-yellow-50 dark:bg-yellow-900/20">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-yellow-700 dark:text-yellow-400">
                        Cargando certificados...
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Contraseña */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Contraseña del Certificado
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ingresa la contraseña del certificado"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <Eye className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Posición de firma */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Posición de Firma
                </label>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Haz clic en el PDF para seleccionar la posición
                </div>
                {posicionFirma ? (
                  <div className="text-sm text-green-600 dark:text-green-400 p-3 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="font-medium">Posición Seleccionada</span>
                    </div>
                    <div className="mt-2 space-y-1">
                      <div>📍 Coordenadas: ({posicionFirma.x}, {posicionFirma.y})</div>
                      <div>📄 Página: {posicionFirma.page}</div>
                      <div>📏 Tamaño QR: {posicionFirma.qrSize}px</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                      <span>⏳ Esperando selección de posición</span>
                    </div>
                    <div className="mt-1 text-xs">
                      Haz clic y arrastra en el PDF para seleccionar
                    </div>
                  </div>
                )}
              </div>

              {/* Botones de acción */}
              <div className="space-y-3">
                {/* Botón de firma individual */}
                <button
                  onClick={handleFirmar}
                  disabled={!certificadoSeleccionado || !password || !posicionFirma || firmando}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {firmando ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Firmando...
                    </>
                  ) : (
                    <>
                      <FileSignature className="w-4 h-4 mr-2" />
                      Firmar Documento
                    </>
                  )}
                </button>

                {/* Botón de solicitud múltiple */}
                <button
                  onClick={handleCrearSolicitudMultiple}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Solicitar Firma Múltiple
                </button>
              </div>
            </motion.div>
          ) : (
            /* SECCIÓN DE FIRMA MÚLTIPLE */
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  📋 Solicitud de Firma Múltiple
                </h3>
                <button
                  onClick={() => setShowSolicitudMultiple(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                  title="Volver a firma individual"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Título de la solicitud */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Título de la Solicitud
                </label>
                <input
                  type="text"
                  value={tituloSolicitud}
                  onChange={(e) => setTituloSolicitud(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Ej: Aprobación de contrato"
                />
              </div>

              {/* Mensaje personalizado */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mensaje para los Firmantes
                </label>
                <textarea
                  value={mensajeSolicitud}
                  onChange={(e) => setMensajeSolicitud(e.target.value)}
                  rows="3"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Explica por qué necesitas estas firmas..."
                />
              </div>

              {/* Fecha de expiración */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fecha de Expiración
                </label>
                <input
                  type="datetime-local"
                  value={fechaExpiracion}
                  onChange={(e) => setFechaExpiracion(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Lista de firmantes */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Firmante (máximo 1)
                </label>
                
                {/* Información del selector de posición */}
                {showPositionSelector && firmanteParaPosicion && (
                  <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                    <div className="flex items-center space-x-2">
                      <span className="text-blue-600 dark:text-blue-400">📍</span>
                      <span className="text-sm text-blue-700 dark:text-blue-300">
                        <strong>Abriendo selector para:</strong> {firmanteParaPosicion.nombre}
                      </span>
                    </div>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      Se abrirá un modal para seleccionar la posición de firma
                    </p>
                  </div>
                )}
                
                {/* Agregar nuevo firmante */}
                <div className="flex space-x-2 mb-2">
                  <select
                    value={nuevoFirmante}
                    onChange={(e) => setNuevoFirmante(e.target.value)}
                    className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    disabled={cargandoUsuarios || firmantes.length >= 1}
                  >
                                            <option value="">Seleccionar usuario...</option>
                        {usuarios.map(usuario => (
                          <option key={usuario._id} value={usuario._id}>
                            {usuario.nombre}
                          </option>
                        ))}
                  </select>
                  <button
                    onClick={agregarFirmante}
                    disabled={!nuevoFirmante || cargandoUsuarios || firmantes.length >= 1}
                    className={`px-3 py-2 rounded-md transition-colors ${
                      nuevoFirmante && !cargandoUsuarios && firmantes.length < 1
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    +
                  </button>
                </div>
                {firmantes.length >= 1 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    Ya seleccionaste el único firmante permitido.
                  </div>
                )}
                
                {/* Indicador de carga */}
                {cargandoUsuarios && (
                  <div className="text-xs text-blue-600 dark:text-blue-400 mb-2">
                    🔄 Cargando usuarios del sistema...
                  </div>
                )}

                                    {/* Lista de firmantes */}
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {firmantes.map((firmante, index) => {
                        // Colores diferentes para cada usuario
                        const colors = [
                          'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
                          'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
                          'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
                          'bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800',
                          'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800'
                        ];
                        const colorClass = colors[index % colors.length];
                        
                        return (
                          <div key={index} className={`flex items-center justify-between p-2 rounded-md border ${colorClass}`}>
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {firmante.nombre}
                              </div>
                              {firmante.posicion && (
                                <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                                  ✅ Posición: Página {firmante.posicion.page}, ({firmante.posicion.x}, {firmante.posicion.y})
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              {/* Botón para seleccionar posición */}
                              <button
                                onClick={() => abrirSelectorPosicion(firmante.usuarioId)}
                                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                                  firmante.posicion
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                                }`}
                                title={firmante.posicion ? 'Cambiar posición' : 'Seleccionar posición'}
                              >
                                {firmante.posicion ? '✏️ Editar' : '📍 Ubicar'}
                              </button>
                              
                              {/* Botón para remover */}
                              <button
                                onClick={() => removerFirmante(index)}
                                className="text-red-500 hover:text-red-700 transition-colors"
                                title="Remover firmante"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
              </div>

              {/* Mensajes de error dentro del panel */}
              {error && (
                <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300 rounded-md">
                  {error}
                </div>
              )}

              {/* Botones de acción */}
              <div className="flex space-x-2">
                <button
                  onClick={crearSolicitudMultiple}
                  disabled={!tituloSolicitud || firmantes.length !== 1 || creandoSolicitud}
                  className={`flex-1 p-2 rounded-md font-medium transition-colors ${
                    tituloSolicitud && firmantes.length === 1 && !creandoSolicitud
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {creandoSolicitud ? 'Creando...' : 'Crear Solicitud'}
                </button>
                <button
                  onClick={() => setShowSolicitudMultiple(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Información adicional abajo */}
        {documento && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8"
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Detalles del Documento
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Propietario</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{documento.usuario?.nombre || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Fecha de Subida</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {documento.createdAt ? new Date(documento.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <FileSignature className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Estado</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {documento.firmas && documento.firmas.length > 0 ? 'Firmado' : 'Sin firmar'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Modal de selección de posición */}
      <PositionSelector
        documento={documento}
        firmante={firmanteParaPosicion}
        isOpen={showPositionSelector}
        onClose={cerrarSelectorPosicion}
        onPositionSelected={manejarPosicionSeleccionada}
      />
    </div>
  );
};

export default FirmarDocumento;