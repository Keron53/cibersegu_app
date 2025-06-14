import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react'

interface NotificationProps {
  message: string
  type: 'success' | 'error' | 'warning'
  onClose: () => void
}

function Notification({ message, type, onClose }: NotificationProps) {
  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle
  }

  const colors = {
    success: 'bg-green-50 dark:bg-green-800/20 border-green-200 dark:border-green-700 text-green-800 dark:text-green-400',
    error: 'bg-red-50 dark:bg-red-800/20 border-red-200 dark:border-red-700 text-red-800 dark:text-red-400',
    warning: 'bg-yellow-50 dark:bg-yellow-800/20 border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-400'
  }

  const iconColors = {
    success: 'text-green-500 dark:text-green-400',
    error: 'text-red-500 dark:text-red-400',
    warning: 'text-yellow-500 dark:text-yellow-400'
  }

  const Icon = icons[type]

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -50, scale: 0.95 }}
        className={`fixed top-4 right-4 z-50 max-w-sm w-full border rounded-lg p-4 shadow-lg ${colors[type]}`}
      >
        <div className="flex items-start">
          <Icon className={`w-5 h-5 mr-3 mt-0.5 ${iconColors[type]}`} />
          <div className="flex-1">
            <p className="text-sm font-medium">{message}</p>
          </div>
          <button
            onClick={onClose}
            className={`ml-3 text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 transition-colors`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export default Notification