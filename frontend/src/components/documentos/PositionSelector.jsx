import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Check, AlertCircle, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';

const PositionSelector = ({ 
  documento, 
  firmante, 
  isOpen, 
  onClose, 
  onPositionSelected 
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const pdfDocRef = useRef(null);
  const viewportRef = useRef(null);

  useEffect(() => {
    if (isOpen && documento && documento._id) {
      cargarPDF();
    }
  }, [isOpen, documento]);

  const cargarPDF = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/documentos/${documento._id}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onload = function(e) {
          const arrayBuffer = e.target.result;
          cargarPDFConPDFJS(arrayBuffer);
        };
        reader.readAsArrayBuffer(blob);
      } else {
        setError('Error al cargar el PDF');
      }
    } catch (error) {
      console.error('Error cargando PDF:', error);
      setError('Error de conexión al cargar el PDF');
    } finally {
      setLoading(false);
    }
  };

  const cargarPDFConPDFJS = async (arrayBuffer) => {
    try {
      if (typeof window.pdfjsLib === 'undefined') {
        setError('PDF.js no está disponible');
        return;
      }

      const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      pdfDocRef.current = pdf;
      
      setTotalPages(pdf.numPages);
      setCurrentPage(1);
      
      await renderizarPagina(1);
    } catch (error) {
      console.error('Error cargando PDF con PDF.js:', error);
      setError('Error al procesar el PDF');
    }
  };

  const renderizarPagina = async (pageNum) => {
    if (!pdfDocRef.current || !canvasRef.current) return;

    try {
      const page = await pdfDocRef.current.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.0 });
      viewportRef.current = viewport;

      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      const finalScale = scale;
      const finalViewport = page.getViewport({ scale: finalScale });
      
      canvas.height = finalViewport.height;
      canvas.width = finalViewport.width;
      
      canvas.style.display = 'block';
      canvas.style.width = `${finalViewport.width}px`;
      canvas.style.height = `${finalViewport.height}px`;

      const renderContext = {
        canvasContext: context,
        viewport: finalViewport
      };

      await page.render(renderContext).promise;
      console.log(`✅ Página ${pageNum} renderizada`);
    } catch (error) {
      console.error('Error renderizando página:', error);
    }
  };

  const handleCanvasClick = (event) => {
    if (!containerRef.current || isPreviewMode) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Convertir coordenadas de pantalla a coordenadas PDF
    const pdfX = Math.round(x / scale);
    const pdfY = Math.round((rect.height - y) / scale);

    const position = {
      x: pdfX,
      y: pdfY,
      page: currentPage,
      screenX: x,
      screenY: y,
      canvasWidth: rect.width,
      canvasHeight: rect.height,
      scale: scale
    };

    setSelectedPosition(position);
    setIsPreviewMode(true);
    
    console.log('📍 Posición seleccionada:', position);
  };

  const confirmarPosicion = () => {
    if (selectedPosition && firmante) {
      const posicionFinal = {
        ...selectedPosition,
        firmanteId: firmante.usuarioId,
        firmante: firmante.nombre,
        qrSize: 100,
        qrData: generateQRCodeData(selectedPosition)
      };

      onPositionSelected(posicionFinal);
      onClose();
    }
  };

  const generateQRCodeData = (position) => {
    return {
      signer: firmante?.nombre || 'Usuario',
      email: firmante?.email || '',
      document: documento?.nombre || '',
      documentId: documento?._id || '',
      position: {
        x: position.x,
        y: position.y,
        page: position.page
      },
      date: new Date().toISOString(),
      validator: 'Digital Sign PUCESE'
    };
  };

  const cambiarPagina = (nuevaPagina) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPages) {
      setCurrentPage(nuevaPagina);
      setSelectedPosition(null);
      setIsPreviewMode(false);
      renderizarPagina(nuevaPagina);
    }
  };

  const cambiarEscala = (nuevaEscala) => {
    const nuevaScale = Math.max(0.5, Math.min(3.0, nuevaEscala));
    setScale(nuevaScale);
    setSelectedPosition(null);
    setIsPreviewMode(false);
    setTimeout(() => renderizarPagina(currentPage), 100);
  };

  const reiniciarSeleccion = () => {
    setSelectedPosition(null);
    setIsPreviewMode(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                📍 Seleccionar Posición de Firma
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Para: <span className="font-medium text-blue-600">{firmante?.nombre}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex flex-col lg:flex-row h-[calc(90vh-140px)]">
            {/* PDF Viewer */}
            <div className="flex-1 bg-gray-100 dark:bg-gray-900 p-4 overflow-auto">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando PDF...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <p className="text-red-600 dark:text-red-400">{error}</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div 
                    ref={containerRef}
                    className="relative bg-white shadow-lg cursor-crosshair"
                    onClick={handleCanvasClick}
                  >
                    <canvas
                      ref={canvasRef}
                      className="block"
                    />
                    
                    {/* Preview de la posición seleccionada */}
                    {selectedPosition && isPreviewMode && (
                      <div
                        className="absolute border-4 border-blue-500 bg-blue-500 bg-opacity-30 rounded-lg pointer-events-none"
                        style={{
                          left: selectedPosition.screenX - 50,
                          top: selectedPosition.screenY - 25,
                          width: 100,
                          height: 50,
                        }}
                      >
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
                          📍 {firmante?.nombre}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Controles de navegación */}
                  <div className="flex items-center justify-between w-full max-w-md mt-4 bg-white dark:bg-gray-800 rounded-lg p-3 shadow">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => cambiarPagina(currentPage - 1)}
                        disabled={currentPage <= 1}
                        className="p-2 text-gray-600 hover:text-gray-800 disabled:text-gray-400 transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {currentPage} / {totalPages}
                      </span>
                      
                      <button
                        onClick={() => cambiarPagina(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                        className="p-2 text-gray-600 hover:text-gray-800 disabled:text-gray-400 transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => cambiarEscala(scale - 0.25)}
                        disabled={scale <= 0.5}
                        className="p-2 text-gray-600 hover:text-gray-800 disabled:text-gray-400 transition-colors"
                      >
                        <ZoomOut className="w-4 h-4" />
                      </button>
                      
                      <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[50px] text-center">
                        {Math.round(scale * 100)}%
                      </span>
                      
                      <button
                        onClick={() => cambiarEscala(scale + 0.25)}
                        disabled={scale >= 3.0}
                        className="p-2 text-gray-600 hover:text-gray-800 disabled:text-gray-400 transition-colors"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Panel lateral */}
            <div className="w-full lg:w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-6">
              <div className="space-y-6">
                {/* Información del firmante */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                    👤 Firmante
                  </h4>
                  <p className="text-blue-700 dark:text-blue-300 text-sm">
                    {firmante?.nombre}
                  </p>
                  <p className="text-blue-600 dark:text-blue-400 text-xs">
                    {firmante?.email}
                  </p>
                </div>

                {/* Instrucciones */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    📋 Instrucciones
                  </h4>
                  <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>1. Navega por las páginas del documento</li>
                    <li>2. Haz clic donde quieres colocar la firma</li>
                    <li>3. Revisa la posición en vista previa</li>
                    <li>4. Confirma la selección</li>
                  </ol>
                </div>

                {/* Estado actual */}
                {!selectedPosition ? (
                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-5 h-5 text-orange-600" />
                      <span className="text-orange-700 dark:text-orange-300 text-sm font-medium">
                        Esperando selección
                      </span>
                    </div>
                    <p className="text-orange-600 dark:text-orange-400 text-xs mt-1">
                      Haz clic en el documento para seleccionar la posición
                    </p>
                  </div>
                ) : (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Check className="w-5 h-5 text-green-600" />
                      <span className="text-green-700 dark:text-green-300 text-sm font-medium">
                        Posición seleccionada
                      </span>
                    </div>
                    <div className="text-xs text-green-600 dark:text-green-400 space-y-1">
                      <div>📄 Página: {selectedPosition.page}</div>
                      <div>📍 Coordenadas: ({selectedPosition.x}, {selectedPosition.y})</div>
                    </div>
                  </div>
                )}

                {/* Botones de acción */}
                <div className="space-y-3">
                  {selectedPosition && (
                    <button
                      onClick={reiniciarSeleccion}
                      className="w-full bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition-colors"
                    >
                      🔄 Seleccionar otra posición
                    </button>
                  )}
                  
                  <button
                    onClick={confirmarPosicion}
                    disabled={!selectedPosition}
                    className={`w-full py-2 px-4 rounded-md transition-colors ${
                      selectedPosition
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    ✅ Confirmar Posición
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PositionSelector;
