import React, { createContext, useContext, useState } from 'react'

export const SessionContext = createContext() // <-- Agrega esta línea

export const useSession = () => {
  const context = useContext(SessionContext)
  if (!context) {
    throw new Error('useSession debe ser usado dentro de un SessionProvider')
  }
  return context
}

export const SessionProvider = ({ children }) => {
  const [isSessionExpired, setIsSessionExpired] = useState(false)

  const showSessionExpiredModal = () => {
    setIsSessionExpired(true)
  }

  const hideSessionExpiredModal = () => {
    setIsSessionExpired(false)
  }

  const value = {
    isSessionExpired,
    showSessionExpiredModal,
    hideSessionExpiredModal
  }

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  )
}