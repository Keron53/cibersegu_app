import axios from 'axios'
import notificationService from './notificationService'

const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL)
  ? import.meta.env.VITE_API_URL
  : '/api'

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
    console.log('🔐 Axios interceptor - Token encontrado:', token ? `${token.substring(0, 10)}...` : 'null');
    
    if (token && token !== 'null' && token !== 'undefined') {
      config.headers.Authorization = `Bearer ${token}`
      console.log('🔐 Axios interceptor - Authorization header configurado');
    } else {
      console.warn('⚠️ Axios interceptor - No hay token válido en localStorage');
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
      
      // Limpiar notificaciones del usuario
      notificationService.clearPreviousUserNotifications()
      
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

  async verificarEmail(verificationData) {
    const response = await axios.post(`${API_BASE_URL}/usuarios/verificar-email`, verificationData)
    return response.data
  },

  async reenviarCodigo(emailData) {
    const response = await axios.post(`${API_BASE_URL}/usuarios/reenviar-codigo`, emailData)
    return response.data
  },

  async logout() {
    const response = await axios.post(`${API_BASE_URL}/usuarios/logout`)
    return response.data
  },

  async obtenerPerfil() {
    const response = await axios.get(`${API_BASE_URL}/usuarios/perfil`)
    return response.data
  },

  async actualizarPerfil(userData) {
    const response = await axios.put(`${API_BASE_URL}/usuarios/perfil`, userData)
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
    if (!checkToken()) return []
    const token = localStorage.getItem('token')
    const response = await axios.get(`${API_BASE_URL}/documentos`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    return response.data
  },

  async listarFirmados() {
    if (!checkToken()) return []
    const token = localStorage.getItem('token')
    const response = await axios.get(`${API_BASE_URL}/documentos/firmados`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    return response.data
  },

  async listarCompartidos() {
    if (!checkToken()) return []
    const token = localStorage.getItem('token')
    const response = await axios.get(`${API_BASE_URL}/documentos/compartidos`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    return response.data
  },

  async ver(id) {
    if (!checkToken()) return
    const token = localStorage.getItem('token')
    console.log('🔍 documentoService.ver() - Token:', token ? `${token.substring(0, 10)}...` : 'null');
    console.log('🔍 documentoService.ver() - URL:', `${API_BASE_URL}/documentos/${id}`);
    
    const response = await axios.get(`${API_BASE_URL}/documentos/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      responseType: 'blob'
    })
    return response.data
  },

  async eliminar(id) {
    if (!checkToken()) return
    const token = localStorage.getItem('token')
    const response = await axios.delete(`${API_BASE_URL}/documentos/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    return response.data
  },

  async firmar(id, signatureInfo) {
    if (!checkToken()) return
    const token = localStorage.getItem('token')
    const response = await axios.post(`${API_BASE_URL}/documentos/${id}/firmar`, signatureInfo, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
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
    formData.append('canvasWidth', canvasWidth);   // <--- Agrega esto
    formData.append('canvasHeight', canvasHeight); // <--- Y esto
    formData.append('qrSize', qrSize)
    const response = await axios.post(`${API_BASE_URL}/documentos/firmar-qr-node`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      responseType: 'blob'
    })
    return response.data
  },

  async firmarDocumento(documentoId, certificadoId, password, nombre, organizacion, email, x, y, page) {
    if (!checkToken()) return
    const token = localStorage.getItem('token')
    const response = await axios.post(`${API_BASE_URL}/documentos/${documentoId}/firmar`, {
      certificadoId,
      password,
      nombre,
      organizacion,
      email,
      x,
      y,
      page
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    return response.data
  },

  async infoDocumento(id) {
    if (!checkToken()) return
    const token = localStorage.getItem('token')
    const response = await axios.get(`${API_BASE_URL}/documentos/${id}/info`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
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
    const token = localStorage.getItem('token')
    const response = await axios.post(`${API_BASE_URL}/certificados/generar`, certificateData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    return response.data
  },

  async listar() {
    if (!checkToken()) return []
    const token = localStorage.getItem('token')
    const response = await axios.get(`${API_BASE_URL}/certificados`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    return response.data
  },

  async descargar(id, password) {
    const token = localStorage.getItem('token')
    const response = await axios.post(`${API_BASE_URL}/certificados/${id}/descargar`, { password }, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      responseType: 'blob'
    })
    return response.data
  },

  async eliminar(id) {
    const token = localStorage.getItem('token')
    const response = await axios.delete(`${API_BASE_URL}/certificados/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    return response.data
  }
}