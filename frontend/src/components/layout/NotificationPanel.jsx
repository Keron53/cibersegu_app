import React, { useEffect, useRef } from 'react'
const WS_URL = import.meta.env.VITE_WS_URL || window.location.origin;

function NotificationsPanel({ isOpen, onClose, notifications }) {
  const panelRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (panelRef.current && !panelRef.current.contains(event.target)) onClose()
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside)
    console.log(notifications);
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  if (!isOpen) return null


  return (
    <div ref={panelRef} className="fixed top-16 right-4 w-80 max-h-96 bg-white dark:bg-background border ... overflow-y-auto z-50">
      <div className="p-4 border-b font-semibold text-gray-900 dark:text-white">Notificaciones</div>

      {notifications.length === 0 ? (
        <div className="p-4 text-gray-500 dark:text-gray-400 text-center">No tienes notificaciones</div>
      ) : (
        <ul>
          {notifications.map((n, i) => (
            <li key={i} className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer border-b">
              <p className="text-sm text-gray-800 dark:text-gray-200">{'Tienes una nueva solicitud de firma'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{`${n.solicitanteNombre} Necesita una firma tuya`}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{n.mensaje}</p>
              <a className="text-xs text-gray-500 dark:text-gray-400"
                href={`${WS_URL}/firmar-documento/${n._id}`}
                target="_blank"
                rel="noopener noreferrer"
              >{`${WS_URL}/firmar-documento/${n._id}`}</a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default NotificationsPanel
