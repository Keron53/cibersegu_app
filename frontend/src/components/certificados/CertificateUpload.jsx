import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navigation from '../layout/Navigation'
import { useTheme } from '../../context/ThemeContext'
import { certificadoService } from '../../services/api'

// Icons
import { CloudArrowUpIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

// Componente para subir un certificado digital .p12
function CertificateUpload() {
  const [file, setFile] = useState(null)
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [showAccept, setShowAccept] = useState(false)
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  
    // Función que se ejecuta cuando el usuario envía el formulario
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Resetear mensajes previos
    setError('')
    setMessage('')
    
    // Validación básica: debe haber archivo y contraseña
    if (!file) {
      setError('Debes seleccionar un archivo de certificado (.p12)')
      return
    }
    
    if (!password) {
      setError('La contraseña es obligatoria')
      return
    }
    
    // Validar extensión del archivo
    if (!file.name.toLowerCase().endsWith('.p12')) {
      setError('El archivo debe tener extensión .p12')
      return
    }

    try {
      // Mostrar indicador de carga
      setLoading(true)
      
      // Crear objeto FormData para enviar el archivo y la contraseña
      const formData = new FormData()
      formData.append('file', file)
      formData.append('password', password)

      // Usar el servicio para subir el certificado
      const result = await certificadoService.subir(formData)

      // Éxito: mostrar mensaje y botón de aceptar
      setMessage('✅ ' + (result.message || 'Certificado subido correctamente'))
      setError('')
      setShowAccept(true)
      
      // Limpiar el formulario
      setPassword('')
      setFile(null)
      
      // Si hay un input de archivo, limpiar su valor
      const fileInput = document.querySelector('input[type="file"]')
      if (fileInput) fileInput.value = ''
      
    } catch (err) {
      console.error('Error al subir certificado:', err)
      
      // Manejar diferentes tipos de errores
      if (err.response) {
        // Intentar obtener el mensaje de error del backend
        const errorMessage = err.response.data?.error || 
                           err.response.data?.message || 
                           'Error al validar el certificado';
        
        // Mostrar el mensaje de error del backend
        setError(`❌ ${errorMessage}`);
        
        // Log detallado para depuración
        console.error('Error del backend al subir certificado:', {
          status: err.response.status,
          statusText: err.response.statusText,
          data: err.response.data,
          headers: err.response.headers
        });
      } else if (err.request) {
        // Error de conexión
        setError('No se pudo conectar con el servidor. Verifica tu conexión a internet.')
      } else {
        // Otros errores
        setError(err.message || 'Error al procesar el certificado')
      }
      
      setMessage('')
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = () => {
    // Resetear todo el estado antes de navegar
    setFile(null)
    setPassword('')
    setMessage('')
    setError('')
    setShowAccept(false)
    
    // Navegar al listado de certificados
    navigate('/mis-certificados')
  }

  // Dummy logout para Navigation
  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login', { replace: true })
  }

  // Estado para controlar la carga
  const [loading, setLoading] = useState(false)
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      <Navigation onLogout={handleLogout} />
      <div className="flex items-center justify-center min-h-[80vh] px-4">
        <div className="w-full max-w-md p-8 rounded-2xl shadow-2xl bg-white dark:bg-background-light border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col items-center mb-6">
            <div className="bg-primary/10 dark:bg-primary/20 rounded-full p-4 mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-primary dark:text-primary-light">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-primary dark:text-primary-light mb-1 text-center">Subir Certificado Digital</h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm text-center">Sube tu archivo .p12 protegido con contraseña para firmar documentos de forma segura.</p>
          </div>
          
          {/* Mensajes de estado */}
          {message && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-green-700 dark:text-green-300 text-sm font-medium">{message}</p>
            </div>
          )}
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-700 dark:text-red-300 text-sm font-medium">{error}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Archivo de certificado (.p12)
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="mt-1 flex items-center">
                <label className="flex-1 cursor-pointer">
                  <div className={`w-full px-4 py-10 border-2 border-dashed rounded-lg ${file ? 'border-green-500 bg-green-50 dark:bg-green-900/10' : 'border-gray-300 dark:border-gray-600 hover:border-primary/50 dark:hover:border-primary/50'} transition-colors duration-200 flex flex-col items-center justify-center`}>
                    {file ? (
                      <>
                        <CheckCircleIcon className="h-8 w-8 text-green-500 mb-2" />
                        <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">{file.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                      </>
                    ) : (
                      <>
                        <CloudArrowUpIcon className="h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          <span className="font-medium text-primary dark:text-primary-light">Haz clic para subir</span> o arrastra el archivo
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Solo archivos .p12 (hasta 5MB)</p>
                      </>
                    )}
                    <input
                      type="file"
                      accept=".p12"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </div>
                </label>
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contraseña del certificado
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative rounded-md shadow-sm">
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`block w-full px-4 py-2.5 text-gray-900 dark:text-white bg-white dark:bg-gray-800 border ${error.includes('contraseña') ? 'border-red-300 dark:border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-primary focus:border-primary'} rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-opacity-50 transition duration-150`}
                  placeholder="Ingresa la contraseña de tu certificado"
                  disabled={loading || showAccept}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                La contraseña es necesaria para verificar la validez del certificado.
              </p>
            </div>
            
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || showAccept || !file || !password}
                className={`w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${!file || !password || loading || showAccept ? 'bg-primary/70 cursor-not-allowed' : 'bg-primary hover:bg-primary-dark dark:bg-primary-light dark:hover:bg-primary'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-200`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Validando certificado...
                  </>
                ) : showAccept ? (
                  '¡Listo!'
                ) : (
                  'Validar y Subir Certificado'
                )}
              </button>
              
              <button
                type="button"
                onClick={() => navigate(-1)}
                disabled={loading}
                className="mt-3 w-full flex justify-center py-2.5 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
              >
                Cancelar
              </button>
            </div>
          </form>
          
          {/* Solo mostrar el botón de aceptar si la operación fue exitosa */}
          {showAccept && (
            <div className="mt-6">
              <button
                onClick={handleAccept}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
              >
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                Ir a mis certificados
              </button>
              
              <p className="mt-3 text-center text-sm text-gray-500 dark:text-gray-400">
                ¿Quieres subir otro certificado?{' '}
                <button 
                  type="button" 
                  onClick={() => {
                    setShowAccept(false)
                    setMessage('')
                  }}
                  className="font-medium text-primary hover:text-primary-dark dark:text-primary-light dark:hover:text-primary"
                >
                  Haz clic aquí
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CertificateUpload
