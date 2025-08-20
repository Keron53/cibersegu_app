# 🎨 Cibersegu Frontend - Sistema de Firmas Electrónicas

## 📋 Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Arquitectura del Frontend](#arquitectura-del-frontend)
- [Tecnologías Utilizadas](#tecnologías-utilizadas)
- [Instalación y Configuración](#instalación-y-configuración)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Componentes](#componentes)
- [Páginas](#páginas)
- [Servicios](#servicios)
- [Context y Hooks](#context-y-hooks)
- [Configuración](#configuración)
- [Rutas](#rutas)
- [Estilos y UI](#estilos-y-ui)
- [WebSockets](#websockets)
- [Despliegue](#despliegue)
- [Desarrollo](#desarrollo)
- [Troubleshooting](#troubleshooting)

## 🎯 Descripción General

Cibersegu Frontend es una aplicación web moderna y responsiva que proporciona una interfaz de usuario intuitiva para el sistema de firmas electrónicas. Características principales:

- **Interfaz Moderna**: Diseño responsive con Tailwind CSS y Framer Motion
- **Firmas Digitales**: Visualización y selección de posiciones en PDFs
- **Solicitudes Múltiples**: Gestión de solicitudes para hasta 5 firmantes
- **Notificaciones en Tiempo Real**: WebSockets para actualizaciones instantáneas
- **Autenticación Multi-factor**: Email, WhatsApp y verificación de identidad
- **Modo Oscuro**: Soporte completo para tema oscuro/claro
- **Validación de Documentos**: Interfaz para verificar integridad de PDFs

## 🏗️ Arquitectura del Frontend

```
┌─────────────────────────────────────────────────────────────┐
│                    Cibersegu Frontend                      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Pages     │  │ Components  │  │   Services  │        │
│  │             │  │             │  │             │        │
│  │ • Login     │  │ • Auth      │  │ • API       │        │
│  │ • Register  │  │ • Layout    │  │ • WebSocket │        │
│  │ • Home      │  │ • Documents │  │ • Notifications│      │
│  │ • Profile   │  │ • Validation│  │             │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Context   │  │    Hooks    │  │    Config   │        │
│  │             │  │             │  │             │        │
│  │ • Auth      │  │ • useNotification│ • WebSocket│        │
│  │ • Session   │  │             │  │ • API URLs  │        │
│  │ • Theme     │  │             │  │             │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
├─────────────────────────────────────────────────────────────┤
│                    React Router DOM                        │
├─────────────────────────────────────────────────────────────┤
│                    Vite + React                            │
└─────────────────────────────────────────────────────────────┘
```

## 🛠️ Tecnologías Utilizadas

### Core Framework
- **React** (v18.3.1) - Biblioteca de interfaz de usuario
- **React Router DOM** (v7.6.1) - Enrutamiento de la aplicación
- **Vite** (v6.3.5) - Build tool y servidor de desarrollo

### UI y Estilos
- **Tailwind CSS** (v3.4.1) - Framework de CSS utility-first
- **Framer Motion** (v11.1.12) - Animaciones y transiciones
- **Lucide React** (v0.515.0) - Iconos modernos
- **Heroicons** (v2.1.1) - Iconos adicionales

### Manejo de PDFs
- **PDF.js** (v5.3.93) - Renderizado y manipulación de PDFs
- **QRCode** (v1.5.4) - Generación de códigos QR
- **React Signature Canvas** (v1.0.6) - Canvas para firmas

### Comunicación
- **Axios** (v1.9.0) - Cliente HTTP para API calls
- **Socket.io Client** (v4.7.2) - Cliente WebSocket

### Desarrollo
- **ESLint** (v9.9.1) - Linting de código
- **PostCSS** (v8.4.35) - Procesamiento de CSS
- **Autoprefixer** (v10.4.17) - Prefijos CSS automáticos

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js v18 o superior
- npm o yarn
- Backend corriendo en puerto 3001
- WebSocket server corriendo en puerto 3000

### Instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd cibersegu_app/frontend
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
# Crear archivo .env si es necesario
cp .env.example .env
```

4. **Iniciar servidor de desarrollo**
```bash
npm run dev
```

5. **Abrir en navegador**
```
http://localhost:5173
```

## 📁 Estructura del Proyecto

```
frontend/
├── public/                     # Archivos estáticos
├── src/
│   ├── components/             # Componentes reutilizables
│   │   ├── auth/              # Componentes de autenticación
│   │   │   ├── LoginForm.jsx
│   │   │   ├── RegisterForm.jsx
│   │   │   ├── EmailVerification.jsx
│   │   │   └── ...
│   │   ├── documentos/        # Componentes de documentos
│   │   │   ├── PDFViewerFirma.jsx
│   │   │   ├── PositionSelector.jsx
│   │   │   ├── DocumentList.jsx
│   │   │   └── ...
│   │   ├── certificados/      # Componentes de certificados
│   │   ├── validacion/        # Componentes de validación
│   │   ├── notificaciones/    # Componentes de notificaciones
│   │   ├── layout/            # Componentes de layout
│   │   ├── home/              # Componentes de página principal
│   │   ├── login/             # Componentes de login
│   │   ├── register/          # Componentes de registro
│   │   └── profile/           # Componentes de perfil
│   ├── pages/                 # Páginas principales
│   │   └── FirmarDocumento.jsx
│   ├── services/              # Servicios y API
│   │   ├── api.js
│   │   ├── notificationService.js
│   │   └── clientSocket.js
│   ├── context/               # Context de React
│   │   ├── AuthContext.js
│   │   ├── SessionContext.jsx
│   │   └── ThemeContext.jsx
│   ├── hooks/                 # Custom hooks
│   │   └── useNotification.js
│   ├── config/                # Configuraciones
│   │   └── websocket.js
│   ├── App.jsx                # Componente principal
│   ├── main.jsx               # Punto de entrada
│   └── index.css              # Estilos globales
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

## 🧩 Componentes

### 🔐 Autenticación (`components/auth/`)

#### LoginForm.jsx
Formulario de inicio de sesión con validación y manejo de errores.

**Props:**
```javascript
{
  onLogin: (credentials) => void,
  isLoading: boolean,
  error: string
}
```

**Características:**
- Validación de campos en tiempo real
- Manejo de errores de autenticación
- Integración con WhatsApp
- Recuperación de contraseña

#### RegisterForm.jsx
Formulario de registro con múltiples métodos de verificación.

**Props:**
```javascript
{
  onRegister: (userData) => void,
  isLoading: boolean,
  error: string
}
```

**Características:**
- Registro por email o WhatsApp
- Verificación de disponibilidad de username/email
- Política de contraseñas
- Validación de fuerza de contraseña

#### EmailVerification.jsx
Componente para verificación de email.

**Props:**
```javascript
{
  email: string,
  onVerificationComplete: () => void,
  onResendCode: () => void
}
```

### 📄 Documentos (`components/documentos/`)

#### PDFViewerFirma.jsx
Visor de PDF con funcionalidad de selección de posición de firma.

**Props:**
```javascript
{
  documento: Object,
  onPositionSelected: (position) => void,
  onClose: () => void,
  firmanteSeleccionandoPosicion: Object
}
```

**Características:**
- Renderizado de PDF con PDF.js
- Selección precisa de posición de firma
- Zoom y navegación de páginas
- Visualización de firmas existentes
- Coordenadas precisas para firmas

#### PositionSelector.jsx
Modal para selección de posición de firma en solicitudes múltiples.

**Props:**
```javascript
{
  documento: Object,
  firmante: Object,
  firmantesExistentes: Array,
  isOpen: boolean,
  onClose: () => void,
  onPositionSelected: (position) => void
}
```

**Características:**
- Modal responsivo
- Visualización de posiciones existentes
- Selección drag-and-drop precisa
- Colores diferenciados por firmante

#### DocumentList.jsx
Lista de documentos con funcionalidades de gestión.

**Props:**
```javascript
{
  documentos: Array,
  onDocumentSelect: (documento) => void,
  onDelete: (documentoId) => void,
  isLoading: boolean
}
```

**Características:**
- Vista de tarjetas y lista
- Filtros por tipo y estado
- Búsqueda en tiempo real
- Acciones rápidas (firmar, descargar, eliminar)

#### SolicitarFirma.jsx
Componente para crear solicitudes de firma individual.

**Props:**
```javascript
{
  documento: Object,
  onSolicitudCreated: (solicitud) => void,
  onCancel: () => void
}
```

**Características:**
- Selección de firmantes
- Personalización de mensaje
- Configuración de fecha de expiración
- Posicionamiento de firma

#### CrearSolicitudMultiple.jsx
Componente para crear solicitudes de firma múltiple.

**Props:**
```javascript
{
  documento: Object,
  onSolicitudCreated: (solicitud) => void,
  onCancel: () => void
}
```

**Características:**
- Selección de hasta 5 firmantes
- Posicionamiento individual por firmante
- Configuración de prioridad y tipo
- Mensaje personalizado

### 🔑 Certificados (`components/certificados/`)

#### CertificateUpload.jsx
Componente para subir certificados digitales.

**Características:**
- Drag & drop de archivos .p12
- Validación de contraseña
- Encriptación automática
- Previsualización de información

#### CertificateGenerator.jsx
Generador de certificados digitales.

**Características:**
- Formulario de información del certificado
- Generación automática
- Descarga segura
- Validación de datos

#### CertificateList.jsx
Lista de certificados del usuario.

**Características:**
- Vista de certificados disponibles
- Acciones (descargar, eliminar, validar)
- Información detallada
- Estado de validación

### 🔍 Validación (`components/validacion/`)

#### PDFValidationPage.jsx
Página principal de validación de documentos.

**Características:**
- Subida de PDFs para validación
- Verificación de integridad
- Información de firmas
- Historial de validaciones

### 🔔 Notificaciones (`components/notificaciones/`)

#### NotificacionesTiempoReal.jsx
Sistema completo de notificaciones en tiempo real.

**Características:**
- Conexión WebSocket automática
- Diferentes tipos de notificaciones:
  - Solicitudes de firma
  - Firmas completadas
  - Firmas rechazadas
  - Documentos firmados
- Interfaz moderna con animaciones
- Gestión de notificaciones (marcar como leída, eliminar)

### 🎨 Layout (`components/layout/`)

#### Navigation.jsx
Navegación principal de la aplicación.

**Características:**
- Menú responsivo
- Indicador de notificaciones
- Cambio de tema (claro/oscuro)
- Menú de usuario

#### SessionExpiredModal.jsx
Modal para manejo de sesión expirada.

**Características:**
- Detección automática de sesión expirada
- Redirección al login
- Preservación de datos

## 📄 Páginas

### FirmarDocumento.jsx
Página principal para firmar documentos.

**Rutas:**
- `/firmar-documento-directo/:documentoId`

**Características:**
- Visor de PDF integrado
- Selección de certificado
- Posicionamiento de firma
- Solicitudes múltiples
- Notificaciones en tiempo real

## 🔧 Servicios

### api.js
Servicio principal para comunicación con el backend.

**Funciones principales:**
```javascript
// Autenticación
login(credentials)
register(userData)
logout()

// Documentos
uploadDocument(file, metadata)
getDocuments()
getDocument(id)
downloadDocument(id)
deleteDocument(id)
signDocument(documentId, signatureData)

// Certificados
uploadCertificate(file, password)
generateCertificate(certData)
getCertificates()
downloadCertificate(id, password)
deleteCertificate(id)

// Solicitudes
createSignatureRequest(requestData)
getPendingRequests()
getSentRequests()
signByRequest(requestId, signatureData)
rejectRequest(requestId, reason)

// Solicitudes múltiples
createMultipleRequest(requestData)
getMultipleRequests()
getPendingMultipleRequests()
signMultipleRequest(requestId, signatureData)
rejectMultipleRequest(requestId, reason)

// Validación
validatePDF(file)
getValidationHistory()
```

### notificationService.js
Servicio para gestión de notificaciones locales.

**Funciones principales:**
```javascript
add(notification)
remove(id)
markAsRead(id)
getAll()
getUnreadCount()
clear()
```

### clientSocket.js
Cliente WebSocket para comunicación en tiempo real.

**Funciones principales:**
```javascript
connectSocket(userId)
disconnectSocket()
```

## 🎭 Context y Hooks

### AuthContext.js
Contexto para gestión de autenticación.

**Estado:**
```javascript
{
  user: Object | null,
  isAuthenticated: boolean,
  isLoading: boolean
}
```

### SessionContext.jsx
Contexto para gestión de sesión.

**Estado:**
```javascript
{
  isSessionExpired: boolean,
  showSessionExpiredModal: () => void,
  hideSessionExpiredModal: () => void
}
```

### ThemeContext.jsx
Contexto para gestión de tema (claro/oscuro).

**Estado:**
```javascript
{
  theme: 'light' | 'dark',
  toggleTheme: () => void
}
```

### useNotification.js
Hook personalizado para notificaciones.

**Uso:**
```javascript
const { showNotification, hideNotification } = useNotification()
```

## ⚙️ Configuración

### websocket.js
Configuración de WebSocket.

```javascript
export const getWebSocketUrl = () => {
  return process.env.NODE_ENV === 'production' 
    ? 'https://af-systemstechnology.com' 
    : 'http://localhost:3000'
}
```

### vite.config.js
Configuración de Vite con proxy para desarrollo.

```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true
      },
      '/api': {
        target: 'http://localhost:3001'
      }
    }
  }
})
```

### tailwind.config.js
Configuración de Tailwind CSS con tema personalizado.

```javascript
export default {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: { /* ... */ },
        secondary: { /* ... */ },
        background: { /* ... */ }
      }
    }
  }
}
```

## 🛣️ Rutas

### Rutas Públicas
```javascript
/                    → LoginPage
/login              → LoginPage
/register           → RegisterPage
/recuperar-contrasena → RecuperarContrasenaPage
/verificar-email    → EmailVerificationPage
```

### Rutas Privadas
```javascript
/home               → HomePage
/perfil             → ProfilePage
/certificado        → CertificateUpload
/generar-certificado → CertificateGenerator
/mis-certificados   → CertificateList
/validar-pdf        → PDFValidationPage
/solicitudes-pendientes → SolicitudesPendientes
/firmar-documento/:solicitudId → FirmarPorSolicitud
/documentos-compartidos → DocumentosCompartidos
/documentos-firmados → DocumentosFirmados
/firmar-documento-directo/:documentoId → FirmarDocumento
```

## 🎨 Estilos y UI

### Sistema de Colores
```css
/* Colores primarios */
primary: #3B4CCA
primary-dark: #2A3AA9
primary-light: #5A6AE9

/* Colores secundarios */
secondary: #8A2BE2
secondary-dark: #6A1CB2
secondary-light: #A84DF2

/* Fondos */
background: #0F0F1A
background-light: #1A1A2E

/* Acentos */
accent: #E2E8F0
accent-dark: #CBD5E1
```

### Componentes de UI
- **Botones**: Variantes primary, secondary, outline, ghost
- **Inputs**: Con validación y estados de error
- **Modales**: Responsivos con animaciones
- **Cards**: Para listas de documentos y certificados
- **Badges**: Para estados y etiquetas
- **Alerts**: Para notificaciones y errores

### Animaciones
- **Framer Motion**: Transiciones suaves entre páginas
- **Tailwind**: Animaciones CSS para micro-interacciones
- **Hover effects**: Feedback visual en elementos interactivos

## 🔌 WebSockets

### Tipos de Notificaciones
```javascript
// Solicitud de firma
'solicitud_multiple'

// Firma completada
'firma_completada'

// Firma rechazada
'firma_rechazada'

// Documento firmado individual
'documento_firmado'

// Mensaje genérico
'mensaje'
```

### Estructura de Notificaciones
```javascript
{
  id: number,
  tipo: string,
  titulo: string,
  remitente: string,
  documentoNombre: string,
  mensaje: string,
  timestamp: string,
  leida: boolean,
  // Campos específicos según tipo
  solicitudId?: string,
  porcentajeCompletado?: number,
  motivo?: string,
  // ...
}
```

## 🚀 Despliegue

### Build de Producción
```bash
npm run build
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 80
CMD ["npm", "run", "preview"]
```

### Nginx
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://backend:3001;
    }
    
    location /socket.io {
        proxy_pass http://websocket:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## 💻 Desarrollo

### Scripts Disponibles
```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run preview      # Preview del build
npm run lint         # Linting del código
```

### Estructura de Desarrollo
```bash
# Desarrollo local
npm run dev

# Con backend local
BACKEND_URL=http://localhost:3001 npm run dev

# Con WebSocket local
WEBSOCKET_URL=http://localhost:3000 npm run dev
```

### Variables de Entorno
```env
VITE_BACKEND_URL=http://localhost:3001
VITE_WEBSOCKET_URL=http://localhost:3000
VITE_APP_NAME=Cibersegu
```

## 🐛 Troubleshooting

### Problemas Comunes

**Error de conexión al backend**
```bash
# Verificar que el backend esté corriendo
curl http://localhost:3001/api/health

# Verificar proxy en vite.config.js
# Verificar variables de entorno
```

**Error de WebSocket**
```bash
# Verificar servidor WebSocket
curl http://localhost:3000

# Verificar configuración en websocket.js
# Verificar proxy en vite.config.js
```

**Error de build**
```bash
# Limpiar cache
rm -rf node_modules/.vite
npm run build

# Verificar dependencias
npm install
```

**Error de PDF.js**
```bash
# Verificar worker de PDF.js
# Verificar configuración en componentes de PDF
```

### Debug
```bash
# Activar logs detallados
DEBUG=vite:* npm run dev

# Verificar bundle
npm run build -- --analyze
```

### Performance
```bash
# Analizar bundle
npm run build -- --analyze

# Lighthouse audit
npx lighthouse http://localhost:5173
```

## 📞 Soporte

Para reportar bugs o solicitar nuevas funcionalidades:

1. Crear un issue en el repositorio
2. Incluir información del navegador
3. Describir pasos para reproducir
4. Adjuntar screenshots si es necesario

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver archivo LICENSE para más detalles.

---

**Desarrollado por el equipo de Cibersegu** 🎨
