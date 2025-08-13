# Documentación de la API - Endpoints

## Autenticación

### Registrar un nuevo usuario
```http
POST /api/usuarios/registro
```
**Cuerpo de la solicitud (JSON):**
```json
{
  "nombre": "Juan Pérez",
  "email": "juan@ejemplo.com",
  "password": "contraseñaSegura123",
  "telefono": "+1234567890"
}
```
**Respuesta exitosa (201):**
```json
{
  "mensaje": "Usuario registrado exitosamente",
  "usuario": {
    "id": 1,
    "nombre": "Juan Pérez",
    "email": "juan@ejemplo.com",
    "telefono": "+1234567890"
  }
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
POST /api/documentos/1/firmar
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
