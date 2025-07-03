import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navigation from '../layout/Navigation'
import { useTheme } from '../../context/ThemeContext'

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
       e.preventDefault() // Evita el comportamiento por defecto del formulario
   
   // Validación básica: debe haber archivo y contraseña
       if (!file || !password) {
      setError('Debes seleccionar un archivo y escribir tu contraseña')
      return
    }

    try {
            // Creamos un objeto FormData para enviar el archivo y la contraseña al backend
      const formData = new FormData()
      formData.append('file', file)
      formData.append('password', password)

      const token = localStorage.getItem('token')

            // Enviamos la solicitud POST al backend con el archivo y la contraseña
      const res = await fetch('http://localhost:3001/api/certificados/upload', {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      //Procesamos la respuesta
      const result = await res.json()
      if (res.ok) {
        setMessage(result.message)
        setError('')
        setShowAccept(true)
      } else {
        setError(result.error || 'Error al subir certificado')
        setMessage('')
      }
    } catch (err) {
      setError('Error al conectar con el servidor')
      console.error(err)
    }
  }

  const handleAccept = () => {
    navigate('/home')
  }

  // Dummy logout para Navigation
  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      <Navigation onLogout={handleLogout} />
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="w-full max-w-md p-8 rounded-2xl shadow-2xl bg-white dark:bg-background-light border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col items-center mb-6">
            <div className="bg-primary/10 dark:bg-primary/20 rounded-full p-4 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#3B4CCA" className="w-10 h-10 dark:stroke-primary-light">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 17v-6m0 0V7m0 4h4m-4 0H8m12 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-3xl font-extrabold text-primary dark:text-primary-light mb-1">Subir Certificado</h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm">Carga tu archivo .p12 y tu contraseña para proteger tu identidad digital.</p>
          </div>
          {message && <p className="text-green-600 dark:text-green-400 mb-3 text-center font-semibold animate-fade-in-up">{message}</p>}
          {error && <p className="text-red-600 dark:text-red-400 mb-3 text-center font-semibold animate-fade-in-up">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block mb-2 text-sm font-medium text-primary dark:text-primary-light">Archivo .p12</label>
              <input
                type="file"
                accept=".p12"
                onChange={(e) => setFile(e.target.files[0])}
                className="block w-full text-sm text-gray-700 dark:text-gray-200 border border-primary/30 dark:border-primary/40 rounded-lg cursor-pointer bg-indigo-50 dark:bg-background-light focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-primary dark:text-primary-light">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-4 py-2 text-gray-700 dark:text-gray-200 bg-indigo-50 dark:bg-background-light border border-primary/30 dark:border-primary/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Introduce tu contraseña"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 px-4 bg-primary hover:bg-primary-dark dark:bg-primary-light dark:hover:bg-primary text-white font-bold rounded-lg shadow transition duration-200"
              disabled={showAccept}
            >
              Subir Certificado
            </button>
          </form>
          {showAccept && (
            <button
              onClick={handleAccept}
              className="w-full mt-6 py-2 px-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg shadow transition duration-200 animate-fade-in-up"
            >
              Aceptar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default CertificateUpload
