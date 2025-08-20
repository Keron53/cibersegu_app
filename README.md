# 🔐 Cibersegu - Sistema de Firmas Electrónicas

## 📋 Descripción General

Cibersegu es una plataforma web completa para la gestión y aplicación de firmas electrónicas en documentos PDF. El sistema permite a los usuarios subir, visualizar, firmar digitalmente y validar documentos con certificados digitales, incluyendo funcionalidades avanzadas como solicitudes de firma múltiple y notificaciones en tiempo real.

## 🏗️ Arquitectura del Sistema

El sistema Cibersegu está diseñado con una arquitectura modular que incluye frontend, backend, microservicios Python, WebSocket para notificaciones en tiempo real, y servicios externos para email y WhatsApp.

### Diagrama de Arquitectura Completa

![Arquitectura del Sistema](docs/images/arquitectura-sistema.png)

**📋 [Ver Código PlantUML →](docs/CodigoPlantUML)**

### Componentes Principales

#### **🎨 Frontend (React + Vite)**
- **Login/Register**: Autenticación y registro de usuarios
- **PDF Viewer**: Visualización y posicionamiento de firmas
- **Document Manager**: Gestión de documentos
- **Certificate Manager**: Administración de certificados
- **Signature Request**: Solicitudes de firma individuales y múltiples
- **Validation Tool**: Validación de documentos firmados
- **Real-time Notifications**: Notificaciones en tiempo real

#### **🔧 Backend (Node.js + Express)**
- **Controllers**: Manejo de lógica de negocio
- **Services**: Servicios especializados (email, WhatsApp, firma)
- **Middleware**: Autenticación, validación y rate limiting
- **Models**: Modelos de datos con Mongoose

#### **🔌 WebSocket Server**
- **SocketManager**: Gestión de conexiones
- **EventEmitter**: Emisión de eventos en tiempo real
- **NotificationHandler**: Procesamiento de notificaciones

#### **🐍 Python Microservice**
- **pyHanko Service**: Firma digital de PDFs
- **QR Generator**: Generación de códigos QR
- **PDF Processor**: Procesamiento de documentos

#### **🗄️ Base de Datos (MongoDB)**
- **users**: Información de usuarios
- **documents**: Metadatos de documentos
- **certificates**: Certificados digitales
- **signatureRequests**: Solicitudes de firma individuales
- **multipleRequests**: Solicitudes de firma múltiples
- **validationHistory**: Historial de validaciones

#### **🌐 Servicios Externos**
- **Gmail SMTP**: Envío de emails
- **UltraMsg WhatsApp**: Notificaciones por WhatsApp
- **Let's Encrypt SSL**: Certificados SSL

## ✨ Características Principales

### 🔐 **Autenticación y Seguridad**
- Registro con verificación de email y cédula
- Autenticación JWT con sesiones seguras
- Política de contraseñas robusta
- Recuperación de contraseña por email
- Registro alternativo por WhatsApp

### 📄 **Gestión de Documentos**
- Subida y visualización de PDFs
- Firma digital con certificados PKCS#12
- Posicionamiento preciso de firmas
- Validación de integridad de documentos
- Descarga de documentos firmados

### 🤝 **Solicitudes de Firma**
- Solicitudes individuales y múltiples (hasta 5 firmantes)
- Notificaciones por email automáticas
- Posicionamiento individual por firmante
- Estados de solicitud (pendiente, firmado, rechazado, expirado)
- Mensajes personalizados para firmantes

### 🔔 **Notificaciones en Tiempo Real**
- WebSocket para actualizaciones instantáneas
- Notificaciones de firma completada
- Notificaciones de firma rechazada
- Progreso de solicitudes múltiples

### 🔍 **Validación de Documentos**
- Verificación de integridad de PDFs
- Validación de firmas digitales
- Información detallada de certificados
- Validación por archivo o URL

## 🚀 Inicio Rápido

### Prerrequisitos
- Node.js 18+
- Python 3.8+
- MongoDB
- Docker (opcional)

### Instalación Local

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd cibersegu_app
```

2. **Configurar variables de entorno**
```bash
# Copiar archivos de ejemplo
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

