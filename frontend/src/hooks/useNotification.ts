import { useState, useCallback } from 'react'

interface Notification {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

export const useNotification = () => {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const showNotification = useCallback((
    message: string, 
    type: 'success' | 'error' | 'warning' | 'info' = 'info',
    duration: number = 5000
  ) => {
    const id = Date.now().toString()
    const newNotification: Notification = {
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

  const removeNotification = useCallback((id: string) => {
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