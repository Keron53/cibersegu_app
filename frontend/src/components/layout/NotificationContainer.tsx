import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Notification from './Notification'

interface NotificationContainerProps {
  notifications: Array<{
    id: string
    message: string
    type: 'success' | 'error' | 'warning' | 'info'
    duration?: number
  }>
  onRemove: (id: string) => void
}

const NotificationContainer: React.FC<NotificationContainerProps> = ({ 
  notifications, 
  onRemove 
}) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {notifications.map((notification, index) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            transition={{ 
              duration: 0.3, 
              ease: 'easeOut',
              delay: index * 0.1 
            }}
          >
            <Notification
              message={notification.message}
              type={notification.type}
              duration={notification.duration}
              onClose={() => onRemove(notification.id)}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export default NotificationContainer 