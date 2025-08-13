l API# Documentación de la API - Endpoints

## Autenticación

### Registrar un nuevo usuario
```http
POST /api/usuarios/registro
```
**Cuerpo de la solicitud (JSON):**
```json
{
  "nombre": "Juan Pérez",
  "username": "jperez",
  "email": "juan@ejemplo.com",
  "password": "ContraseñaSegura123"
}
```

**Validaciones:**
- `nombre`: Requerido, debe ser una cadena
- `username`: Requerido, debe ser único, solo puede contener letras, números, guiones bajos y puntos
- `email`: Requerido, debe tener un formato de email válido
- `password`: Requerido, debe tener al menos 8 caracteres, incluyendo al menos:
  - Una letra mayúscula
  - Una letra minúscula
  - Un número

**Respuesta exitosa (201):**
```json
{
  "mensaje": "Usuario registrado exitosamente. Por favor verifica tu correo electrónico.",
  "usuario": {
    "id": "507f1f77bcf86cd799439011",
    "nombre": "Juan Pérez",
    "username": "jperez",
    "email": "juan@ejemplo.com",
    "emailVerificado": false
  }
}
```

**Respuesta de error (400):**
```json
{
  "mensaje": "El nombre de usuario ya está registrado"
}
```

**Respuesta de error (400):**
```json
{
  "mensaje": "La contraseña debe contener al menos 8 caracteres, una mayúscula, una minúscula y un número"
}
```

### Iniciar sesión
```http
POST /api/usuarios/login
```
**Cuerpo de la solicitud (JSON):**
```json
{
  "email": "juan@ejemplo.com",
  "password": "contraseñaSegura123"
}
```
**Respuesta exitosa (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id": 1,
    "nombre": "Juan Pérez",
    "email": "juan@ejemplo.com"
  }
}
```

### Otras rutas de usuarios
- __Verificar disponibilidad__: `POST /api/usuarios/check-username`, `POST /api/usuarios/check-email`, `POST /api/usuarios/check-telefono`
- __Verificación de email__: `POST /api/usuarios/verificar-email`, `POST /api/usuarios/reenviar-codigo`
- __Registro y verificación por WhatsApp__: `POST /api/usuarios/registro-whatsapp`, `POST /api/usuarios/verificar-whatsapp`, `POST /api/usuarios/reenviar-codigo-whatsapp`
- __Logout__: `POST /api/usuarios/logout` (requiere JWT)
- __Perfil__: `GET /api/usuarios/perfil`, `PUT /api/usuarios/perfil` (requiere JWT)
- __Cambiar contraseña__: `PUT /api/usuarios/cambiar-contrasena` (requiere JWT)
- __Recuperación de contraseña__: `POST /api/usuarios/solicitar-recuperacion`, `POST /api/usuarios/restablecer-contrasena`
- __Listar usuarios__: `GET /api/usuarios` (requiere JWT)
- __Alias de registro__: `POST /api/usuarios` (equivalente a registro)

## Documentos

### Subir documento
```http
POST /api/documentos/subir
Headers: {
  "Authorization": "Bearer <token>",
  "Content-Type": "multipart/form-data"
}
```
**Cuerpo de la solicitud (form-data):**
- `file`: Archivo PDF a subir
- `nombre`: (opcional) Nombre personalizado para el documento

**Respuesta exitosa (201):**
```json
{
  "id": 1,
  "nombre": "documento.pdf",
  "ruta": "/uploads/documento-1234567890.pdf",
  "estado": "pendiente",
  "usuarioId": 1,
  "fechaCreacion": "2025-08-12T19:30:00.000Z"
}
```

### Firmar documento
```http
POST /api/documentos/:documentoId/firmar
Headers: {
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}
```
**Cuerpo de la solicitud (JSON):**
```json
{
  "certificadoId": 1,
  "password": "contraseñaCertificado",
  "posicion": {
    "pagina": 1,
    "x": 100,
    "y": 100,
    "ancho": 200,
    "alto": 100
  }
}
```
**Respuesta exitosa (200):**
```json
{
  "mensaje": "Documento firmado exitosamente",
  "documento": {
    "id": 1,
    "nombre": "documento_firmado.pdf",
    "ruta": "/uploads/documento_firmado-1234567890.pdf",
    "estado": "firmado",
    "firma": {
      "fecha": "2025-08-12T19:35:00.000Z",
      "firmante": "Juan Pérez",
      "certificado": "CN=Juan Pérez, O=Empresa, C=CO"
    }
  }
}
```

### Otras rutas de documentos
- __Listar documentos__: `GET /api/documentos` (requiere JWT)
- __Listar firmados__: `GET /api/documentos/firmados` (requiere JWT)
- __Listar compartidos__: `GET /api/documentos/compartidos` (requiere JWT)
- __Obtener documento__: `GET /api/documentos/:id` (requiere JWT)
- __Información del documento__: `GET /api/documentos/:id/info` (requiere JWT)
- __Descargar documento__: `GET /api/documentos/:id/download` (requiere JWT)
- __Eliminar documento__: `DELETE /api/documentos/:id` (requiere JWT)

### Endpoints de firma (deprecados)
Estos endpoints antiguos estaban pensados para pruebas de firma directa con archivos enviados en la solicitud. Se recomienda usar `POST /api/documentos/:documentoId/firmar`.
- `POST /api/documentos/firmar-visible` (multipart: `pdf`, `cert`)
- `POST /api/documentos/firmar-node` (multipart: `pdf`, `cert`)
- `POST /api/documentos/firmar-qr-node` (multipart: `pdf`, `cert`)

## Certificados

### Subir certificado
```http
POST /api/certificados/upload
Headers: {
  "Authorization": "Bearer <token>",
  "Content-Type": "multipart/form-data"
}
```
**Cuerpo de la solicitud (form-data):**
- `file`: Archivo .p12 o .pfx
- `password`: Contraseña del certificado
- `alias`: (opcional) Alias para identificar el certificado

**Respuesta exitosa (201):**
```json
{
  "id": 1,
  "alias": "Mi Certificado",
  "propietario": "Juan Pérez",
  "fechaVencimiento": "2026-12-31T23:59:59.000Z",
  "emitidoPor": "AC RAIZ",
  "serialNumber": "1234567890ABCDEF"
}
```

### Generar certificado
```http
POST /api/certificados/generate
Headers: {
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}
```
**Cuerpo de la solicitud (JSON):**
```json
{
  "nombreCompleto": "Juan Pérez",
  "email": "juan@ejemplo.com",
  "organizacion": "Mi Empresa",
  "unidadOrganizacional": "TI",
  "localidad": "Bogotá",
  "pais": "CO",
  "password": "contraseñaSegura123"
}
```
**Respuesta exitosa (201):**
```json
{
  "mensaje": "Certificado generado exitosamente",
  "certificado": {
    "id": 2,
    "alias": "Certificado de Juan Pérez",
    "propietario": "Juan Pérez",
    "fechaVencimiento": "2026-08-12T19:40:00.000Z",
    "serialNumber": "FEDCBA0987654321"
  }
}
```

### Otras rutas de certificados
- __Listar certificados__: `GET /api/certificados` (requiere JWT)
- __Descargar certificado__: `POST /api/certificados/download/:certificateId` (requiere JWT; body: `{ "password": "..." }`)
- __Eliminar certificado__: `DELETE /api/certificados/:certificateId` (requiere JWT)
- __Validar contraseña__: `POST /api/certificados/:certificateId/validate-password` (requiere JWT; body: `{ "password": "..." }`)

## Validación de Documentos

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
      "fecha": "2025-08-12T19:35:00.000Z",
      "valida": true,
      "certificado": {
        "emisor": "AC RAIZ",
        "sujeto": "CN=Juan Pérez, O=Mi Empresa, C=CO",
        "validoDesde": "2024-01-01T00:00:00.000Z",
        "validoHasta": "2026-12-31T23:59:59.000Z"
      }
    }
  ],
  "integro": true,
  "modificaciones": []
}
```

