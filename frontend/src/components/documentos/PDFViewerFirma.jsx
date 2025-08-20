import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Download, Eye, FileText, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, MousePointer, RotateCcw } from 'lucide-react';

const PDFViewerFirma = ({ documento, onPositionSelected, onClose, onClearSelection, firmanteSeleccionandoPosicion, onPosicionFirmanteSeleccionada }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0); // Default to 100% zoom
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectionBoxes, setSelectionBoxes] = useState(new Map()); // Múltiples cajas de selección
  const [isDragging, setIsDragging] = useState(false);
  const [startCoords, setStartCoords] = useState(null);
  
  // State for repositioning signature
  const [isRepositioning, setIsRepositioning] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [previewPosition, setPreviewPosition] = useState(null);
  
  const canvasRef = useRef(null);
  const pdfViewerRef = useRef(null);
  const pdfDocRef = useRef(null);
  const viewportRef = useRef(null);
  const isSavingRef = useRef(false);
  const firmanteIdRef = useRef(null); // siempre con el último valor
  const currentPageRef = useRef(1); // evita valores stale de página en handlers

  // Function to generate QR code data for the signature
  const generateQRCodeData = (position) => {
    return {
      signer: documento?.usuario?.nombre || 'Usuario',
      organization: documento?.usuario?.organizacion || '',
      email: documento?.usuario?.email || '',
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

  useEffect(() => {
    if (documento && documento._id) {
      cargarPDF();
    }
  }, [documento]);

  // Debug: monitorear cambios en isDragging
  useEffect(() => {
    console.log('🔄 Estado isDragging cambió a:', isDragging);
  }, [isDragging]);

  // Mostrar cajas existentes cuando cambie el firmante seleccionado
  useEffect(() => {
    // mantener ref actualizado para evitar valores stale en handlers
    firmanteIdRef.current = firmanteSeleccionandoPosicion || null;
    if (firmanteSeleccionandoPosicion && pdfViewerRef.current) {
      mostrarCajasExistentes();
    }
  }, [firmanteSeleccionandoPosicion]);

  // Mantener la página actual en una ref para usarla dentro de los handlers (evitar cierres obsoletos)
  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  // Configurar eventos del mouse cuando el componente se monte
  useEffect(() => {
    if (pdfViewerRef.current && !loading) {
      const timer = setTimeout(() => {
        setupMouseEvents();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [loading, pdfViewerRef.current]);



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
        // Use FileReader instead of URL.createObjectURL to avoid CSP issues
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
      
      // Esperar a que el PDF se renderice antes de configurar eventos
      await renderizarPagina(1);
      
      // Setup mouse events after PDF is loaded and rendered
      setTimeout(() => {
        if (pdfViewerRef.current) {
          setupMouseEvents();
        } else {
          console.error('❌ pdfViewerRef.current sigue siendo null después del renderizado');
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
      const viewport = page.getViewport({ scale: 1.0 }); // Escala base 1.0
      viewportRef.current = viewport;

      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      // Usar escala fija para mantener proporción
      const finalScale = scale;
      const finalViewport = page.getViewport({ scale: finalScale });
      
      canvas.height = finalViewport.height;
      canvas.width = finalViewport.width;
      
      // Estilos fijos para el canvas
      canvas.style.margin = '0';
      canvas.style.display = 'block';
      canvas.style.width = `${finalViewport.width}px`;
      canvas.style.height = `${finalViewport.height}px`;
      canvas.style.maxWidth = 'none';
      canvas.style.flexShrink = '0';

      const renderContext = {
        canvasContext: context,
        viewport: finalViewport
      };

      await page.render(renderContext).promise;
      console.log(`✅ Página ${pageNum} renderizada con escala ${finalScale.toFixed(2)} - Dimensiones: ${finalViewport.width}x${finalViewport.height}`);
    } catch (error) {
      console.error('Error renderizando página:', error);
    }
  };

  const cambiarPagina = (nuevaPagina) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPages) {
      setCurrentPage(nuevaPagina);
      renderizarPagina(nuevaPagina);
    }
  };

  const cambiarEscala = (nuevaEscala) => {
    const nuevaScale = Math.max(0.5, Math.min(3.0, nuevaEscala));
    setScale(nuevaScale);
    setTimeout(() => renderizarPagina(currentPage), 100);
  };

  // LÓGICA SIMPLE Y DIRECTA PARA ARRASTRE
  const setupMouseEvents = () => {
    console.log('🔧 Configurando eventos del mouse...');
    
    // Verificación adicional de seguridad
    if (!pdfViewerRef.current) {
      console.error('❌ pdfViewerRef.current es null');
      return;
    }
    
    if (!pdfViewerRef.current.querySelector('canvas')) {
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
      console.log('🖱️ Mouse down detectado');
      
      if (isRepositioning) {
        // Modo reposicionamiento
        const rect = pdfViewerRef.current.getBoundingClientRect();
        startX = event.clientX - rect.left;
        startY = event.clientY - rect.top;
        setDragOffset({ x: startX, y: startY });
        setIsDragging(true);
      } else {
        // Modo selección
        const rect = pdfViewerRef.current.getBoundingClientRect();
        startX = event.clientX - rect.left;
        startY = event.clientY - rect.top;
        
        // Crear nueva caja con color específico para el firmante
        const firmanteId = firmanteIdRef.current;
        currentBox = createSelectionBox(startX, startY, firmanteId);
        pdfViewerRef.current.appendChild(currentBox);
        
        // Guardar la caja en el estado de múltiples cajas
        setSelectionBoxes(prev => new Map(prev).set(firmanteId || 'default', currentBox));
        setStartCoords({ x: startX, y: startY });
        
        // Activar arrastre
        isDraggingNow = true;
        setIsDragging(true);
        
        console.log('🎯 Iniciando selección en:', { startX, startY });
      }
    };

    const handleMouseMove = (event) => {
      if (!isDraggingNow && !isRepositioning) return;
      
      console.log('🖱️ Mouse move detectado, arrastrando:', isDraggingNow);
      
      if (isRepositioning) {
        // Reposicionamiento
        const rect = pdfViewerRef.current.getBoundingClientRect();
        const currentX = event.clientX - rect.left;
        const currentY = event.clientY - rect.top;
        setPreviewPosition({ x: currentX, y: currentY });
      } else if (currentBox && isDraggingNow) {
        // Selección - actualizar caja en tiempo real
        const rect = pdfViewerRef.current.getBoundingClientRect();
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
      }
    };

    const handleMouseUp = () => {
      console.log('🖱️ Mouse up detectado');
      
      if (isRepositioning && previewPosition) {
        // Finalizar reposicionamiento
        const rect = pdfViewerRef.current.getBoundingClientRect();
        const pdfX = Math.round(previewPosition.x / scale);
        const pdfY = Math.round((rect.height - previewPosition.y) / scale);
        
        if (onPositionSelected && !firmanteIdRef.current) {
          onPositionSelected({
            x: pdfX,
            y: pdfY,
            page: currentPageRef.current,
            qrSize: 100,
            qrData: generateQRCodeData({ x: pdfX, y: pdfY, page: currentPageRef.current }),
            canvasWidth: rect.width,
            canvasHeight: rect.height
          });
        }
        
        setPreviewPosition(null);
        setIsDragging(false);
      } else if (currentBox && isDraggingNow) {
        // Finalizar selección - hacer la caja más visible y atractiva
        currentBox.style.border = '4px solid #10B981';
        currentBox.style.background = 'rgba(16, 185, 129, 0.3)';
        currentBox.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.6)';
        
        // Agregar un indicador visual de que está seleccionada
        const indicator = document.createElement('div');
        indicator.style.position = 'absolute';
        indicator.style.top = '-30px';
        indicator.style.left = '50%';
        indicator.style.transform = 'translateX(-50%)';
        indicator.style.background = '#10B981';
        indicator.style.color = 'white';
        indicator.style.padding = '4px 8px';
        indicator.style.borderRadius = '4px';
        indicator.style.fontSize = '12px';
        indicator.style.fontWeight = 'bold';
        indicator.style.whiteSpace = 'nowrap';
        indicator.style.zIndex = '1001';
        indicator.textContent = '📍 Posición Seleccionada';
        
        currentBox.appendChild(indicator);
        
        const rect = pdfViewerRef.current.getBoundingClientRect();
        const finalCoords = calculatePDFCoordinates(currentBox, rect);
        
        if (isSavingRef.current) {
          console.log('⏳ Ignorando mouseup duplicado');
        } else {
          isSavingRef.current = true;
          if (firmanteIdRef.current && onPosicionFirmanteSeleccionada) {
            onPosicionFirmanteSeleccionada({
              x: finalCoords.x,
              y: finalCoords.y,
              page: currentPageRef.current,
              qrSize: finalCoords.width || 100,
              qrData: generateQRCodeData({ x: finalCoords.x, y: finalCoords.y, page: currentPageRef.current }),
              canvasWidth: rect.width,
              canvasHeight: rect.height,
              firmanteId: firmanteIdRef.current
            });
          } else if (onPositionSelected) {
            onPositionSelected({
              x: finalCoords.x,
              y: finalCoords.y,
              page: currentPageRef.current,
              qrSize: finalCoords.width || 100,
              qrData: generateQRCodeData({ x: finalCoords.x, y: finalCoords.y, page: currentPageRef.current }),
              canvasWidth: rect.width,
              canvasHeight: rect.height
            });
          }
          setTimeout(() => { isSavingRef.current = false; }, 150);
        }
        
        console.log('✅ Selección completada para firmante:', firmanteIdRef.current, finalCoords);
      }
      
      // Resetear estado
      isDraggingNow = false;
      setIsDragging(false);
    };

    // Registrar eventos
    pdfViewerRef.current.addEventListener('mousedown', handleMouseDown);
    pdfViewerRef.current.addEventListener('mousemove', handleMouseMove);
    pdfViewerRef.current.addEventListener('mouseup', handleMouseUp);
    
    console.log('✅ Eventos del mouse registrados');

    // Cleanup
    return () => {
      if (pdfViewerRef.current) {
        pdfViewerRef.current.removeEventListener('mousedown', handleMouseDown);
        pdfViewerRef.current.removeEventListener('mousemove', handleMouseMove);
        pdfViewerRef.current.removeEventListener('mouseup', handleMouseUp);
      }
    };
  };

  // Creación del cuadrito de selección con colores diferentes
  const createSelectionBox = (x, y, firmanteId = null) => {
    const box = document.createElement('div');
    
    // Colores diferentes para cada firmante
    const colors = [
      { border: '#3B82F6', bg: 'rgba(59, 130, 246, 0.3)', shadow: 'rgba(59, 130, 246, 0.4)' }, // Azul
      { border: '#10B981', bg: 'rgba(16, 185, 129, 0.3)', shadow: 'rgba(16, 185, 129, 0.4)' }, // Verde
      { border: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.3)', shadow: 'rgba(139, 92, 246, 0.4)' }, // Púrpura
      { border: '#EC4899', bg: 'rgba(236, 72, 153, 0.3)', shadow: 'rgba(236, 72, 153, 0.4)' }, // Rosa
      { border: '#6366F1', bg: 'rgba(99, 102, 241, 0.3)', shadow: 'rgba(99, 102, 241, 0.4)' }  // Índigo
    ];
    
    // Cálculo robusto del índice de color para IDs no numéricos (e.g., ObjectId de Mongo)
    let colorIndex = 0;
    if (firmanteId && typeof firmanteId === 'string') {
      let hash = 0;
      for (let i = 0; i < firmanteId.length; i++) {
        hash = (hash * 31 + firmanteId.charCodeAt(i)) >>> 0;
      }
      colorIndex = hash % colors.length;
    }
    const color = colors[colorIndex] || colors[0];
    
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
    indicator.textContent = '📍 Posición Seleccionada';
    box.appendChild(indicator);
    
    console.log('🎯 Caja de selección creada en:', { x, y, firmanteId, color: color.border });
    return box;
  };

  // Actualización visual del cuadrito (como en posicionPDF.txt)
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
    
    console.log('📐 Caja actualizada:', { left, top, width: validWidth, height: validHeight });
  };

  // Cálculo de coordenadas del PDF - CORREGIDO para mayor precisión
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
    
    console.log('🔄 Conversión de coordenadas CORREGIDA:', {
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

  const mostrarIndicadorPosicion = (x, y) => {
    // Crear un indicador visual de la posición seleccionada
    const indicador = document.createElement('div');
    indicador.style.position = 'absolute';
    indicador.style.left = `${x - 10}px`;
    indicador.style.top = `${y - 10}px`;
    indicador.style.width = '20px';
    indicador.style.height = '20px';
    indicador.style.backgroundColor = '#3B82F6';
    indicador.style.borderRadius = '50%';
    indicador.style.border = '2px solid white';
    indicador.style.boxShadow = '0 0 10px rgba(59, 130, 246, 0.5)';
    indicador.style.pointerEvents = 'none';
    indicador.style.zIndex = '1000';

    const container = pdfViewerRef.current;
    if (container) {
      container.appendChild(indicador);

      // Remover el indicador después de 3 segundos
      setTimeout(() => {
        if (indicador.parentElement) {
          indicador.parentElement.removeChild(indicador);
        }
      }, 3000);
    }
  };

  const descargarPDF = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/documentos/${documento._id}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = documento.nombre || 'documento.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error descargando PDF:', error);
    }
  };

  // Función para limpiar la selección actual
  const limpiarSeleccion = () => {
    // Limpiar todas las cajas de selección
    selectionBoxes.forEach((box) => {
      if (box && box.parentElement) {
        box.parentElement.removeChild(box);
      }
    });
    setSelectionBoxes(new Map());
    setStartCoords(null);
    
    // Notificar al componente padre que se limpió la selección
    if (onClearSelection) {
      onClearSelection();
    }
    
    console.log('🧹 Todas las selecciones limpiadas');
  };

  // Función para mostrar todas las cajas de selección existentes
  const mostrarCajasExistentes = () => {
    selectionBoxes.forEach((box, firmanteId) => {
      if (box && !box.parentElement) {
        pdfViewerRef.current.appendChild(box);
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando PDF...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Error al cargar el PDF
          </h3>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <FileText className="w-6 h-6 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {documento?.nombre || 'Documento PDF'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Página {currentPage} de {totalPages}
            </p>
            {viewportRef.current && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                📏 {viewportRef.current.width.toFixed(0)} × {viewportRef.current.height.toFixed(0)} px
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsRepositioning(!isRepositioning)}
            className={`p-2 rounded-md transition-colors ${
              isRepositioning 
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' 
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-700'
            }`}
            title="Reposicionar firma"
          >
            <MousePointer className="w-4 h-4" />
          </button>
          

          
          {/* Botón para mostrar todas las cajas existentes */}
          {selectionBoxes.size > 0 && (
            <button
              onClick={mostrarCajasExistentes}
              className="p-2 bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-800 transition-colors rounded-md"
              title="Mostrar todas las posiciones"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
          
          {/* Botón para limpiar selección */}
          {selectionBoxes.size > 0 && (
            <button
              onClick={limpiarSeleccion}
              className="p-2 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800 transition-colors rounded-md"
              title="Limpiar todas las selecciones"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
          
          <button
            onClick={descargarPDF}
            className="p-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            title="Descargar PDF"
          >
            <Download className="w-4 h-4" />
          </button>
          
          <button
            onClick={onClose}
            className="p-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            title="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="relative bg-gray-100 dark:bg-gray-900 p-4">
        <div 
          ref={pdfViewerRef}
          className="relative mx-auto bg-white shadow-lg flex justify-center items-center"
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
              cursor: isRepositioning ? 'move' : 'crosshair',
              width: 'auto',
              height: 'auto',
              maxWidth: 'none',
              flexShrink: '0',
              flexGrow: '0'
            }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => cambiarPagina(currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-2 text-gray-600 hover:text-gray-800 disabled:text-gray-400 dark:text-gray-400 dark:hover:text-gray-200 disabled:dark:text-gray-600 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {currentPage} / {totalPages}
          </span>
          
          <button
            onClick={() => cambiarPagina(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="p-2 text-gray-600 hover:text-gray-800 disabled:text-gray-400 dark:text-gray-400 dark:hover:text-gray-200 disabled:dark:text-gray-600 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => cambiarEscala(scale - 0.25)}
            disabled={scale <= 0.5}
            className="p-2 text-gray-600 hover:text-gray-800 disabled:text-gray-400 dark:text-gray-400 dark:hover:text-gray-200 disabled:dark:text-gray-600 transition-colors"
            title="Reducir zoom"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          
          <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[60px] text-center">
            {Math.round(scale * 100)}%
          </span>
          
          <button
            onClick={() => cambiarEscala(1.0)}
            className="p-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            title="Tamaño natural (100%)"
          >
            <FileText className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => cambiarEscala(scale + 0.25)}
            disabled={scale >= 3.0}
            className="p-2 text-gray-600 hover:text-gray-800 disabled:text-gray-400 dark:text-gray-400 dark:hover:text-gray-200 disabled:dark:text-gray-600 transition-colors"
            title="Aumentar zoom"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-200 dark:border-blue-800">
        <div className="flex items-center space-x-2">
          <Eye className="w-4 h-4 text-blue-600" />
          <div className="flex-1">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {isRepositioning ? (
                <>
                  <strong>Modo Reposicionamiento:</strong> Haz clic y arrastra para mover la posición de la firma existente.
                </>
              ) : (
                <>
                  <strong>Modo Selección:</strong> Haz clic y arrastra para seleccionar el área exacta donde quieres colocar tu firma.
                </>
              )}
            </p>
            {!isRepositioning && (
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                💡 <strong>Tip:</strong> El cursor cambia a cruz cuando puedes seleccionar. Haz clic y arrastra para crear el área de firma.
              </p>
            )}
          </div>
        </div>
        
        {/* Indicador de posición en tiempo real */}
        {firmanteSeleccionandoPosicion && (
          <div className="mt-3 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-700 dark:text-green-400">
                <strong>Seleccionando área de firma para firmante...</strong> Suelta el mouse para confirmar la posición.
              </span>
            </div>
          </div>
        )}
        
        {/* Indicador de arrastre activo */}
        {isDragging && !isRepositioning && (
          <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <span className="text-xs text-blue-700 dark:text-blue-400">
                <strong>🖱️ Arrastrando...</strong> Mueve el mouse para definir el área de firma.
              </span>
            </div>
          </div>
        )}
        
        {/* Indicador de posiciones seleccionadas */}
        {selectionBoxes.size > 0 && (
          <div className="mt-2 p-2 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-md">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-purple-700 dark:text-purple-400">
                <strong>📍 {selectionBoxes.size} posición(es) seleccionada(s)</strong> - Usa el botón "Mostrar posiciones" para verlas todas
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PDFViewerFirma;
