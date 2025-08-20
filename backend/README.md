# 🔐 Cibersegu Backend - Sistema de Firmas Electrónicas

## 📋 Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Arquitectura del Sistema](#arquitectura-del-sistema)
- [Tecnologías Utilizadas](#tecnologías-utilizadas)
- [Instalación y Configuración](#instalación-y-configuración)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [API Endpoints](#api-endpoints)
- [Modelos de Datos](#modelos-de-datos)
- [Servicios](#servicios)
- [Middleware](#middleware)
- [Configuración de Variables de Entorno](#configuración-de-variables-de-entorno)
- [Despliegue](#despliegue)
- [Monitoreo y Logs](#monitoreo-y-logs)
- [Seguridad](#seguridad)
- [Troubleshooting](#troubleshooting)

## 🎯 Descripción General

Cibersegu Backend es un sistema robusto de firmas electrónicas que permite:

- **Firmas Digitales Individuales**: Firmar documentos PDF con certificados digitales
- **Solicitudes de Firma Múltiple**: Crear solicitudes para hasta 5 firmantes
- **Validación de Documentos**: Verificar integridad y autenticidad de PDFs firmados
- **Gestión de Certificados**: Subir, generar y gestionar certificados digitales
- **Notificaciones en Tiempo Real**: WebSockets para notificaciones instantáneas
- **Autenticación Multi-factor**: Email, WhatsApp y verificación de identidad

## 🏗️ Arquitectura del Sistema

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   WebSocket     │
│   (React)       │◄──►│   (Node.js)     │◄──►│   Server        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   MongoDB       │
                       │   Database      │
                       └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Microservicio │
                       │   PyHanko       │
                       └─────────────────┘
```

## 🛠️ Tecnologías Utilizadas

### Core Technologies
- **Node.js** (v18+) - Runtime de JavaScript
- **Express.js** (v4.18.2) - Framework web
- **MongoDB** (v7.5.0) - Base de datos NoSQL
- **Mongoose** (v7.5.0) - ODM para MongoDB

### Autenticación y Seguridad
- **JWT** (v9.0.2) - Tokens de autenticación
- **bcrypt** (v6.0.0) - Encriptación de contraseñas
- **crypto** (v1.0.1) - Operaciones criptográficas
- **node-forge** (v1.3.1) - Manipulación de certificados

### Manejo de PDFs y Firmas
- **pdf-lib** (v1.17.1) - Manipulación de PDFs
- **pdfjs-dist** (v3.11.174) - Renderizado de PDFs
- **node-signpdf** (v3.0.0) - Firmas digitales
- **qrcode** (v1.5.4) - Generación de códigos QR

### Comunicación y Notificaciones
- **Socket.io-client** (v4.8.1) - Cliente WebSocket
- **nodemailer** (v7.0.5) - Envío de emails
- **twilio** (v4.23.0) - Integración WhatsApp
- **axios** (v1.11.0) - Cliente HTTP

### Utilidades
- **multer** (v1.4.5) - Manejo de archivos
- **cors** (v2.8.5) - Cross-Origin Resource Sharing
- **dotenv** (v17.2.1) - Variables de entorno
- **tmp** (v0.2.3) - Archivos temporales

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js v18 o superior
- MongoDB v5.0 o superior
- Python 3.8+ (para microservicio PyHanko)
- Git

### Instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd cibersegu_app/backend
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

4. **Iniciar el servidor**
```bash
# Desarrollo
npm run dev

# Producción
npm start
```

## 📁 Estructura del Proyecto

```
backend/
├── src/
│   ├── api/                    # Rutas de la API
│   │   ├── usuarioRoutes.js
│   │   ├── documentoRoutes.js
│   │   ├── certificadoRoutes.js
│   │   ├── validacionRoutes.js
│   │   ├── solicitudFirmaRoutes.js
│   │   └── solicitudMultipleRoutes.js
│   ├── controllers/            # Lógica de negocio
│   │   ├── usuarioController.js
│   │   ├── documentoController.js
│   │   ├── certificadoController.js
│   │   ├── validacionController.js
│   │   ├── solicitudFirmaController.js
│   │   └── solicitudMultipleController.js
│   ├── models/                 # Modelos de MongoDB
│   │   ├── Usuario.js
│   │   ├── Documento.js
│   │   ├── Certificate.js
│   │   ├── SolicitudFirma.js
│   │   ├── SolicitudMultiple.js
│   │   ├── ValidacionPDF.js
│   │   ├── DocumentoCompartido.js
│   │   └── TokenInvalidado.js
│   ├── services/               # Servicios externos
│   │   ├── emailService.js
│   │   └── ultramsgService.js
│   ├── middleware/             # Middleware personalizado
│   │   └── auth.js
│   ├── utils/                  # Utilidades
│   │   └── CertificateManager.js
│   ├── config/                 # Configuraciones
│   │   └── db.js
│   └── app.js                  # Punto de entrada
├── MicroservicioPyHanko/       # Microservicio de firmas
├── uploads/                    # Archivos subidos
├── scripts/                    # Scripts de utilidad
├── package.json
└── README.md
```

## 🔌 API Endpoints

### Base URL
```
http://localhost:3001/api
```

### Health Check
```http
GET /api/health
```
**Respuesta:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "environment": "development",
  "version": "1.0.0",
  "services": {
    "server": "running",
    "database": "connected",
    "certificates": "available"
  }
}
```

### 🔐 Autenticación y Usuarios

#### Rutas Públicas

**Registro de Usuario**
```http
POST /api/usuarios/registro
Content-Type: application/json

{
  "nombre": "Juan Pérez",
  "username": "juanperez",
  "email": "juan@example.com",
  "password": "Contraseña123!",
  "telefono": "+593991234567"
}
```

**Login**
```http
POST /api/usuarios/login
Content-Type: application/json

{
  "username": "juanperez",
  "password": "Contraseña123!"
}
```

**Verificar Disponibilidad**
```http
POST /api/usuarios/check-username
POST /api/usuarios/check-email
POST /api/usuarios/check-telefono
```

**Verificación de Email**
```http
POST /api/usuarios/verificar-email
POST /api/usuarios/reenviar-codigo
```

**Registro con WhatsApp**
```http
POST /api/usuarios/registro-whatsapp
POST /api/usuarios/verificar-whatsapp
POST /api/usuarios/reenviar-codigo-whatsapp
```

**Recuperación de Contraseña**
```http
POST /api/usuarios/solicitar-recuperacion
POST /api/usuarios/restablecer-contrasena
POST /api/usuarios/recuperar-usuario
```

#### Rutas Privadas (Requieren JWT)

**Gestión de Perfil**
```http
GET /api/usuarios/perfil
PUT /api/usuarios/perfil
PUT /api/usuarios/cambiar-contrasena
POST /api/usuarios/logout
```

**Listar Usuarios**
```http
GET /api/usuarios
```

### 📄 Documentos

#### Rutas Privadas

**Subir Documento**
```http
POST /api/documentos/subir
Content-Type: multipart/form-data

{
  "pdf": [archivo PDF],
  "nombre": "Documento importante"
}
```

**Listar Documentos**
```http
GET /api/documentos
GET /api/documentos/firmados
GET /api/documentos/compartidos
```

**Obtener Documento**
```http
GET /api/documentos/:id
GET /api/documentos/:id/info
GET /api/documentos/:id/download
```

**Firmar Documento**
```http
POST /api/documentos/:documentoId/firmar
Content-Type: application/json

{
  "certificadoId": "cert_id",
  "password": "cert_password",
  "x": 100,
  "y": 200,
  "page": 1
}
```

**Eliminar Documento**
```http
DELETE /api/documentos/:id
```

### 🔑 Certificados Digitales

#### Rutas Privadas

**Listar Certificados**
```http
GET /api/certificados
```

**Subir Certificado**
```http
POST /api/certificados/upload
Content-Type: multipart/form-data

{
  "file": [archivo .p12],
  "password": "cert_password"
}
```

**Generar Certificado**
```http
POST /api/certificados/generate
Content-Type: application/json

{
  "nombreComun": "Juan Pérez",
  "organizacion": "Mi Empresa",
  "email": "juan@example.com",
  "password": "cert_password"
}
```

**Descargar Certificado**
```http
POST /api/certificados/download/:certificateId
Content-Type: application/json

{
  "password": "cert_password"
}
```

**Validar Contraseña**
```http
POST /api/certificados/:certificateId/validate-password
Content-Type: application/json

{
  "password": "cert_password"
}
```

**Eliminar Certificado**
```http
DELETE /api/certificados/:certificateId
```

### 🔍 Validación de Documentos

#### Rutas Públicas

**Validar PDF**
```http
POST /api/validacion/validar-pdf
Content-Type: multipart/form-data

{
  "pdf": [archivo PDF]
}
```

**Validar PDF desde URL**
```http
POST /api/validacion/validar-pdf-url
Content-Type: application/json

{
  "url": "https://example.com/documento.pdf"
}
```

**Obtener Información de Firmas**
```http
POST /api/validacion/informacion-firmas
Content-Type: multipart/form-data

{
  "pdf": [archivo PDF]
}
```

**Verificar Integridad**
```http
POST /api/validacion/verificar-integridad
Content-Type: multipart/form-data

{
  "pdf": [archivo PDF]
}
```

**Historial de Validaciones**
```http
GET /api/validacion/historial
```

### 📋 Solicitudes de Firma Individual

#### Rutas Privadas

**Crear Solicitud**
```http
POST /api/solicitudes/crear
Content-Type: application/json

{
  "documentoId": "doc_id",
  "firmanteId": "user_id",
  "mensaje": "Por favor firma este documento",
  "fechaExpiracion": "2024-12-31T23:59:59.000Z",
  "posicionFirma": {
    "x": 100,
    "y": 200,
    "page": 1
  }
}
```

**Listar Solicitudes**
```http
GET /api/solicitudes/pendientes
GET /api/solicitudes/enviadas
```

**Firmar por Solicitud**
```http
POST /api/solicitudes/firmar/:solicitudId
Content-Type: application/json

{
  "certificadoId": "cert_id",
  "password": "cert_password"
}
```

**Rechazar Solicitud**
```http
POST /api/solicitudes/rechazar/:solicitudId
Content-Type: application/json

{
  "motivo": "Documento no revisado"
}
```

**Obtener Detalles**
```http
GET /api/solicitudes/:solicitudId
```

### 👥 Solicitudes de Firma Múltiple

#### Rutas Privadas

**Crear Solicitud Múltiple**
```http
POST /api/solicitudes-multiples/crear
Content-Type: application/json

{
  "documentoId": "doc_id",
  "titulo": "Aprobación de contrato",
  "mensaje": "Necesitamos las firmas de todos",
  "fechaExpiracion": "2024-12-31T23:59:59.000Z",
  "firmantes": [
    {
      "usuarioId": "user1_id",
      "posicion": {
        "x": 100,
        "y": 200,
        "page": 1
      }
    },
    {
      "usuarioId": "user2_id",
      "posicion": {
        "x": 300,
        "y": 400,
        "page": 1
      }
    }
  ]
}
```

**Listar Solicitudes**
```http
GET /api/solicitudes-multiples/mis-solicitudes
GET /api/solicitudes-multiples/pendientes
```

**Obtener Detalles**
```http
GET /api/solicitudes-multiples/:solicitudId
```

**Firmar Solicitud Múltiple**
```http
POST /api/solicitudes-multiples/:solicitudId/firmar
Content-Type: application/json

{
  "certificadoId": "cert_id",
  "password": "cert_password"
}
```

**Rechazar Solicitud Múltiple**
```http
POST /api/solicitudes-multiples/:solicitudId/rechazar
Content-Type: application/json

{
  "motivo": "No estoy de acuerdo con el contenido"
}
```

**Cancelar Solicitud**
```http
POST /api/solicitudes-multiples/:solicitudId/cancelar
Content-Type: application/json

{
  "motivo": "Ya no es necesaria"
}
```

**Estadísticas**
```http
GET /api/solicitudes-multiples/estadisticas/generales
```

## 📊 Modelos de Datos

### Usuario
```javascript
{
  _id: ObjectId,
  nombre: String,
  username: String (unique),
  email: String (unique, sparse),
  telefono: String (unique, sparse),
  cedula: String (unique, sparse),
  password: String (hashed),
  emailVerificado: Boolean,
  telefonoVerificado: Boolean,
  codigoVerificacion: String,
  codigoExpiracion: Date,
  codigoWhatsApp: String,
  codigoWhatsAppExpiracion: Date,
  intentosVerificacion: Number,
  tokenRecuperacion: String,
  tokenRecuperacionExpiracion: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Documento
```javascript
{
  _id: ObjectId,
  nombre: String,
  ruta: String,
  usuario: ObjectId (ref: Usuario),
  hash: String,
  estado: String (enum: ['activo', 'eliminado']),
  firmaDigital: Mixed,
  esDocumentoCompartido: Boolean,
  solicitudesFirma: [ObjectId (ref: SolicitudFirma)],
  firmantes: [{
    usuarioId: ObjectId (ref: Usuario),
    nombre: String,
    email: String,
    fechaFirma: Date,
    posicion: {
      x: Number,
      y: Number,
      page: Number
    }
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### Certificate
```javascript
{
  _id: ObjectId,
  nombreComun: String,
  organizacion: String,
  email: String,
  propietario: String,
  alias: String,
  certificateData: Buffer,
  encryptionSalt: String,
  encryptionKey: String,
  usuario: ObjectId (ref: Usuario),
  createdAt: Date,
  updatedAt: Date
}
```

### SolicitudFirma
```javascript
{
  _id: ObjectId,
  documentoId: ObjectId (ref: Documento),
  solicitanteId: ObjectId (ref: Usuario),
  firmanteId: ObjectId (ref: Usuario),
  posicionFirma: {
    x: Number,
    y: Number,
    page: Number,
    qrSize: Number
  },
  mensaje: String,
  estado: String (enum: ['pendiente', 'firmado', 'rechazado', 'expirado']),
  fechaSolicitud: Date,
  fechaExpiracion: Date,
  fechaFirma: Date,
  certificadoId: ObjectId (ref: Certificate),
  solicitudMultipleId: ObjectId (ref: SolicitudMultiple),
  motivoRechazo: String
}
```

### SolicitudMultiple
```javascript
{
  _id: ObjectId,
  documentoId: ObjectId (ref: Documento),
  solicitanteId: ObjectId (ref: Usuario),
  firmantes: [{
    usuarioId: ObjectId (ref: Usuario),
    nombre: String,
    email: String,
    orden: Number,
    obligatorio: Boolean
  }],
  posicionFirma: {
    x: Number,
    y: Number,
    page: Number,
    qrSize: Number
  },
  posicionesIndividuales: [{
    usuarioId: ObjectId (ref: Usuario),
    posicion: {
      x: Number,
      y: Number,
      page: Number,
      qrSize: Number
    }
  }],
  mensaje: String,
  estado: String (enum: ['pendiente', 'parcialmente_firmado', 'completado', 'expirado', 'cancelado']),
  fechaSolicitud: Date,
  fechaExpiracion: Date,
  fechaCompletado: Date,
  tipo: String (enum: ['libre', 'secuencial']),
  prioridad: String (enum: ['baja', 'normal', 'alta']),
  titulo: String,
  descripcion: String,
  tags: [String],
  firmasCompletadas: Number,
  totalFirmantes: Number,
  porcentajeCompletado: Number,
  historial: [{
    accion: String,
    usuarioId: ObjectId (ref: Usuario),
    descripcion: String,
    timestamp: Date
  }]
}
```

## 🔧 Servicios

### EmailService
Maneja el envío de notificaciones por email:
- Verificación de email
- Recuperación de contraseña
- Notificaciones de solicitudes de firma
- Confirmaciones de firma completada
- Rechazos de firma

### UltramsgService
Integración con WhatsApp para:
- Registro de usuarios
- Verificación de identidad
- Notificaciones de firma

## 🛡️ Middleware

### Auth Middleware
```javascript
// Verifica el token JWT en el header Authorization
// Formato: Bearer <token>
// Agrega req.usuario con la información del usuario autenticado
```

## ⚙️ Configuración de Variables de Entorno

Crear archivo `.env` en la raíz del backend:

```env
# Configuración del Servidor
PORT=3001
NODE_ENV=development

# Base de Datos
MONGODB_URI=mongodb://localhost:27017/cibersegu

# JWT
JWT_SECRET=mi_clave_secreta_super_segura_cibersegu_2024
JWT_EXPIRES_IN=24h

# Email (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-contraseña-de-aplicacion

# WhatsApp (Ultramsg)
ULTRAMSG_TOKEN=tu_token_ultramsg
ULTRAMSG_INSTANCE_ID=tu_instance_id

# Frontend
FRONTEND_URL=http://localhost:5173

# WebSocket
WEBSOCKET_URL=http://localhost:3000

# Microservicio PyHanko
PYHANKO_URL=http://localhost:5000

# Archivos
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
```

## 🚀 Despliegue

### Docker
```bash
# Construir imagen
docker build -t cibersegu-backend .

# Ejecutar contenedor
docker run -p 3001:3001 --env-file .env cibersegu-backend
```

### PM2 (Producción)
```bash
# Instalar PM2
npm install -g pm2

# Iniciar aplicación
pm2 start src/app.js --name "cibersegu-backend"

# Monitorear
pm2 monit

# Logs
pm2 logs cibersegu-backend
```

## 📊 Monitoreo y Logs

### Health Check
```bash
curl http://localhost:3001/api/health
```

### Logs del Sistema
```bash
# Logs de la aplicación
tail -f logs/app.log

# Logs de errores
tail -f logs/error.log

# Logs de WebSocket
tail -f logs/websocket.log
```

### Métricas de Rendimiento
- Tiempo de respuesta promedio
- Tasa de errores
- Uso de memoria y CPU
- Conexiones activas a MongoDB

## 🔒 Seguridad

### Autenticación
- JWT tokens con expiración
- Contraseñas encriptadas con bcrypt
- Verificación multi-factor (email + WhatsApp)

### Autorización
- Middleware de autenticación en rutas privadas
- Validación de permisos por usuario
- Control de acceso a documentos

### Validación de Datos
- Sanitización de inputs
- Validación de tipos de archivo
- Límites de tamaño de archivo
- Validación de certificados

### Criptografía
- Encriptación de certificados digitales
- Hashing seguro de contraseñas
- Firmas digitales con pyHanko

## 🐛 Troubleshooting

### Problemas Comunes

**Error de conexión a MongoDB**
```bash
# Verificar que MongoDB esté corriendo
sudo systemctl status mongod

# Verificar la URI de conexión
echo $MONGODB_URI
```

**Error de certificados**
```bash
# Verificar que el microservicio PyHanko esté corriendo
curl http://localhost:5000/health

# Verificar certificados CA
ls -la MicroservicioPyHanko/
```

**Error de WebSocket**
```bash
# Verificar que el servidor WebSocket esté corriendo
netstat -tulpn | grep :3000

# Verificar logs del WebSocket
tail -f WebSocket/logs/websocket.log
```

**Error de email**
```bash
# Verificar configuración SMTP
echo $SMTP_HOST
echo $SMTP_USER

# Probar envío de email
node test-notifications.js
```

### Logs de Debug
```bash
# Activar logs detallados
DEBUG=* npm run dev

# Logs específicos
DEBUG=app:*,auth:*,db:* npm run dev
```

### Recuperación de Errores
```bash
# Reiniciar servicios
pm2 restart all

# Limpiar archivos temporales
rm -rf uploads/temp/*

# Verificar espacio en disco
df -h
```

## 📞 Soporte

Para reportar bugs o solicitar nuevas funcionalidades:

1. Crear un issue en el repositorio
2. Incluir logs de error
3. Describir pasos para reproducir
4. Especificar versión del sistema

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver archivo LICENSE para más detalles.

---

**Desarrollado por el equipo de Cibersegu** 🔐