3. **Instalar dependencias**
```bash
# Backend
cd backend && npm install

# Frontend  
cd ../frontend && npm install

# Python dependencies
cd ../backend/MicroservicioPyHanko && pip install -r requirements.txt
```

4. **Iniciar servicios**
```bash
# Backend (puerto 3001)
cd backend && npm run dev

# Frontend (puerto 5173)
cd frontend && npm run dev

# WebSocket (puerto 3000)
cd WebSocket && npm run dev
```

5. **Acceder a la aplicación**
```
Frontend: http://localhost:5173
API: http://localhost:3001/api
WebSocket: http://localhost:3000
```

## 📚 Documentación Detallada

### 🔧 **Backend**
Para información completa sobre la API, modelos de datos, configuración y despliegue del backend:

📖 **[Ver Documentación del Backend →](backend/README.md)**

- Arquitectura y estructura del proyecto
- API endpoints y modelos de datos
- Configuración de servicios (email, WhatsApp, MongoDB)
- Microservicio Python para firmas digitales
- Despliegue y troubleshooting

### 🎨 **Frontend**
Para información sobre la interfaz de usuario, componentes y desarrollo del frontend:

📖 **[Ver Documentación del Frontend →](frontend/README.md)**

- Arquitectura React y componentes
- Sistema de rutas y navegación
- Integración con WebSocket
- Estilos y UI/UX
- Despliegue y optimización

### 🔗 **API Endpoints**
Para referencia completa de todos los endpoints disponibles:

📖 **[Ver Documentación de Endpoints →](Endpoints.md)**

- Autenticación y usuarios
- Gestión de documentos y certificados
- Solicitudes de firma individuales y múltiples
- Validación de documentos
- WebSocket y notificaciones

### 🚀 **Despliegue en Producción**
Para guías de despliegue en Azure, Docker y configuración de producción:

📖 **[Ver Guía de Despliegue →](backend/README.md#despliegue)**

- Configuración de VM en Azure
- Docker Compose y Nginx
- Certificados SSL con Let's Encrypt
- Variables de entorno y seguridad
- Monitoreo y troubleshooting

## 🔄 Flujos Principales

### **Registro y Autenticación**
1. Usuario se registra con email y cédula
2. Recibe código de verificación por email
3. Verifica su cuenta y puede iniciar sesión
4. Sistema genera token JWT para sesión

### **Firma de Documento Individual**
1. Usuario sube documento PDF
2. Selecciona posición de firma en el visor
3. Elige certificado digital y ingresa contraseña
4. Sistema aplica firma digital con pyHanko
5. Documento firmado se descarga automáticamente

### **Solicitud de Firma Múltiple**
1. Usuario crea solicitud para hasta 5 firmantes
2. Asigna posición específica a cada firmante
3. Sistema envía notificaciones por email
4. Firmantes reciben enlaces directos para firmar
5. Progreso se actualiza en tiempo real via WebSocket

### **Validación de Documentos**
1. Usuario sube PDF firmado o proporciona URL
2. Sistema verifica integridad del documento
3. Valida certificados y firmas digitales
4. Muestra información detallada de firmantes
5. Confirma autenticidad del documento

## 🛠️ Tecnologías Utilizadas

### **Frontend**
- React 18 + Vite
- Tailwind CSS + Framer Motion
- PDF.js para visualización
- Socket.io Client para WebSocket

### **Backend**
- Node.js + Express
- MongoDB + Mongoose
- JWT para autenticación
- Nodemailer para emails
- pyHanko (Python) para firmas digitales

### **Infraestructura**
- Docker + Docker Compose
- Nginx como proxy reverso
- Let's Encrypt para SSL
- Azure VM para hosting

## 🔐 Seguridad

- **Autenticación JWT** con expiración automática
- **Encriptación bcrypt** para contraseñas
- **Validación de permisos** en todas las operaciones
- **Filtrado por usuario** para documentos
- **Tokens de recuperación** con expiración
- **Verificación de email** obligatoria

## 📞 Soporte

Para soporte técnico o reportar problemas:

- **Email**: soporte@cibersegu.com
- **Documentación**: https://docs.cibersegu.com
- **Issues**: https://github.com/cibersegu/issues

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver archivo LICENSE para más detalles.

---

**Desarrollado por el equipo de Cibersegu** 🔐