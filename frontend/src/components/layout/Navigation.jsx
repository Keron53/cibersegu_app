import React from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, FileText, Sun, Moon, Upload, Plus, List, User, Shield, Clock, Send } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext.jsx'

function Navigation({ onLogout }) {
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  return (
    <nav className="bg-white dark:bg-background border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
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
          
          <div className="hidden md:flex items-center space-x-3">
            <button
              onClick={() => navigate('/certificado')}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Upload className="w-4 h-4 mr-2" />
              Subir Certificado
            </button>
            
            <button
              onClick={() => navigate('/generar-certificado')}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Generar Certificado
            </button>
            
            <button
              onClick={() => navigate('/mis-certificados')}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <List className="w-4 h-4 mr-2" />
              Ver Certificados
            </button>
            
            <button
              onClick={() => navigate('/validar-pdf')}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Shield className="w-4 h-4 mr-2" />
              Validar PDF
            </button>
            
            {/* NUEVOS ENLACES PARA SOLICITUDES DE FIRMA */}
            <button
              onClick={() => navigate('/solicitudes-pendientes')}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Clock className="w-4 h-4 mr-2" />
              Solicitudes Pendientes
            </button>
            
            <button
              onClick={() => navigate('/perfil')}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <User className="w-4 h-4 mr-2" />
              Mi Perfil
            </button>
            
            <button
              onClick={onLogout}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </button>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-background transition-colors"
              title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navigation 