### Otras rutas de validación
- __Validar PDF por URL__: `POST /api/validacion/validar-pdf-url` (body: `{ "url": "https://..." }`)
- __Información de firmas__: `POST /api/validacion/informacion-firmas` (multipart: `pdf`)
- __Verificar integridad__: `POST /api/validacion/verificar-integridad` (multipart: `pdf`)

## Solicitudes de Firma

### Crear solicitud de firma
```http
POST /api/solicitudes-firma/crear
Headers: {
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}
```
**Cuerpo de la solicitud (JSON):**
```json
{
  "documentoId": 1,
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
  "fechaExpiracion": "2025-08-19T23:59:59.000Z"
}
```
**Respuesta exitosa (201):**
```json
{
  "id": 1,
  "documentoId": 1,
  "solicitanteId": 1,
  "estado": "pendiente",
  "fechaCreacion": "2025-08-12T20:00:00.000Z",
  "fechaExpiracion": "2025-08-19T23:59:59.000Z",
  "firmasPendientes": 2,
  "firmasCompletadas": 0
}
```

### Otras rutas de solicitudes de firma
- __Pendientes para firmar__: `GET /api/solicitudes-firma/pendientes` (requiere JWT)
- __Enviadas por mí__: `GET /api/solicitudes-firma/enviadas` (requiere JWT)
- __Firmar por solicitud__: `POST /api/solicitudes-firma/firmar/:solicitudId` (requiere JWT)
- __Rechazar solicitud__: `POST /api/solicitudes-firma/rechazar/:solicitudId` (requiere JWT)
- __Detalle de solicitud__: `GET /api/solicitudes-firma/:solicitudId` (requiere JWT)

## Códigos de Estado HTTP

| Código | Descripción |
|--------|-------------|
| 200 | OK - Solicitud exitosa |
| 201 | Creado - Recurso creado exitosamente |
| 400 | Solicitud incorrecta - Datos de entrada inválidos |
| 401 | No autorizado - Se requiere autenticación |
| 403 | Prohibido - No tiene permisos para acceder al recurso |
| 404 | No encontrado - El recurso solicitado no existe |
| 500 | Error interno del servidor |

## Autenticación

Todas las rutas protegidas requieren un token JWT en el encabezado `Authorization`:
```
Authorization: Bearer <token>
```

## Manejo de Errores

Las respuestas de error siguen el siguiente formato:
```json
{
  "error": {
    "codigo": "CODIGO_ERROR",
    "mensaje": "Descripción legible del error",
    "detalles": "Información adicional sobre el error (opcional)"
  }
}
```

## Ejemplos de Errores Comunes

### Credenciales inválidas
**Código:** 401 Unauthorized
```json
{
  "error": {
    "codigo": "CREDENCIALES_INVALIDAS",
    "mensaje": "El correo o la contraseña son incorrectos"
  }
}
```

### Recurso no encontrado
**Código:** 404 Not Found
```json
{
  "error": {
    "codigo": "NO_ENCONTRADO",
    "mensaje": "El documento solicitado no existe"
  }
}
```

### Validación fallida
**Código:** 400 Bad Request
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
    ]
  }
}
```
