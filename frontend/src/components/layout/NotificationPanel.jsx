import React from 'react'
import NotificacionesTiempoReal from '../notificaciones/NotificacionesTiempoReal'

function NotificationsPanel({ isOpen, onClose, notifications }) {
  // Si no está abierto, solo mostrar el botón de notificaciones
  if (!isOpen) {
    return <NotificacionesTiempoReal />
  }

  // Si está abierto, mostrar el panel completo
  return (
    <div className="fixed top-16 right-4 z-50">
      <NotificacionesTiempoReal />
    </div>
  )
}

export default NotificationsPanel
