import axios from 'axios'

const API_URL = 'http://localhost:3001/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interceptor para agregar el token a las peticiones
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Servicio de autenticación
export const authService = {
  login: async (username: string, password: string) => {
    const response = await api.post('/usuarios/login', { username, password })
    return response.data
  },

  register: async (username: string, password: string) => {
    const response = await api.post('/usuarios/registro', { username, password })
    return response.data
  }
}

// Servicio de documentos
export const documentoService = {
  listar: async () => {
    const response = await api.get('/documentos')
    return response.data
  },

  subir: async (formData: FormData) => {
    const response = await api.post('/documentos/subir', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },

  ver: async (id: string) => {
    const response = await api.get(`/documentos/${id}`, {
      responseType: 'blob'
    })
    return response.data
  },

  eliminar: async (id: string) => {
    const response = await api.delete(`/documentos/${id}`)
    return response.data
  }
}

export default api 