import { useState, useCallback } from 'react'

export const useNotification = () => {
  const [notifications, setNotifications] = useState([])

  const showNotification = useCallback((
    message, 
    type = 'info',
    duration = 5000
  ) => {
    const id = Date.now().toString()
    const newNotification = {
      id,
      message,
      type,
      duration
    }

    setNotifications(prev => [...prev, newNotification])

    // Auto-remove notification after duration
    setTimeout(() => {
      removeNotification(id)
    }, duration)
  }, [])

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }, [])

  const clearAllNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  return {
    notifications,
    showNotification,
    removeNotification,
    clearAllNotifications
  }
} 