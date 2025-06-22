import { useState } from 'react'

// Componente para subir un certificado digital .p12
function CertificateUpload() {
  const [file, setFile] = useState(null)
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  
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
      } else {
        setError(result.error || 'Error al subir certificado')
        setMessage('')
      }
    } catch (err) {
      setError('Error al conectar con el servidor')
      console.error(err)
    }
  }

  return (
    <div className="max-w-lg mx-auto mt-12 p-6 bg-white shadow rounded">
      <h2 className="text-2xl font-bold mb-4">Subir Certificado</h2>

      {message && <p className="text-green-600 mb-3">{message}</p>}
      {error && <p className="text-red-600 mb-3">{error}</p>}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block mb-1 font-semibold">Archivo .p12</label>
          <input
            type="file"
            accept=".p12"
            onChange={(e) => setFile(e.target.files[0])}
            className="w-full border px-3 py-2 rounded"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1 font-semibold">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          />
        </div>

        <button type="submit" className="primary-button">
          Subir Certificado
        </button>
      </form>
    </div>
  )
}

export default CertificateUpload
