import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Check, AlertCircle, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

const PositionSelector = ({ 
  documento, 
  firmante, 
  firmantesExistentes = [], // Lista de firmantes ya agregados con sus posiciones
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
  const [isDragging, setIsDragging] = useState(false);
  const [startCoords, setStartCoords] = useState(null);
  const [selectionBox, setSelectionBox] = useState(null);
  const [existingPositionBoxes, setExistingPositionBoxes] = useState([]);
  
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const pdfDocRef = useRef(null);
  const viewportRef = useRef(null);
  const currentPageRef = useRef(1);
  const isSavingRef = useRef(false);

  useEffect(() => {
    if (isOpen && documento && documento._id) {
      cargarPDF();
    }
  }, [isOpen, documento]);

  // Mantener la página actual en una ref para usarla dentro de los handlers
  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  // Mostrar posiciones existentes cuando cambie la página o escala
  useEffect(() => {
    if (!loading && containerRef.current) {
      mostrarPosicionesExistentes();
    }
  }, [currentPage, scale, loading, firmantesExistentes]);

  // Configurar eventos del mouse cuando el componente se monte
  useEffect(() => {
    if (containerRef.current && !loading) {
      const timer = setTimeout(() => {
        setupMouseEvents();
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [loading, containerRef.current]);

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
      
      // Setup mouse events after PDF is loaded and rendered
      setTimeout(() => {
        if (containerRef.current) {
          setupMouseEvents();
        }
      }, 200);
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
      canvas.style.margin = '0';
      canvas.style.maxWidth = 'none';
      canvas.style.flexShrink = '0';

      const renderContext = {
        canvasContext: context,
        viewport: finalViewport
      };

      await page.render(renderContext).promise;
      console.log(`✅ Página ${pageNum} renderizada con escala ${finalScale.toFixed(2)}`);
    } catch (error) {
      console.error('Error renderizando página:', error);
    }
  };

  // LÓGICA DE ARRASTRE COPIADA DE PDFViewerFirma - PRECISA Y ROBUSTA
  const setupMouseEvents = () => {
    console.log('🔧 Configurando eventos del mouse en PositionSelector...');
    
    if (!containerRef.current) {
      console.error('❌ containerRef.current es null');
      return;
    }
    
    if (!containerRef.current.querySelector('canvas')) {
      console.error('❌ Canvas del PDF no encontrado');
      return;
    }
    
    console.log('✅ Ref y canvas disponibles, configurando eventos...');

    // Variables para el arrastre
    let isDraggingNow = false;
    let startX = 0;
    let startY = 0;
    let currentBox = null;

    const handleMouseDown = (event) => {
      console.log('🖱️ Mouse down detectado en PositionSelector');
      
      // Limpiar selección anterior
      limpiarSeleccionAnterior();
      
      // Modo selección
      const rect = containerRef.current.getBoundingClientRect();
      startX = event.clientX - rect.left;
      startY = event.clientY - rect.top;
      
      // Crear nueva caja con color específico para el firmante
      currentBox = createSelectionBox(startX, startY, firmante?.usuarioId);
      containerRef.current.appendChild(currentBox);
      
      setSelectionBox(currentBox);
      setStartCoords({ x: startX, y: startY });
      
      // Activar arrastre
      isDraggingNow = true;
      setIsDragging(true);
      
      console.log('🎯 Iniciando selección en:', { startX, startY });
    };

    const handleMouseMove = (event) => {
      if (!isDraggingNow || !currentBox) return;
      
      console.log('🖱️ Mouse move detectado, arrastrando:', isDraggingNow);
      
      // Selección - actualizar caja en tiempo real
      const rect = containerRef.current.getBoundingClientRect();
      const currentX = event.clientX - rect.left;
      const currentY = event.clientY - rect.top;
      
      // Calcular dimensiones
      const left = Math.min(currentX, startX);
      const top = Math.min(currentY, startY);
      const width = Math.abs(currentX - startX);
      const height = Math.abs(currentY - startY);
      
      // Aplicar límites
      const maxWidth = rect.width - left;
      const maxHeight = rect.height - top;
      const finalWidth = Math.min(width, maxWidth);
      const finalHeight = Math.min(height, maxHeight);
      
      // Actualizar caja
      updateSelectionBox(currentBox, left, top, finalWidth, finalHeight);
      
      console.log('📏 Caja actualizada:', { left, top, width: finalWidth, height: finalHeight });
    };

    const handleMouseUp = () => {
      console.log('🖱️ Mouse up detectado en PositionSelector');
      
      if (currentBox && isDraggingNow) {
        // Finalizar selección - hacer la caja más visible y atractiva
        currentBox.style.border = '4px solid #3B82F6';
        currentBox.style.background = 'rgba(59, 130, 246, 0.3)';
        currentBox.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.6)';
        
        // Actualizar el indicador
        const indicator = currentBox.querySelector('.position-indicator');
        if (indicator) {
          indicator.style.background = '#3B82F6';
          indicator.textContent = `📍 ${firmante?.nombre}`;
        }
        
        const rect = containerRef.current.getBoundingClientRect();
        const finalCoords = calculatePDFCoordinates(currentBox, rect);
        
        if (isSavingRef.current) {
          console.log('⏳ Ignorando mouseup duplicado');
        } else {
          isSavingRef.current = true;
          
          // Guardar la posición seleccionada
          const position = {
            x: finalCoords.x,
            y: finalCoords.y,
            page: currentPageRef.current,
            qrSize: finalCoords.width || 100,
            qrData: generateQRCodeData({ x: finalCoords.x, y: finalCoords.y, page: currentPageRef.current }),
            canvasWidth: rect.width,
            canvasHeight: rect.height,
            firmanteId: firmante?.usuarioId,
            screenX: parseFloat(currentBox.style.left) + parseFloat(currentBox.style.width) / 2,
            screenY: parseFloat(currentBox.style.top) + parseFloat(currentBox.style.height) / 2,
            scale: scale
          };
          
          setSelectedPosition(position);
          setTimeout(() => { isSavingRef.current = false; }, 150);
        }
        
        console.log('✅ Selección completada para firmante:', firmante?.usuarioId, finalCoords);
      }
      
      // Resetear estado
      isDraggingNow = false;
      setIsDragging(false);
    };

    // Registrar eventos
    containerRef.current.addEventListener('mousedown', handleMouseDown);
    containerRef.current.addEventListener('mousemove', handleMouseMove);
    containerRef.current.addEventListener('mouseup', handleMouseUp);
    
    console.log('✅ Eventos del mouse registrados en PositionSelector');

    // Cleanup
    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener('mousedown', handleMouseDown);
        containerRef.current.removeEventListener('mousemove', handleMouseMove);
        containerRef.current.removeEventListener('mouseup', handleMouseUp);
      }
    };
  };

  // Creación del cuadrito de selección - COPIADO Y ADAPTADO DE PDFViewerFirma
  const createSelectionBox = (x, y, firmanteId = null) => {
    const box = document.createElement('div');
    
    // Color azul para el PositionSelector
    const color = { border: '#3B82F6', bg: 'rgba(59, 130, 246, 0.2)', shadow: 'rgba(59, 130, 246, 0.4)' };
    
    // Estilo visual del cuadrito
    box.classList.add('selection-box');
    box.dataset.firmanteId = firmanteId || 'default';
    
    // Posicionamiento inicial
    box.style.position = 'absolute';
    box.style.left = `${x}px`;
    box.style.top = `${y}px`;
    box.style.width = '0px';
    box.style.height = '0px';
    
    // Apariencia visual con color específico
    box.style.border = `3px solid ${color.border}`;
    box.style.background = color.bg;
    box.style.pointerEvents = 'none';
    box.style.borderRadius = '4px';
    box.style.boxShadow = `0 0 8px ${color.shadow}`;
    box.style.zIndex = '1000';
    box.style.transition = 'none';
    
    // Agregar indicador de posición seleccionada
    const indicator = document.createElement('div');
    indicator.className = 'position-indicator';
    indicator.style.position = 'absolute';
    indicator.style.top = '-30px';
    indicator.style.left = '50%';
    indicator.style.transform = 'translateX(-50%)';
    indicator.style.background = color.border;
    indicator.style.color = 'white';
    indicator.style.padding = '4px 8px';
    indicator.style.borderRadius = '4px';
    indicator.style.fontSize = '12px';
    indicator.style.fontWeight = 'bold';
    indicator.style.whiteSpace = 'nowrap';
    indicator.style.zIndex = '1001';
    indicator.textContent = '📍 Arrastrando...';
    box.appendChild(indicator);
    
    console.log('🎯 Caja de selección creada en PositionSelector:', { x, y, firmanteId });
    return box;
  };

  // Actualización visual del cuadrito - COPIADO DE PDFViewerFirma
  const updateSelectionBox = (box, left, top, width, height) => {
    if (!box || !box.style) {
      console.error('❌ Error: box o box.style es null');
      return;
    }
    
    // Asegurar que las dimensiones sean válidas
    const validWidth = Math.max(0, width);
    const validHeight = Math.max(0, height);
    
    box.style.left = `${left}px`;
    box.style.top = `${top}px`;
    box.style.width = `${validWidth}px`;
    box.style.height = `${validHeight}px`;
    
    console.log('📐 Caja actualizada en PositionSelector:', { left, top, width: validWidth, height: validHeight });
  };

  // Cálculo de coordenadas del PDF - COPIADO EXACTO DE PDFViewerFirma
  const calculatePDFCoordinates = (selectionBox, rect) => {
    // 1. Convertir coordenadas de pantalla a coordenadas del PDF
    // El PDF.js usa coordenadas cartesianas (0,0 en la esquina inferior izquierda)
    // La pantalla usa coordenadas (0,0 en la esquina superior izquierda)
    
    // Obtener coordenadas de la caja de selección
    const boxLeft = parseInt(selectionBox.style.left);
    const boxTop = parseInt(selectionBox.style.top);
    const boxWidth = parseInt(selectionBox.style.width);
    const boxHeight = parseInt(selectionBox.style.height);
    
    // Convertir a coordenadas del PDF considerando la escala
    const x = boxLeft / scale;
    
    // CORRECCIÓN: Ajustar el offset Y para mayor precisión
    // El problema era que estábamos restando rect.height completo
    // Necesitamos considerar solo la altura del canvas del PDF
    const canvasHeight = rect.height;
    const y = (canvasHeight - boxTop - boxHeight) / scale; // Restar también la altura de la caja
    
    const width = boxWidth / scale;
    const height = boxHeight / scale;
    
    console.log('🔄 Conversión de coordenadas CORREGIDA en PositionSelector:', {
      screen: { 
        left: boxLeft, 
        top: boxTop, 
        width: boxWidth, 
        height: boxHeight 
      },
      canvas: { width: rect.width, height: canvasHeight },
      pdf: { 
        x: Math.round(x), 
        y: Math.round(y), 
        width: Math.round(width), 
        height: Math.round(height) 
      },
      scale: scale,
      offsetY: canvasHeight - boxTop - boxHeight
    });
    
    return { x: Math.round(x), y: Math.round(y), width: Math.round(width), height: Math.round(height) };
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
      limpiarSeleccionAnterior();
      limpiarPosicionesExistentes();
      renderizarPagina(nuevaPagina);
    }
  };

  const cambiarEscala = (nuevaEscala) => {
    const nuevaScale = Math.max(0.5, Math.min(3.0, nuevaEscala));
    setScale(nuevaScale);
    setSelectedPosition(null);
    limpiarSeleccionAnterior();
    limpiarPosicionesExistentes();
    setTimeout(() => renderizarPagina(currentPage), 100);
  };

  const limpiarSeleccionAnterior = () => {
    if (selectionBox && selectionBox.parentElement) {
      selectionBox.parentElement.removeChild(selectionBox);
    }
    setSelectionBox(null);
  };

  // Función para mostrar las posiciones existentes de otros firmantes
  const mostrarPosicionesExistentes = () => {
    // Limpiar posiciones existentes primero
    limpiarPosicionesExistentes();

    if (!containerRef.current || !firmantesExistentes.length) return;

    const nuevasPosicionesBoxes = [];
    
    firmantesExistentes.forEach((firmante, index) => {
      if (firmante.posicion && firmante.posicion.page === currentPage) {
        const box = crearCajaExistente(firmante, index);
        containerRef.current.appendChild(box);
        nuevasPosicionesBoxes.push(box);
      }
    });

    setExistingPositionBoxes(nuevasPosicionesBoxes);
  };

  // Función para crear cajas de posiciones existentes
  const crearCajaExistente = (firmante, index) => {
    const { posicion } = firmante;
    
    // Convertir coordenadas PDF a coordenadas de pantalla
    const screenX = posicion.x * scale;
    const screenY = (containerRef.current.getBoundingClientRect().height - (posicion.y * scale)) - (posicion.qrSize || 100);
    
    const box = document.createElement('div');
    
    // Colores diferentes para cada firmante existente
    const colors = [
      { border: '#10B981', bg: 'rgba(16, 185, 129, 0.2)', shadow: 'rgba(16, 185, 129, 0.4)' }, // Verde
      { border: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.2)', shadow: 'rgba(139, 92, 246, 0.4)' }, // Púrpura
      { border: '#EC4899', bg: 'rgba(236, 72, 153, 0.2)', shadow: 'rgba(236, 72, 153, 0.4)' }, // Rosa
      { border: '#F59E0B', bg: 'rgba(245, 158, 11, 0.2)', shadow: 'rgba(245, 158, 11, 0.4)' }, // Amarillo
      { border: '#6366F1', bg: 'rgba(99, 102, 241, 0.2)', shadow: 'rgba(99, 102, 241, 0.4)' }  // Índigo
    ];
    
    const color = colors[index % colors.length];
    
    // Estilo visual del cuadrito existente
    box.classList.add('existing-position-box');
    box.dataset.firmanteId = firmante.usuarioId;
    
    // Posicionamiento
    box.style.position = 'absolute';
    box.style.left = `${screenX}px`;
    box.style.top = `${screenY}px`;
    box.style.width = `${(posicion.qrSize || 100) * scale}px`;
    box.style.height = `${50 * scale}px`; // Altura estándar
    
    // Apariencia visual
    box.style.border = `3px solid ${color.border}`;
    box.style.background = color.bg;
    box.style.pointerEvents = 'none';
    box.style.borderRadius = '6px';
    box.style.boxShadow = `0 0 10px ${color.shadow}`;
    box.style.zIndex = '999'; // Menor que la nueva selección
    box.style.transition = 'none';
    
    // Agregar indicador de firmante existente
    const indicator = document.createElement('div');
    indicator.className = 'existing-position-indicator';
    indicator.style.position = 'absolute';
    indicator.style.top = '-35px';
    indicator.style.left = '50%';
    indicator.style.transform = 'translateX(-50%)';
    indicator.style.background = color.border;
    indicator.style.color = 'white';
    indicator.style.padding = '4px 8px';
    indicator.style.borderRadius = '4px';
    indicator.style.fontSize = '11px';
    indicator.style.fontWeight = 'bold';
    indicator.style.whiteSpace = 'nowrap';
    indicator.style.zIndex = '1000';
    indicator.textContent = `✅ ${firmante.nombre}`;
    box.appendChild(indicator);
    
    // Agregar texto interior
    const texto = document.createElement('div');
    texto.style.position = 'absolute';
    texto.style.top = '50%';
    texto.style.left = '50%';
    texto.style.transform = 'translate(-50%, -50%)';
    texto.style.color = color.border;
    texto.style.fontSize = '10px';
    texto.style.fontWeight = 'bold';
    texto.style.textAlign = 'center';
    texto.textContent = 'OCUPADO';
    box.appendChild(texto);
    
    console.log('👥 Posición existente mostrada para:', firmante.nombre, { screenX, screenY });
    return box;
  };

  // Función para limpiar posiciones existentes
  const limpiarPosicionesExistentes = () => {
    existingPositionBoxes.forEach(box => {
      if (box && box.parentElement) {
        box.parentElement.removeChild(box);
      }
    });
    setExistingPositionBoxes([]);
  };

  const reiniciarSeleccion = () => {
    setSelectedPosition(null);
    limpiarSeleccionAnterior();
  };

  const confirmarPosicion = () => {
    if (selectedPosition && firmante) {
      onPositionSelected(selectedPosition);
      onClose();
    }
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
                    style={{ 
                      minHeight: '600px',
                      overflow: 'hidden',
                      width: 'fit-content',
                      maxWidth: '100%',
                      flexShrink: '0',
                      flexGrow: '0',
                      aspectRatio: 'auto'
                    }}
                  >
                    <canvas
                      ref={canvasRef}
                      className="block"
                      style={{ 
                        cursor: 'crosshair',
                        width: 'auto',
                        height: 'auto',
                        maxWidth: 'none',
                        flexShrink: '0',
                        flexGrow: '0'
                      }}
                    />
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
                    👤 Firmante Actual
                  </h4>
                  <p className="text-blue-700 dark:text-blue-300 text-sm">
                    {firmante?.nombre}
                  </p>
                  <p className="text-blue-600 dark:text-blue-400 text-xs">
                    {firmante?.email}
                  </p>
                </div>

                {/* Información de firmantes existentes */}
                {firmantesExistentes.length > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                      👥 Otros Firmantes ({firmantesExistentes.length})
                    </h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {firmantesExistentes.map((firmante, index) => {
                        const colors = ['text-green-600', 'text-purple-600', 'text-pink-600', 'text-yellow-600', 'text-indigo-600'];
                        const colorClass = colors[index % colors.length];
                        
                        return (
                          <div key={firmante.usuarioId} className="flex items-center justify-between text-xs">
                            <span className={`${colorClass} font-medium`}>
                              {firmante.nombre}
                            </span>
                            <span className="text-gray-500">
                              {firmante.posicion ? `Pág. ${firmante.posicion.page}` : 'Sin posición'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      💡 Las posiciones ocupadas se muestran en el PDF
                    </p>
                  </div>
                )}

                {/* Instrucciones */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    📋 Instrucciones
                  </h4>
                  <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>1. Navega por las páginas del documento</li>
                    <li>2. <strong>Haz clic y arrastra</strong> para crear el área de firma</li>
                    <li>3. Revisa la posición seleccionada</li>
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
                      Haz clic y arrastra en el documento para seleccionar el área de firma
                    </p>
                  </div>
                ) : (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Check className="w-5 h-5 text-green-600" />
                      <span className="text-green-700 dark:text-green-300 text-sm font-medium">
                        Área seleccionada
                      </span>
                    </div>
                    <div className="text-xs text-green-600 dark:text-green-400 space-y-1">
                      <div>📄 Página: {selectedPosition.page}</div>
                      <div>📍 Coordenadas: ({selectedPosition.x}, {selectedPosition.y})</div>
                      <div>📏 Tamaño: {selectedPosition.qrSize}px</div>
                    </div>
                  </div>
                )}

                {/* Indicador de arrastre activo */}
                {isDragging && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                      <span className="text-blue-700 dark:text-blue-400 text-sm font-medium">
                        🖱️ Arrastrando área de firma...
                      </span>
                    </div>
                    <p className="text-blue-600 dark:text-blue-400 text-xs mt-1">
                      Suelta el mouse para finalizar la selección
                    </p>
                  </div>
                )}

                {/* Botones de acción */}
                <div className="space-y-3">
                  {selectedPosition && (
                    <button
                      onClick={reiniciarSeleccion}
                      className="w-full bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition-colors flex items-center justify-center"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Seleccionar otra área
                    </button>
                  )}
                  
                  <button
                    onClick={confirmarPosicion}
                    disabled={!selectedPosition}
                    className={`w-full py-2 px-4 rounded-md transition-colors flex items-center justify-center ${
                      selectedPosition
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Confirmar Posición
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