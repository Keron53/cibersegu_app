import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Download, 
  X,
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize
} from 'lucide-react';

const PDFPreview = ({ pdfFile, onClose, showMarkers = false, markers = [], inline = false }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [scale, setScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const pdfRef = useRef(null);
  const renderTaskRef = useRef(null);

  useEffect(() => {
    if (pdfFile) {
      cargarPDF();
    }
  }, [pdfFile]);

  // Marcar cuando el componente esté montado
  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
      // Cancelar tarea de renderizado al desmontar
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }
    };
  }, []);

  const cargarPDF = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar PDF usando ArrayBuffer para evitar problemas de CSP
      const pdfBuffer = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
          resolve(e.target.result);
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(pdfFile);
      });

      // Cargar PDF usando PDF.js
      const pdfjsLib = window['pdfjs-dist/build/pdf'];
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

      const loadingTask = pdfjsLib.getDocument({ data: pdfBuffer });
      const pdf = await loadingTask.promise;
      
      pdfRef.current = pdf;
      setTotalPages(pdf.numPages);
      setCurrentPage(1);
      
      // Renderizar primera página
      await renderizarPagina(1);
      
    } catch (err) {
      console.error('Error cargando PDF:', err);
      setError('Error al cargar el PDF');
    } finally {
      setLoading(false);
    }
  };

  const renderizarPagina = async (pageNum) => {
    console.log('🔍 renderizarPagina:', { 
      pageNum, 
      pdfRef: !!pdfRef.current, 
      canvasRef: !!canvasRef.current,
      canvasElement: canvasRef.current 
    });
    
    if (!pdfRef.current || !canvasRef.current) {
      console.log('❌ No se puede renderizar:', { 
        pdfRef: !!pdfRef.current, 
        canvasRef: !!canvasRef.current 
      });
      return;
    }

    // Evitar renderizados múltiples
    if (isRendering) {
      console.log('⏳ Ya se está renderizando, esperando...');
      return;
    }

    // Cancelar tarea de renderizado anterior si existe
    if (renderTaskRef.current) {
      console.log('🔄 Cancelando tarea de renderizado anterior...');
      renderTaskRef.current.cancel();
      renderTaskRef.current = null;
    }

    setIsRendering(true);

    try {
      const page = await pdfRef.current.getPage(pageNum);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      const viewport = page.getViewport({ scale });
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      // Guardar referencia a la tarea de renderizado
      renderTaskRef.current = page.render(renderContext);
      await renderTaskRef.current.promise;

      // Dibujar marcadores si están habilitados
      if (showMarkers && markers.length > 0) {
        dibujarMarcadores(context, viewport);
      }

    } catch (err) {
      console.error('Error renderizando página:', err);
    } finally {
      setIsRendering(false);
    }
  };

  const dibujarMarcadores = (context, viewport) => {
    markers.forEach(marker => {
      if (marker.page === currentPage) {
        const x = marker.x * viewport.scale;
        const y = marker.y * viewport.scale;
        const width = marker.width * viewport.scale;
        const height = marker.height * viewport.scale;

        // Dibujar rectángulo de la firma
        context.strokeStyle = '#2563eb';
        context.lineWidth = 2;
        context.setLineDash([5, 5]);
        context.strokeRect(x, y, width, height);

        // Dibujar etiqueta
        context.fillStyle = '#2563eb';
        context.font = '12px Arial';
        context.fillText('Firma', x, y - 5);
      }
    });
  };

  const cambiarPagina = async (nuevaPagina) => {
    if (nuevaPagina < 1 || nuevaPagina > totalPages) return;
    
    setCurrentPage(nuevaPagina);
    await renderizarPagina(nuevaPagina);
  };

  const cambiarZoom = (nuevoZoom) => {
    const nuevoScale = Math.max(0.5, Math.min(3, scale + nuevoZoom));
    setScale(nuevoScale);
    renderizarPagina(currentPage);
  };

  const resetZoom = () => {
    setScale(1);
    renderizarPagina(currentPage);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const descargarPDF = () => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(pdfFile);
    link.download = pdfFile.name || 'documento.pdf';
    link.click();
  };

  // Efecto para renderizar cuando cambie la escala o marcadores
  useEffect(() => {
    if (currentPage > 0 && canvasRef.current) {
      renderizarPagina(currentPage);
    }
  }, [scale, showMarkers, markers]);

  // Efecto para renderizar cuando el canvas esté disponible
  useLayoutEffect(() => {
    if (currentPage > 0 && canvasRef.current && pdfRef.current) {
      renderizarPagina(currentPage);
    }
  }, [currentPage]);

  // Efecto para renderizar después de que el componente se monte
  useEffect(() => {
    if (!isMounted) return;
    
    const timer = setTimeout(() => {
      if (currentPage > 0 && canvasRef.current && pdfRef.current) {
        console.log('⏰ Timer ejecutado, intentando renderizar...');
        renderizarPagina(currentPage);
      } else {
        console.log('⏰ Timer ejecutado pero faltan referencias:', {
          currentPage,
          canvasRef: !!canvasRef.current,
          pdfRef: !!pdfRef.current
        });
      }
    }, 500); // Delay más largo para modo inline

    return () => clearTimeout(timer);
  }, [isMounted]); // Se ejecuta cuando isMounted cambie

  if (loading) {
    return (
      <div className={`${inline ? 'w-full' : 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50'}`}>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando PDF...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${inline ? 'w-full' : 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50'}`}>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center max-w-md">
          <X className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Error al cargar el PDF
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${inline ? 'w-full' : 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50'}`}>
      <motion.div
        ref={containerRef}
        initial={inline ? { opacity: 1 } : { opacity: 0, scale: 0.9 }}
        animate={inline ? { opacity: 1 } : { opacity: 1, scale: 1 }}
        exit={inline ? { opacity: 1 } : { opacity: 0, scale: 0.9 }}
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-2xl ${inline ? 'w-full' : 'max-w-6xl max-h-[90vh]'} overflow-hidden`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {pdfFile?.name || 'Vista previa del PDF'}
            </h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Página {currentPage} de {totalPages}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleFullscreen}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
            <button
              onClick={descargarPDF}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Descargar PDF"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Controles de navegación y zoom */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => cambiarPagina(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Página anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {currentPage} / {totalPages}
            </span>
            
            <button
              onClick={() => cambiarPagina(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Página siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => cambiarZoom(-0.2)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Reducir zoom"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            
            <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[60px] text-center">
              {Math.round(scale * 100)}%
            </span>
            
            <button
              onClick={() => cambiarZoom(0.2)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Aumentar zoom"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            
            <button
              onClick={resetZoom}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Restablecer zoom"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Contenido del PDF */}
        <div className="p-4 overflow-auto max-h-[calc(90vh-140px)]">
          <div className="flex justify-center">
            <canvas
              ref={canvasRef}
              className="border border-gray-200 dark:border-gray-600 shadow-lg"
            />
          </div>
        </div>

        {/* Indicador de marcadores */}
        {showMarkers && markers.length > 0 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-blue-700 dark:text-blue-300">
                Marcadores de firmas visibles en la página {currentPage}
              </span>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default PDFPreview;
