import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, FileText, Sun, Moon, Upload, Plus, List, User, Shield, Clock, Send, CheckCircle, Share2, Menu, X, Home } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext.jsx'

function Navigation({ onLogout }) {
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef(null)

  const menuItems = [
    {
      icon: <Home className="w-5 h-5" />,
      label: 'Inicio',
      path: '/home',
      color: 'text-primary dark:text-primary-light'
    },
    {
      icon: <Upload className="w-5 h-5" />,
      label: 'Subir Certificado',
      path: '/certificado',
      color: 'text-blue-600 dark:text-blue-400'
    },
    {
      icon: <Plus className="w-5 h-5" />,
      label: 'Generar Certificado',
      path: '/generar-certificado',
      color: 'text-green-600 dark:text-green-400'
    },
    {
      icon: <List className="w-5 h-5" />,
      label: 'Ver Certificados',
      path: '/mis-certificados',
      color: 'text-secondary dark:text-secondary-light'
    },
    {
      icon: <Shield className="w-5 h-5" />,
      label: 'Validar PDF',
      path: '/validar-pdf',
      color: 'text-orange-600 dark:text-orange-400'
    },
    {
      icon: <Clock className="w-5 h-5" />,
      label: 'Solicitudes Pendientes',
      path: '/solicitudes-pendientes',
      color: 'text-yellow-600 dark:text-yellow-400'
    },
    {
      icon: <CheckCircle className="w-5 h-5" />,
      label: 'Documentos Firmados',
      path: '/documentos-firmados',
      color: 'text-green-600 dark:text-green-400'
    },
    {
      icon: <Share2 className="w-5 h-5" />,
      label: 'Documentos Compartidos',
      path: '/documentos-compartidos',
      color: 'text-secondary dark:text-secondary-light'
    },
    {
      icon: <User className="w-5 h-5" />,
      label: 'Mi Perfil',
      path: '/perfil',
      color: 'text-gray-600 dark:text-gray-400'
    }
  ]

  const handleMenuItemClick = (path) => {
    navigate(path)
    setIsMenuOpen(false)
  }

  // Cerrar menú cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false)
      }
    }

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMenuOpen])

  return (
    <nav className="bg-white dark:bg-background border-b border-gray-200 dark:border-gray-700 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <button
                onClick={() => navigate('/home')}
                className="flex items-center hover:opacity-80 transition-opacity cursor-pointer"
              >
                <FileText className="h-8 w-8 text-primary" />
                <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">Digital Sign</span>
              </button>
            </div>
          </div>
          
          {/* Botón de menú hamburguesa */}
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-background transition-colors"
              title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`p-2 rounded-lg transition-colors ${
                isMenuOpen 
                  ? 'text-primary dark:text-primary-light bg-primary/10 dark:bg-primary/20' 
                  : 'text-gray-500 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light hover:bg-primary/10 dark:hover:bg-primary/20'
              }`}
              title="Menú"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Overlay para cerrar menú */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
      
      {/* Menú lateral */}
      <div 
        ref={menuRef} 
        className={`fixed top-0 right-0 h-full w-80 bg-white dark:bg-background border-l border-gray-200 dark:border-gray-700 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header del menú */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-gray-900 dark:text-white text-xl font-semibold">Menú</h2>
          <button
            onClick={() => setIsMenuOpen(false)}
            className="text-gray-500 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Contenido del menú */}
        <div className="p-4">
          <div className="space-y-1">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={() => handleMenuItemClick(item.path)}
                className="w-full flex items-center space-x-4 p-4 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-all duration-200 group"
              >
                <div className={`${item.color} group-hover:scale-110 transition-transform`}>
                  {item.icon}
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-primary dark:group-hover:text-primary-light transition-colors">
                  {item.label}
                </span>
              </button>
            ))}
            
            {/* Separador */}
            <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>
            
            {/* Cerrar Sesión */}
            <button
              onClick={() => {
                onLogout()
                setIsMenuOpen(false)
              }}
              className="w-full flex items-center space-x-4 p-4 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 group"
            >
              <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium group-hover:text-red-700 dark:group-hover:text-red-300 transition-colors">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navigation 