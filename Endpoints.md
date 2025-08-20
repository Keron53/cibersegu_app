# 🔗 Documentación de la API - Endpoints

## 📋 Tabla de Contenidos

- [Información General](#información-general)
- [Autenticación](#autenticación)
- [Usuarios](#usuarios)
- [Documentos](#documentos)
- [Certificados](#certificados)
- [Solicitudes de Firma](#solicitudes-de-firma)
- [Solicitudes Múltiples](#solicitudes-múltiples)
- [Validación de Documentos](#validación-de-documentos)
- [WebSocket](#websocket)
- [Códigos de Estado](#códigos-de-estado)
- [Autenticación JWT](#autenticación-jwt)
- [Manejo de Errores](#manejo-de-errores)
- [Ejemplos de Uso](#ejemplos-de-uso)

## 🌐 Información General

**Base URL:** `https://af-systemstechnology.com/api`  
**Versión:** v1.0  
**Formato de Respuesta:** JSON  
**Codificación:** UTF-8  

### Headers Comunes
```http
Content-Type: application/json
Authorization: Bearer <token>
Accept: application/json
```

---

## 🔐 Autenticación

### Registrar Usuario
```http
POST /api/usuarios/registro
```

**Cuerpo de la solicitud:**
```json
{
  "nombre": "Juan Pérez",
  "username": "jperez",
  "email": "juan@ejemplo.com",
  "password": "ContraseñaSegura123",
  "cedula": "1234567890",
  "organizacion": "Mi Empresa",
  "telefono": "+573001234567"
}
```

**Validaciones:**
- `nombre`: Requerido, 2-50 caracteres
- `username`: Requerido, único, solo letras, números, guiones bajos y puntos
- `email`: Requerido, formato válido, único
- `password`: Requerido, mínimo 8 caracteres, incluir mayúscula, minúscula y número
- `cedula`: Requerido, formato válido de cédula Ecuatoriana, único
- `organizacion`: Opcional, máximo 100 caracteres
- `telefono`: Opcional, formato internacional

**Respuesta exitosa (201):**
```json
{
  "mensaje": "Usuario registrado exitosamente. Por favor verifica tu correo electrónico.",
  "usuario": {
    "_id": "507f1f77bcf86cd799439011",
    "nombre": "Juan Pérez",
    "username": "jperez",
    "email": "juan@ejemplo.com",
    "cedula": "1234567890",
    "emailVerificado": false,
    "organizacion": "Mi Empresa",
    "telefono": "+573001234567",
    "createdAt": "2025-01-27T10:30:00.000Z"
  }
}
```

### Iniciar Sesión
```http
POST /api/usuarios/login
```

**Cuerpo de la solicitud:**
```json
{
  "email": "juan@ejemplo.com",
  "password": "ContraseñaSegura123"
}
```

**Respuesta exitosa (200):**
```json
{
  "mensaje": "Inicio de sesión exitoso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "_id": "507f1f77bcf86cd799439011",
    "nombre": "Juan Pérez",
    "username": "jperez",
    "email": "juan@ejemplo.com",
    "cedula": "1234567890",
    "emailVerificado": true,
    "organizacion": "Mi Empresa",
    "telefono": "+573001234567"
  }
}
```

### Cerrar Sesión
```http
POST /api/usuarios/logout
Authorization: Bearer <token>
```

**Respuesta exitosa (200):**
```json
{
  "mensaje": "Sesión cerrada exitosamente"
}
```

---

## 👥 Usuarios

### Obtener Perfil
```http
GET /api/usuarios/perfil
Authorization: Bearer <token>
```

**Respuesta exitosa (200):**
```json
{
  "usuario": {
    "_id": "507f1f77bcf86cd799439011",
    "nombre": "Juan Pérez",
    "username": "jperez",
    "email": "juan@ejemplo.com",
    "cedula": "1234567890",
    "emailVerificado": true,
    "organizacion": "Mi Empresa",
    "telefono": "+573001234567",
    "createdAt": "2025-01-27T10:30:00.000Z",
    "updatedAt": "2025-01-27T15:45:00.000Z"
  }
}
```

### Actualizar Perfil
```http
PUT /api/usuarios/perfil
Authorization: Bearer <token>
```

**Cuerpo de la solicitud:**
```json
{
  "nombre": "Juan Carlos Pérez",
  "organizacion": "Nueva Empresa",
  "telefono": "+573009876543"
}
```

### Cambiar Contraseña
```http
PUT /api/usuarios/cambiar-contrasena
Authorization: Bearer <token>
```

**Cuerpo de la solicitud:**
```json
{
  "passwordActual": "ContraseñaActual123",
  "passwordNuevo": "NuevaContraseña456"
}
```

### Verificar Disponibilidad
```http
POST /api/usuarios/check-username
```

**Cuerpo de la solicitud:**
```json
{
  "username": "jperez"
}
```

### Verificar Disponibilidad de Cédula
```http
POST /api/usuarios/check-cedula
```

**Cuerpo de la solicitud:**
```json
{
  "cedula": "1234567890"
}
```

**Respuesta exitosa (200):**
```json
{
  "disponible": true,
  "mensaje": "Cédula disponible"
}
```

**Respuesta exitosa (200):**
```json
{
  "disponible": true,
  "mensaje": "Nombre de usuario disponible"
}
```

### Verificación de Email
```http
POST /api/usuarios/verificar-email
```

**Cuerpo de la solicitud:**
```json
{
  "email": "juan@ejemplo.com",
  "codigo": "123456"
}
```

### Reenviar Código de Verificación
```http
POST /api/usuarios/reenviar-codigo
```

**Cuerpo de la solicitud:**
```json
{
  "email": "juan@ejemplo.com"
}
```

### Registro por WhatsApp
```http
POST /api/usuarios/registro-whatsapp
```

**Cuerpo de la solicitud:**
```json
{
  "nombre": "Juan Pérez",
  "username": "jperez",
  "telefono": "+573001234567",
  "cedula": "1234567890",
  "password": "ContraseñaSegura123"
}
```

### Verificación por WhatsApp
```http
POST /api/usuarios/verificar-whatsapp
```

**Cuerpo de la solicitud:**
```json
{
  "telefono": "+573001234567",
  "codigo": "123456"
}
```

### Recuperación de Contraseña
```http
POST /api/usuarios/solicitar-recuperacion
```

**Cuerpo de la solicitud:**
```json
{
  "email": "juan@ejemplo.com"
}
```

### Restablecer Contraseña
```http
POST /api/usuarios/restablecer-contrasena
```

**Cuerpo de la solicitud:**
```json
{
  "email": "juan@ejemplo.com",
  "codigo": "123456",
  "passwordNuevo": "NuevaContraseña456"
}
```

### Listar Usuarios (Admin)
```http
GET /api/usuarios
Authorization: Bearer <token>
```

**Respuesta exitosa (200):**
```json
{
  "usuarios": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "nombre": "Juan Pérez",
      "username": "jperez",
      "email": "juan@ejemplo.com",
      "cedula": "1234567890",
      "emailVerificado": true,
      "organizacion": "Mi Empresa",
      "createdAt": "2025-01-27T10:30:00.000Z"
    }
  ],
  "total": 1,
  "pagina": 1,
  "limite": 10
}
```

---

## 📄 Documentos

### Subir Documento
```http
POST /api/documentos/subir
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Cuerpo de la solicitud (form-data):**
- `file`: Archivo PDF (máximo 10MB)
- `nombre`: Nombre personalizado (opcional)
- `descripcion`: Descripción del documento (opcional)

**Respuesta exitosa (201):**
```json
{
  "mensaje": "Documento subido exitosamente",
  "documento": {
    "_id": "507f1f77bcf86cd799439012",
    "nombre": "contrato_empresa.pdf",
    "nombreOriginal": "contrato.pdf",
    "tamaño": 2048576,
    "ruta": "/uploads/documentos/contrato_empresa_1234567890.pdf",
    "usuario": "507f1f77bcf86cd799439011",
    "estado": "sin_firmar",
    "firmas": [],
    "createdAt": "2025-01-27T10:30:00.000Z",
    "updatedAt": "2025-01-27T10:30:00.000Z"
  }
}
```

### Listar Documentos
```http
GET /api/documentos
Authorization: Bearer <token>
```

**Parámetros de consulta:**
- `pagina`: Número de página (default: 1)
- `limite`: Elementos por página (default: 10)
- `estado`: Filtrar por estado (sin_firmar, firmado, compartido)
- `buscar`: Término de búsqueda

**Respuesta exitosa (200):**
```json
{
  "documentos": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "nombre": "contrato_empresa.pdf",
      "tamaño": 2048576,
      "estado": "firmado",
      "firmas": [
        {
          "firmante": "Juan Pérez",
          "fecha": "2025-01-27T11:00:00.000Z",
          "certificado": "CN=Juan Pérez, O=Mi Empresa"
        }
      ],
      "createdAt": "2025-01-27T10:30:00.000Z"
    }
  ],
  "total": 1,
  "pagina": 1,
  "limite": 10,
  "paginas": 1
}
```

### Obtener Documento
```http
GET /api/documentos/:documentoId
Authorization: Bearer <token>
```

**Respuesta exitosa (200):**
```json
{
  "documento": {
    "_id": "507f1f77bcf86cd799439012",
    "nombre": "contrato_empresa.pdf",
    "nombreOriginal": "contrato.pdf",
    "tamaño": 2048576,
    "ruta": "/uploads/documentos/contrato_empresa_1234567890.pdf",
    "usuario": {
      "_id": "507f1f77bcf86cd799439011",
      "nombre": "Juan Pérez",
      "email": "juan@ejemplo.com"
    },
    "estado": "firmado",
    "firmas": [
      {
        "firmante": "Juan Pérez",
        "fecha": "2025-01-27T11:00:00.000Z",
        "certificado": "CN=Juan Pérez, O=Mi Empresa",
        "posicion": {
          "pagina": 1,
          "x": 100,
          "y": 100,
          "ancho": 200,
          "alto": 100
        }
      }
    ],
    "createdAt": "2025-01-27T10:30:00.000Z",
    "updatedAt": "2025-01-27T11:00:00.000Z"
  }
}
```

### Información del Documento
```http
GET /api/documentos/:documentoId/info
Authorization: Bearer <token>
```

### Descargar Documento
```http
GET /api/documentos/:documentoId/download
Authorization: Bearer <token>
```

**Respuesta:** Archivo PDF como blob

### Firmar Documento
```http
POST /api/documentos/:documentoId/firmar
Authorization: Bearer <token>
```

**Cuerpo de la solicitud:**
```json
{
  "certificadoId": "507f1f77bcf86cd799439013",
  "password": "contraseñaCertificado",
  "nombre": "Juan Pérez",
  "organizacion": "Mi Empresa",
  "email": "juan@ejemplo.com",
  "x": 100,
  "y": 100,
  "page": 1,
  "canvasWidth": 800,
  "canvasHeight": 600
}
```

**Respuesta exitosa (200):**
```json
{
  "mensaje": "Documento firmado exitosamente",
  "documento": {
    "_id": "507f1f77bcf86cd799439012",
    "nombre": "contrato_empresa_firmado.pdf",
    "estado": "firmado",
    "firmas": [
      {
        "firmante": "Juan Pérez",
        "fecha": "2025-01-27T11:00:00.000Z",
        "certificado": "CN=Juan Pérez, O=Mi Empresa",
        "posicion": {
          "pagina": 1,
          "x": 100,
          "y": 100
        }
      }
    ],
    "updatedAt": "2025-01-27T11:00:00.000Z"
  }
}
```

### Eliminar Documento
```http
DELETE /api/documentos/:documentoId
Authorization: Bearer <token>
```

**Respuesta exitosa (200):**
```json
{
  "mensaje": "Documento eliminado exitosamente"
}
```

### Documentos Firmados
```http
GET /api/documentos/firmados
Authorization: Bearer <token>
```

### Documentos Compartidos
```http
GET /api/documentos/compartidos
Authorization: Bearer <token>
```

---

## 🔑 Certificados

### Subir Certificado
```http
POST /api/certificados/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Cuerpo de la solicitud (form-data):**
- `file`: Archivo .p12 o .pfx
- `password`: Contraseña del certificado
- `alias`: Alias para identificar el certificado (opcional)

**Respuesta exitosa (201):**
```json
{
  "mensaje": "Certificado subido exitosamente",
  "certificado": {
    "_id": "507f1f77bcf86cd799439013",
    "alias": "Mi Certificado",
    "nombreComun": "Juan Pérez",
    "propietario": "Juan Pérez",
    "organizacion": "Mi Empresa",
    "email": "juan@ejemplo.com",
    "fechaVencimiento": "2026-12-31T23:59:59.000Z",
    "emitidoPor": "AC RAIZ",
    "serialNumber": "1234567890ABCDEF",
    "usuario": "507f1f77bcf86cd799439011",
    "createdAt": "2025-01-27T10:30:00.000Z"
  }
}
```

### Generar Certificado
```http
POST /api/certificados/generate
Authorization: Bearer <token>
```

**Cuerpo de la solicitud:**
```json
{
  "nombreCompleto": "Juan Pérez",
  "email": "juan@ejemplo.com",
  "organizacion": "Mi Empresa",
  "unidadOrganizacional": "TI",
  "localidad": "Bogotá",
  "pais": "CO",
  "password": "ContraseñaSegura123"
}
```

**Respuesta exitosa (201):**
```json
{
  "mensaje": "Certificado generado exitosamente",
  "certificado": {
    "_id": "507f1f77bcf86cd799439014",
    "alias": "Certificado de Juan Pérez",
    "nombreComun": "Juan Pérez",
    "propietario": "Juan Pérez",
    "organizacion": "Mi Empresa",
    "email": "juan@ejemplo.com",
    "fechaVencimiento": "2026-01-27T10:30:00.000Z",
    "serialNumber": "FEDCBA0987654321",
    "usuario": "507f1f77bcf86cd799439011",
    "createdAt": "2025-01-27T10:30:00.000Z"
  }
}
```

### Listar Certificados
```http
GET /api/certificados
Authorization: Bearer <token>
```

**Respuesta exitosa (200):**
```json
{
  "certificados": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "alias": "Mi Certificado",
      "nombreComun": "Juan Pérez",
      "propietario": "Juan Pérez",
      "organizacion": "Mi Empresa",
      "email": "juan@ejemplo.com",
      "fechaVencimiento": "2026-12-31T23:59:59.000Z",
      "emitidoPor": "AC RAIZ",
      "serialNumber": "1234567890ABCDEF",
      "createdAt": "2025-01-27T10:30:00.000Z"
    }
  ],
  "total": 1
}
```

### Descargar Certificado
```http
POST /api/certificados/download/:certificateId
Authorization: Bearer <token>
```

**Cuerpo de la solicitud:**
```json
{
  "password": "contraseñaCertificado"
}
```

**Respuesta:** Archivo .p12 como blob

### Validar Contraseña
```http
POST /api/certificados/:certificateId/validate-password
Authorization: Bearer <token>
```

**Cuerpo de la solicitud:**
```json
{
  "password": "contraseñaCertificado"
}
```

**Respuesta exitosa (200):**
```json
{
  "valido": true,
  "mensaje": "Contraseña válida"
}
```

### Eliminar Certificado
```http
DELETE /api/certificados/:certificateId
Authorization: Bearer <token>
```

**Respuesta exitosa (200):**
```json
{
  "mensaje": "Certificado eliminado exitosamente"
}
```

---

## 📝 Solicitudes de Firma

### Crear Solicitud de Firma
```http
POST /api/solicitudes-firma/crear
Authorization: Bearer <token>
```

**Cuerpo de la solicitud:**
```json
{
  "documentoId": "507f1f77bcf86cd799439012",
  "firmantes": [
    {
      "email": "firmante1@ejemplo.com",
      "nombre": "Firmante Uno",
      "orden": 1
    },
    {
      "email": "firmante2@ejemplo.com",
      "nombre": "Firmante Dos",
      "orden": 2
    }
  ],
  "mensaje": "Por favor firme este documento importante",
  "fechaExpiracion": "2025-02-03T23:59:59.000Z"
}
```

**Respuesta exitosa (201):**
```json
{
  "mensaje": "Solicitud de firma creada exitosamente",
  "solicitud": {
    "_id": "507f1f77bcf86cd799439015",
    "documentoId": "507f1f77bcf86cd799439012",
    "solicitanteId": "507f1f77bcf86cd799439011",
    "estado": "pendiente",
    "firmantes": [
      {
        "email": "firmante1@ejemplo.com",
        "nombre": "Firmante Uno",
        "orden": 1,
        "estado": "pendiente"
      },
      {
        "email": "firmante2@ejemplo.com",
        "nombre": "Firmante Dos",
        "orden": 2,
        "estado": "pendiente"
      }
    ],
    "mensaje": "Por favor firme este documento importante",
    "fechaCreacion": "2025-01-27T10:30:00.000Z",
    "fechaExpiracion": "2025-02-03T23:59:59.000Z",
    "firmasPendientes": 2,
    "firmasCompletadas": 0
  }
}
```

### Solicitudes Pendientes
```http
GET /api/solicitudes-firma/pendientes
Authorization: Bearer <token>
```

**Respuesta exitosa (200):**
```json
{
  "solicitudes": [
    {
      "_id": "507f1f77bcf86cd799439015",
      "documento": {
        "_id": "507f1f77bcf86cd799439012",
        "nombre": "contrato_empresa.pdf"
      },
      "solicitante": {
        "_id": "507f1f77bcf86cd799439011",
        "nombre": "Juan Pérez",
        "email": "juan@ejemplo.com"
      },
      "estado": "pendiente",
      "mensaje": "Por favor firme este documento importante",
      "fechaCreacion": "2025-01-27T10:30:00.000Z",
      "fechaExpiracion": "2025-02-03T23:59:59.000Z"
    }
  ],
  "total": 1
}
```

### Solicitudes Enviadas
```http
GET /api/solicitudes-firma/enviadas
Authorization: Bearer <token>
```

### Firmar por Solicitud
```http
POST /api/solicitudes-firma/firmar/:solicitudId
Authorization: Bearer <token>
```

**Cuerpo de la solicitud:**
```json
{
  "certificadoId": "507f1f77bcf86cd799439013",
  "password": "contraseñaCertificado",
  "nombre": "Juan Pérez",
  "organizacion": "Mi Empresa",
  "email": "juan@ejemplo.com",
  "x": 100,
  "y": 100,
  "page": 1,
  "canvasWidth": 800,
  "canvasHeight": 600
}
```

### Rechazar Solicitud
```http
POST /api/solicitudes-firma/rechazar/:solicitudId
Authorization: Bearer <token>
```

**Cuerpo de la solicitud:**
```json
{
  "motivo": "Documento no revisado completamente"
}
```

### Detalle de Solicitud
```http
GET /api/solicitudes-firma/:solicitudId
Authorization: Bearer <token>
```

---

## 👥 Solicitudes Múltiples

### Crear Solicitud Múltiple
```http
POST /api/solicitudes-multiples/crear
Authorization: Bearer <token>
```

**Cuerpo de la solicitud:**
```json
{
  "documentoId": "507f1f77bcf86cd799439012",
  "titulo": "Aprobación de Contrato",
  "mensaje": "Se requiere la firma de todos los directivos",
  "fechaExpiracion": "2025-02-03T23:59:59.000Z",
  "firmantes": [
    {
      "usuarioId": "507f1f77bcf86cd799439016",
      "posicion": {
        "x": 100,
        "y": 100,
        "page": 1
      }
    },
    {
      "usuarioId": "507f1f77bcf86cd799439017",
      "posicion": {
        "x": 300,
        "y": 100,
        "page": 1
      }
    }
  ]
}
```

**Respuesta exitosa (201):**
```json
{
  "mensaje": "Solicitud múltiple creada exitosamente",
  "solicitudMultiple": {
    "_id": "507f1f77bcf86cd799439018",
    "documentoId": "507f1f77bcf86cd799439012",
    "solicitanteId": "507f1f77bcf86cd799439011",
    "titulo": "Aprobación de Contrato",
    "mensaje": "Se requiere la firma de todos los directivos",
    "estado": "pendiente",
    "firmantes": [
      {
        "usuarioId": "507f1f77bcf86cd799439016",
        "posicion": {
          "x": 100,
          "y": 100,
          "page": 1
        },
        "estado": "pendiente"
      },
      {
        "usuarioId": "507f1f77bcf86cd799439017",
        "posicion": {
          "x": 300,
          "y": 100,
          "page": 1
        },
        "estado": "pendiente"
      }
    ],
    "fechaCreacion": "2025-01-27T10:30:00.000Z",
    "fechaExpiracion": "2025-02-03T23:59:59.000Z",
    "porcentajeCompletado": 0,
    "firmasCompletadas": 0,
    "totalFirmantes": 2
  }
}
```

### Solicitudes Múltiples Pendientes
```http
GET /api/solicitudes-multiples/pendientes
Authorization: Bearer <token>
```

### Solicitudes Múltiples Enviadas
```http
GET /api/solicitudes-multiples/enviadas
Authorization: Bearer <token>
```

### Firmar Solicitud Múltiple
```http
POST /api/solicitudes-multiples/:solicitudId/firmar
Authorization: Bearer <token>
```

**Cuerpo de la solicitud:**
```json
{
  "certificadoId": "507f1f77bcf86cd799439013",
  "password": "contraseñaCertificado",
  "nombre": "Juan Pérez",
  "organizacion": "Mi Empresa",
  "email": "juan@ejemplo.com"
}
```

### Rechazar Solicitud Múltiple
```http
POST /api/solicitudes-multiples/:solicitudId/rechazar
Authorization: Bearer <token>
```

**Cuerpo de la solicitud:**
```json
{
  "motivo": "Documento no revisado completamente"
}
```

### Detalle de Solicitud Múltiple
```http
GET /api/solicitudes-multiples/:solicitudId
Authorization: Bearer <token>
```

---

## 🔍 Validación de Documentos

### Validar PDF
```http
POST /api/validacion/validar-pdf
Content-Type: multipart/form-data
```

**Cuerpo de la solicitud (form-data):**
- `pdf`: Archivo PDF a validar

**Respuesta exitosa (200):**
```json
{
  "valido": true,
  "firmas": [
    {
      "firmante": "Juan Pérez",
      "fecha": "2025-01-27T11:00:00.000Z",
      "valida": true,
      "certificado": {
        "emisor": "AC RAIZ",
        "sujeto": "CN=Juan Pérez, O=Mi Empresa, C=CO",
        "validoDesde": "2024-01-01T00:00:00.000Z",
        "validoHasta": "2026-12-31T23:59:59.000Z"
      },
      "posicion": {
        "pagina": 1,
        "x": 100,
        "y": 100
      }
    }
  ],
  "integro": true,
  "modificaciones": [],
  "informacion": {
    "numeroPaginas": 5,
    "tamaño": 2048576,
    "version": "1.7"
  }
}
```

### Validar PDF por URL
```http
POST /api/validacion/validar-pdf-url
```

**Cuerpo de la solicitud:**
```json
{
  "url": "https://ejemplo.com/documento.pdf"
}
```

### Información de Firmas
```http
POST /api/validacion/informacion-firmas
Content-Type: multipart/form-data
```

**Cuerpo de la solicitud (form-data):**
- `pdf`: Archivo PDF

### Verificar Integridad
```http
POST /api/validacion/verificar-integridad
Content-Type: multipart/form-data
```

**Cuerpo de la solicitud (form-data):**
- `pdf`: Archivo PDF

---

## 🔌 WebSocket

### Conexión
```javascript
const socket = io('https://af-systemstechnology.com', {
  auth: {
    token: 'jwt_token_here'
  }
});
```

### Eventos de Escucha

#### Solicitud de Firma
```javascript
socket.on('solicitud_multiple', (data) => {
  console.log('Nueva solicitud de firma:', data);
});
```

#### Firma Completada
```javascript
socket.on('firma_completada', (data) => {
  console.log('Firma completada:', data);
});
```

#### Firma Rechazada
```javascript
socket.on('firma_rechazada', (data) => {
  console.log('Firma rechazada:', data);
});
```

#### Documento Firmado
```javascript
socket.on('documento_firmado', (data) => {
  console.log('Documento firmado:', data);
});
```

### Estructura de Datos de Notificaciones

#### Solicitud de Firma
```json
{
  "id": 1,
  "tipo": "solicitud_multiple",
  "titulo": "Aprobación de Contrato",
  "remitente": "Juan Pérez",
  "documentoNombre": "contrato_empresa.pdf",
  "mensaje": "Se requiere tu firma en el documento",
  "solicitudId": "507f1f77bcf86cd799439018",
  "timestamp": "2025-01-27T10:30:00.000Z",
  "leida": false
}
```

#### Firma Completada
```json
{
  "id": 2,
  "tipo": "firma_completada",
  "titulo": "Aprobación de Contrato",
  "remitente": "María García",
  "documentoNombre": "contrato_empresa.pdf",
  "mensaje": "María García ha firmado el documento",
  "solicitudId": "507f1f77bcf86cd799439018",
  "porcentajeCompletado": 50,
  "firmasCompletadas": 1,
  "totalFirmantes": 2,
  "fechaFirma": "2025-01-27T11:00:00.000Z",
  "timestamp": "2025-01-27T11:00:00.000Z",
  "leida": false
}
```

#### Firma Rechazada
```json
{
  "id": 3,
  "tipo": "firma_rechazada",
  "titulo": "Aprobación de Contrato",
  "remitente": "Carlos López",
  "documentoNombre": "contrato_empresa.pdf",
  "mensaje": "Carlos López ha rechazado la solicitud de firma",
  "solicitudId": "507f1f77bcf86cd799439018",
  "motivo": "Documento no revisado completamente",
  "fechaRechazo": "2025-01-27T11:30:00.000Z",
  "estadoSolicitud": "rechazada",
  "timestamp": "2025-01-27T11:30:00.000Z",
  "leida": false
}
```

---

## 📊 Códigos de Estado

| Código | Descripción | Uso |
|--------|-------------|-----|
| 200 | OK | Solicitud exitosa |
| 201 | Creado | Recurso creado exitosamente |
| 400 | Solicitud Incorrecta | Datos de entrada inválidos |
| 401 | No Autorizado | Se requiere autenticación |
| 403 | Prohibido | No tiene permisos para acceder al recurso |
| 404 | No Encontrado | El recurso solicitado no existe |
| 409 | Conflicto | El recurso ya existe |
| 422 | Entidad No Procesable | Validación fallida |
| 500 | Error Interno del Servidor | Error del servidor |

---

## 🔐 Autenticación JWT

### Estructura del Token
```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "userId": "507f1f77bcf86cd799439011",
    "email": "juan@ejemplo.com",
    "iat": 1706352600,
    "exp": 1706439000
  }
}
```

### Uso en Headers
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Renovación de Token
Los tokens expiran después de 24 horas. Para renovar, el usuario debe volver a autenticarse.

---

## ⚠️ Manejo de Errores

### Formato de Error
```json
{
  "error": {
    "codigo": "CODIGO_ERROR",
    "mensaje": "Descripción legible del error",
    "detalles": "Información adicional sobre el error (opcional)",
    "timestamp": "2025-01-27T10:30:00.000Z"
  }
}
```

### Códigos de Error Comunes

| Código | Descripción | Solución |
|--------|-------------|----------|
| `CREDENCIALES_INVALIDAS` | Email o contraseña incorrectos | Verificar credenciales |
| `USUARIO_NO_ENCONTRADO` | Usuario no existe | Verificar email |
| `TOKEN_INVALIDO` | Token JWT inválido o expirado | Renovar autenticación |
| `PERMISO_DENEGADO` | No tiene permisos para la acción | Contactar administrador |
| `VALIDACION_FALLIDA` | Datos de entrada inválidos | Verificar formato de datos |
| `RECURSO_NO_ENCONTRADO` | Documento, certificado, etc. no existe | Verificar ID del recurso |
| `CERTIFICADO_INVALIDO` | Certificado corrupto o contraseña incorrecta | Verificar archivo y contraseña |
| `DOCUMENTO_NO_FIRMABLE` | Documento no puede ser firmado | Verificar estado del documento |
| `SOLICITUD_EXPIRADA` | Solicitud de firma expiró | Crear nueva solicitud |

### Ejemplos de Errores

#### Credenciales Inválidas
```json
{
  "error": {
    "codigo": "CREDENCIALES_INVALIDAS",
    "mensaje": "El correo o la contraseña son incorrectos",
    "timestamp": "2025-01-27T10:30:00.000Z"
  }
}
```

#### Validación Fallida
```json
{
  "error": {
    "codigo": "VALIDACION_FALLIDA",
    "mensaje": "Error de validación",
    "detalles": [
      {
        "campo": "email",
        "error": "El correo electrónico no es válido"
      },
      {
        "campo": "password",
        "error": "La contraseña debe tener al menos 8 caracteres"
      }
    ],
    "timestamp": "2025-01-27T10:30:00.000Z"
  }
}
```

#### Recurso No Encontrado
```json
{
  "error": {
    "codigo": "RECURSO_NO_ENCONTRADO",
    "mensaje": "El documento solicitado no existe",
    "timestamp": "2025-01-27T10:30:00.000Z"
  }
}
```

---

## 💡 Ejemplos de Uso

### Flujo Completo de Firma

1. **Registrar usuario**
```bash
curl -X POST https://af-systemstechnology.com/api/usuarios/registro \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Juan Pérez",
    "username": "jperez",
    "email": "juan@ejemplo.com",
    "cedula": "1234567890",
    "password": "ContraseñaSegura123"
  }'
```

2. **Iniciar sesión**
```bash
curl -X POST https://af-systemstechnology.com/api/usuarios/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan@ejemplo.com",
    "password": "ContraseñaSegura123"
  }'
```

3. **Subir documento**
```bash
curl -X POST https://af-systemstechnology.com/api/documentos/subir \
  -H "Authorization: Bearer <token>" \
  -F "file=@documento.pdf" \
  -F "nombre=Contrato Empresa"
```

4. **Subir certificado**
```bash
curl -X POST https://af-systemstechnology.com/api/certificados/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@certificado.p12" \
  -F "password=contraseñaCertificado"
```

5. **Firmar documento**
```bash
curl -X POST https://af-systemstechnology.com/api/documentos/<documentoId>/firmar \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "certificadoId": "<certificadoId>",
    "password": "contraseñaCertificado",
    "nombre": "Juan Pérez",
    "organizacion": "Mi Empresa",
    "email": "juan@ejemplo.com",
    "x": 100,
    "y": 100,
    "page": 1,
    "canvasWidth": 800,
    "canvasHeight": 600
  }'
```

### Flujo de Solicitud Múltiple

1. **Crear solicitud múltiple**
```bash
curl -X POST https://af-systemstechnology.com/api/solicitudes-multiples/crear \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "documentoId": "<documentoId>",
    "titulo": "Aprobación de Contrato",
    "mensaje": "Se requiere la firma de todos los directivos",
    "fechaExpiracion": "2025-02-03T23:59:59.000Z",
    "firmantes": [
      {
        "usuarioId": "<usuarioId1>",
        "posicion": {
          "x": 100,
          "y": 100,
          "page": 1
        }
      },
      {
        "usuarioId": "<usuarioId2>",
        "posicion": {
          "x": 300,
          "y": 100,
          "page": 1
        }
      }
    ]
  }'
```

2. **Firmar solicitud múltiple**
```bash
curl -X POST https://af-systemstechnology.com/api/solicitudes-multiples/<solicitudId>/firmar \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "certificadoId": "<certificadoId>",
    "password": "contraseñaCertificado",
    "nombre": "Juan Pérez",
    "organizacion": "Mi Empresa",
    "email": "juan@ejemplo.com"
  }'
```

### Validación de Documento

```bash
curl -X POST https://af-systemstechnology.com/api/validacion/validar-pdf \
  -F "pdf=@documento_firmado.pdf"
```

---

## 📞 Soporte

Para soporte técnico o reportar problemas:

- **Email**: soporte@cibersegu.com
- **Documentación**: https://docs.cibersegu.com
- **GitHub**: https://github.com/cibersegu/api-issues

---

**Desarrollado por el equipo de Cibersegu** 🔗
