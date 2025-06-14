import axios from 'axios'

// Crear una instancia de axios con la configuración base
const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interceptor para agregar el token a las peticiones
api.interceptors.request.use(
  (config) => {
    // No añadir token a las rutas de autenticación
    if (!config.url.includes('/auth/login') && !config.url.includes('/auth/register')) {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Servicios de autenticación
export const authService = {
  // Registro de usuario
  register: async (userData) => {
    try {
      const response = await api.post('/usuarios/registro', userData)
      return response.data
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al registrar usuario'
      throw { message: errorMessage }
    }
  },

  // Inicio de sesión
  login: async (credentials) => {
    try {
      const response = await api.post('/usuarios/login', credentials)
      return response.data
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al iniciar sesión'
      throw { message: errorMessage }
    }
  },

  // Cerrar sesión
  logout: () => {
    localStorage.removeItem('token')
  },

  // Obtener perfil del usuario
  getProfile: async () => {
    try {
      const response = await api.get('/usuarios')
      return response.data
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al obtener perfil'
      throw { message: errorMessage }
    }
  },

  // Verificar si el usuario está autenticado
  isAuthenticated: () => {
    return !!localStorage.getItem('token')
  }
}

// Servicios de documentos
export const documentoService = {
  // Subir documento
  subir: async (file) => {
    try {
      const formData = new FormData()
      formData.append('pdf', file)
      
      const response = await api.post('/documentos/subir', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      return response.data
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al subir el documento'
      throw { message: errorMessage }
    }
  },

  // Listar documentos
  listar: async () => {
    try {
      const response = await api.get('/documentos')
      return response.data
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al obtener documentos'
      throw { message: errorMessage }
    }
  },

  // Ver documento
  ver: async (id) => {
    try {
      const response = await api.get(`/documentos/${id}`, {
        responseType: 'blob'
      })
      return response.data
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al visualizar el documento'
      throw { message: errorMessage }
    }
  },

  // Eliminar documento
  eliminar: async (id) => {
    try {
      const response = await api.delete(`/documentos/${id}`)
      return response.data
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al eliminar el documento'
      throw { message: errorMessage }
    }
  }
}

export default api 