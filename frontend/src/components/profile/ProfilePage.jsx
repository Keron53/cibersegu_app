import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { User, Mail, Calendar, Shield, Edit, Save, X } from 'lucide-react'
import Navigation from '../layout/Navigation.jsx'

function ProfilePage() {
  const navigate = useNavigate()
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editedData, setEditedData] = useState({})
  const [notification, setNotification] = useState(null)

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      setLoading(true)
      // Obtener datos del usuario desde localStorage o API
      const storedUser = localStorage.getItem('userData')
      if (storedUser) {
        const user = JSON.parse(storedUser)
        setUserData(user)
        setEditedData({
          nombre: user.nombre || '',
          email: user.email || '',
          organizacion: user.organizacion || '',
          telefono: user.telefono || ''
        })
      } else {
        // Si no hay datos en localStorage, intentar obtenerlos de la API
        try {
          const { authService } = await import('../../services/api')
          const userData = await authService.obtenerPerfil()
          setUserData(userData)
          setEditedData({
            nombre: userData.nombre || '',
            email: userData.email || '',
            organizacion: userData.organizacion || '',
            telefono: userData.telefono || ''
          })
          localStorage.setItem('userData', JSON.stringify(userData))
        } catch (apiError) {
          console.error('Error al obtener datos de la API:', apiError)
          showNotification('Error al cargar datos del usuario', 'error')
        }
      }
    } catch (error) {
      console.error('Error al cargar datos del usuario:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    showNotification('¡Sesión cerrada exitosamente!', 'success')
    localStorage.removeItem('token')
    localStorage.removeItem('userData')

    setTimeout(() => {
      navigate('/login', { replace: true })
    }, 1500)
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditedData({
      nombre: userData.nombre || '',
      email: userData.email || '',
      organizacion: userData.organizacion || '',
      telefono: userData.telefono || ''
    })
  }

  const handleSave = async () => {
    try {
      const { authService } = await import('../../services/api')
      const updatedUser = await authService.actualizarPerfil(editedData)
      
      setUserData(updatedUser.usuario)
      localStorage.setItem('userData', JSON.stringify(updatedUser.usuario))
      setIsEditing(false)
      showNotification('Perfil actualizado correctamente', 'success')
    } catch (error) {
      console.error('Error al actualizar perfil:', error)
      const errorMsg = error.response?.data?.mensaje || error.response?.data?.error || 'Error al actualizar el perfil'
      showNotification(errorMsg, 'error')
    }
  }

  const handleInputChange = (field, value) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const showNotification = (message, type) => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 4000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-background">
        <Navigation onLogout={handleLogout} />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      <Navigation onLogout={handleLogout} />

      {notification && (
        <div className={`fixed top-20 right-4 z-50 p-4 rounded-lg shadow-lg ${
          notification.type === 'success' 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          {notification.message}
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-background-light rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Mi Perfil
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300">
                    Gestiona tu información personal
                  </p>
                </div>
              </div>
              
              {!isEditing ? (
                <button
                  onClick={handleEdit}
                  className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark dark:bg-primary-light dark:hover:bg-primary transition-colors"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar Perfil
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={handleSave}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Guardar
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Información Personal */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <User className="w-5 h-5 mr-2 text-primary" />
                  Información Personal
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nombre Completo
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedData.nombre}
                        onChange={(e) => handleInputChange('nombre', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    ) : (
                      <p className="text-gray-900 dark:text-white font-medium">
                        {userData?.nombre || 'No especificado'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Correo Electrónico
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={editedData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    ) : (
                      <p className="text-gray-900 dark:text-white font-medium">
                        {userData?.email || 'No especificado'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Organización
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedData.organizacion}
                        onChange={(e) => handleInputChange('organizacion', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    ) : (
                      <p className="text-gray-900 dark:text-white font-medium">
                        {userData?.organizacion || 'No especificado'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Teléfono
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={editedData.telefono}
                        onChange={(e) => handleInputChange('telefono', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    ) : (
                      <p className="text-gray-900 dark:text-white font-medium">
                        {userData?.telefono || 'No especificado'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Información de Cuenta */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-primary" />
                  Información de Cuenta
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nombre de Usuario
                    </label>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {userData?.username || 'No especificado'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Fecha de Registro
                    </label>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {userData?.createdAt 
                        ? new Date(userData.createdAt).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        : 'No especificado'
                      }
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Estado de la Cuenta
                    </label>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Activa
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default ProfilePage 