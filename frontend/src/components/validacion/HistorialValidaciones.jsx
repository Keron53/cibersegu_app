import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye
} from 'lucide-react';
import { documentoService } from '../../services/api';

const HistorialValidaciones = () => {
  const [validaciones, setValidaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtro, setFiltro] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [estadisticas, setEstadisticas] = useState({
    total: 0,
    firmados: 0,
    nuestroSistema: 0,
    otrosSistemas: 0
  });

  useEffect(() => {
    cargarHistorial();
  }, [pagina, filtro]);

  const cargarHistorial = async () => {
    try {
      setLoading(true);
      const response = await documentoService.obtenerHistorial(pagina, 10, filtro);
      
      if (response.success) {
        setValidaciones(response.validaciones);
        setTotalPaginas(response.paginacion.pages);
        setEstadisticas(response.estadisticas);
      }
    } catch (err) {
      setError('Error al cargar el historial');
      console.error('Error cargando historial:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtrarValidaciones = () => {
    if (!busqueda) return validaciones;
    
    return validaciones.filter(validacion =>
      validacion.nombreArchivo.toLowerCase().includes(busqueda.toLowerCase()) ||
      validacion.resultado.message.toLowerCase().includes(busqueda.toLowerCase())
    );
  };

  const obtenerIconoEstado = (validacion) => {
    if (!validacion.resultado.isValid) return <XCircle className="w-5 h-5 text-red-500" />;
    if (validacion.resultado.isOurSystem) return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (validacion.resultado.hasSignatures) return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    return <FileText className="w-5 h-5 text-gray-500" />;
  };

  const obtenerColorEstado = (validacion) => {
    if (!validacion.resultado.isValid) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    if (validacion.resultado.isOurSystem) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (validacion.resultado.hasSignatures) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  };

  const formatearTamaño = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Error al cargar el historial
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
        <button
          onClick={cargarHistorial}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          Intentar de nuevo
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header y Estadísticas */}
      <div className="bg-white dark:bg-background-light rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Historial de Validaciones
          </h2>
          <Clock className="w-8 h-8 text-primary" />
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {estadisticas.total}
            </div>
            <div className="text-sm text-blue-600 dark:text-blue-400">Total</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {estadisticas.firmados}
            </div>
            <div className="text-sm text-green-600 dark:text-green-400">Firmados</div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {estadisticas.nuestroSistema}
            </div>
            <div className="text-sm text-purple-600 dark:text-purple-400">Nuestro Sistema</div>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {estadisticas.otrosSistemas}
            </div>
            <div className="text-sm text-orange-600 dark:text-orange-400">Otros Sistemas</div>
          </div>
        </div>

        {/* Filtros y Búsqueda */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre de archivo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="todos">Todos</option>
              <option value="firmados">Firmados</option>
              <option value="nuestro_sistema">Nuestro Sistema</option>
              <option value="otros_sistemas">Otros Sistemas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Validaciones */}
      <div className="bg-white dark:bg-background-light rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Validaciones Recientes
          </h3>
        </div>

        {filtrarValidaciones().length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No hay validaciones
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {busqueda ? 'No se encontraron resultados para tu búsqueda.' : 'Aún no has validado ningún PDF.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filtrarValidaciones().map((validacion, index) => (
              <motion.div
                key={validacion._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="flex-shrink-0">
                      {obtenerIconoEstado(validacion)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {validacion.nombreArchivo}
                        </h4>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${obtenerColorEstado(validacion)}`}>
                          {validacion.resultado.systemType}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {validacion.resultado.message}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {formatearFecha(validacion.createdAt)}
                        </span>
                        {validacion.metadata?.tamaño && (
                          <span>{formatearTamaño(validacion.metadata.tamaño)}</span>
                        )}
                        {validacion.resultado.signatureCount > 0 && (
                          <span>{validacion.resultado.signatureCount} firma(s)</span>
                        )}
                        {validacion.tipoValidacion === 'url' && (
                          <span className="text-blue-600 dark:text-blue-400">Desde URL</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      title="Ver detalles"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      title="Descargar reporte"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Paginación */}
        {totalPaginas > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Página {pagina} de {totalPaginas}
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPagina(Math.max(1, pagina - 1))}
                  disabled={pagina === 1}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => setPagina(Math.min(totalPaginas, pagina + 1))}
                  disabled={pagina === totalPaginas}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistorialValidaciones;
