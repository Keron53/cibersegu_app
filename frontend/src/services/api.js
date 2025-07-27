import axios from 'axios'

const API_BASE_URL = 'http://localhost:3001/api'

// Función para verificar si el token está activo
const checkToken = () => {
  const token = localStorage.getItem('token')
  if (!token) {
    console.log('🔐 No hay token, abortando petición protegida...')
    return false
  }
  return true
}

// Configurar axios con interceptores para manejar tokens
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Variable global para el callback de sesión expirada
let sessionExpiredCallback = null

// Función para establecer el callback de sesión expirada
export const setSessionExpiredCallback = (callback) => {
  sessionExpiredCallback = callback
}

// Interceptor de respuesta para manejar errores de autenticación
axios.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      console.log('🔐 Token expirado, mostrando modal...')
      
      // Limpiar datos de sesión
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('userData')
      
      // Mostrar modal si hay callback disponible
      if (sessionExpiredCallback) {
        sessionExpiredCallback()
      } else {
        // Fallback: redirigir directamente
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// Servicios de autenticación
export const authService = {
  async login(credentials) {
    const response = await axios.post(`${API_BASE_URL}/usuarios/login`, credentials)
    return response.data
  },

  async register(userData) {
    const response = await axios.post(`${API_BASE_URL}/usuarios/registro`, userData)
    return response.data
  },

  async logout() {
    const response = await axios.post(`${API_BASE_URL}/usuarios/logout`)
    return response.data
  }
}

// Servicios de documentos
export const documentoService = {
  async subir(formData) {
    if (!checkToken()) return
    const response = await axios.post(`${API_BASE_URL}/documentos/subir`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },

  async listar() {
    if (!checkToken()) return
    const response = await axios.get(`${API_BASE_URL}/documentos`)
    return response.data
  },

  async ver(id) {
    if (!checkToken()) return
    const response = await axios.get(`${API_BASE_URL}/documentos/${id}`, {
      responseType: 'blob'
    })
    return response.data
  },

  async eliminar(id) {
    if (!checkToken()) return
    const response = await axios.delete(`${API_BASE_URL}/documentos/${id}`)
    return response.data
  },

  async firmar(id, signatureInfo) {
    if (!checkToken()) return
    const response = await axios.post(`${API_BASE_URL}/documentos/${id}/firmar`, signatureInfo)
    return response.data
  },

  async firmarNode(pdfFile, certFile, password) {
    if (!checkToken()) return
    const formData = new FormData()
    formData.append('pdf', pdfFile)
    formData.append('cert', certFile)
    formData.append('password', password)
    const response = await axios.post(`${API_BASE_URL}/documentos/firmar-node`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      responseType: 'blob'
    })
    return response.data
  },

  async firmarQRNode(pdfFile, certFile, password, nombre, correo, organizacion, x, y, page, canvasWidth, canvasHeight, qrSize) {
    if (!checkToken()) return
    const formData = new FormData()
    formData.append('pdf', pdfFile)
    formData.append('cert', certFile)
    formData.append('password', password)
    formData.append('nombre', nombre)
    formData.append('correo', correo)
    formData.append('organizacion', organizacion)
    formData.append('x', x)
    formData.append('y', y)
    formData.append('page', page)
    formData.append('canvasWidth', canvasWidth)
    formData.append('canvasHeight', canvasHeight)
    formData.append('qrSize', qrSize)
    const response = await axios.post(`${API_BASE_URL}/documentos/firmar-qr-node`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      responseType: 'blob'
    })
    return response.data
  },

  async infoDocumento(id) {
    if (!checkToken()) return
    const response = await axios.get(`${API_BASE_URL}/documentos/${id}/info`)
    return response.data
  }
}

// Servicios de certificados
export const certificadoService = {
  async subir(formData) {
    const token = localStorage.getItem('token')
    
    const response = await axios.post(`${API_BASE_URL}/certificados/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      }
    })
    return response.data
  },

  async generar(certificateData) {
    const response = await axios.post(`${API_BASE_URL}/certificados/generar`, certificateData)
    return response.data
  },

  async listar() {
    const response = await axios.get(`${API_BASE_URL}/certificados`)
    return response.data
  },

  async descargar(id, password) {
    const response = await axios.post(`${API_BASE_URL}/certificados/${id}/descargar`, { password }, {
      responseType: 'blob'
    })
    return response.data
  },

  async eliminar(id) {
    const response = await axios.delete(`${API_BASE_URL}/certificados/${id}`)
    return response.data
  }
} 