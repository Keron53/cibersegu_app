import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, XCircle, Send, Loader2 } from 'lucide-react';

const RechazarSolicitudModal = ({ isOpen, onClose, onRechazar, solicitud }) => {
  const [motivo, setMotivo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');

  const razonesPredefinidas = [
    {
      id: 'no_autorizado',
      label: 'No estoy autorizado para firmar este documento',
      description: 'El documento requiere autorización de otro nivel'
    },
    {
      id: 'documento_incompleto',
      label: 'El documento está incompleto o tiene errores',
      description: 'Necesita correcciones antes de proceder'
    },
    {
      id: 'informacion_insuficiente',
      label: 'Falta información necesaria para la firma',
      description: 'Se requieren datos adicionales'
    },
    {
      id: 'politica_interna',
      label: 'No cumple con las políticas internas',
      description: 'Violación de procedimientos establecidos'
    },
    {
      id: 'otro',
      label: 'Otro motivo',
      description: 'Especificar en el campo de texto'
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedReason && !motivo.trim()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const motivoFinal = motivo.trim() || 
        (selectedReason !== 'otro' ? 
          razonesPredefinidas.find(r => r.id === selectedReason)?.label : 
          'Sin motivo especificado'
        );
      
      await onRechazar(motivoFinal);
      onClose();
    } catch (error) {
      console.error('Error al rechazar solicitud:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setMotivo('');
      setSelectedReason('');
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-5xl w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-400/20 rounded-full">
                    <XCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Rechazar Solicitud de Firma</h3>
                    <p className="text-red-100 text-sm mt-1">
                      Documento: {solicitud?.documentoId?.nombre || 'Sin nombre'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="p-2 hover:bg-red-400/20 rounded-full transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Columna Izquierda - Información y Razones */}
                <div className="space-y-6">
                  {/* Advertencia */}
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex-shrink-0">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        ¿Estás seguro de que quieres rechazar esta solicitud?
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Esta acción no se puede deshacer y se notificará al solicitante.
                      </p>
                    </div>
                  </div>

                  {/* Información de la solicitud */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Solicitante:</span>
                        <p className="text-gray-900 dark:text-white">{solicitud?.solicitanteId?.nombre || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Fecha de solicitud:</span>
                        <p className="text-gray-900 dark:text-white">
                          {solicitud?.fechaSolicitud ? 
                            new Date(solicitud.fechaSolicitud).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 'N/A'
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Razones predefinidas */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Selecciona una razón principal:
                    </label>
                    <div className="space-y-2">
                      {razonesPredefinidas.map((razon) => (
                        <label
                          key={razon.id}
                          className={`flex items-start gap-3 p-2 rounded-lg border-2 cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                            selectedReason === razon.id
                              ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                              : 'border-gray-200 dark:border-gray-600'
                          }`}
                        >
                          <input
                            type="radio"
                            name="reason"
                            value={razon.id}
                            checked={selectedReason === razon.id}
                            onChange={(e) => setSelectedReason(e.target.value)}
                            className="mt-1 text-red-600 focus:ring-red-500"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 dark:text-white text-sm">
                              {razon.label}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {razon.description}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Columna Derecha - Comentarios y Botones */}
                <div className="space-y-6">
                  {/* Campo de texto personalizado */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Comentarios adicionales (opcional):
                    </label>
                    <textarea
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                      placeholder="Describe aquí cualquier detalle adicional sobre el rechazo..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white resize-none"
                      rows={8}
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Botones */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || (!selectedReason && !motivo.trim())}
                      className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Rechazando...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Rechazar Solicitud
                        </>
                      )}
                    </button>
                  </div>
                 </div>
               </div>
             </form>
           </motion.div>
         </motion.div>
       )}
     </AnimatePresence>
   );
 };

export default RechazarSolicitudModal;
