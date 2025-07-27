# Sistema de Firmas Electrónicas

Este proyecto es un sistema web completo para la gestión y aplicación de firmas electrónicas en documentos PDF. Cuenta con una arquitectura de cliente-servidor (frontend y backend) que permite a los usuarios subir, visualizar, descargar, eliminar y **firmar digitalmente** documentos PDF con certificados digitales.

## ✨ Nuevas Funcionalidades (v2.0)

### 🔐 Sistema de Autenticación Mejorado
- **Registro con validación de email**: Verificación por código de 6 dígitos
- **Política de contraseñas robusta**: Mínimo 8 caracteres, mayúscula, minúscula y número
- **Recuperación de contraseña**: Enlace seguro por email con expiración de 1 hora
- **Cambio de contraseña**: Desde el perfil del usuario con validación de contraseña actual
- **Sesiones seguras**: JWT con invalidación de tokens al cerrar sesión

### 📧 Sistema de Email Integrado
- **Verificación de registro**: Email automático con código de confirmación
- **Recuperación de contraseña**: Enlace seguro para restablecer contraseña
- **Plantillas HTML profesionales**: Diseño responsive y branding consistente
- **Configuración Gmail**: Soporte para contraseñas de aplicación

### 👤 Gestión de Perfil de Usuario
- **Perfil simplificado**: Solo información esencial (nombre, email, fecha de registro)
- **Edición de datos**: Actualización de nombre y email con re-verificación
- **Fecha de registro**: Muestra fecha y hora exacta de creación de cuenta
- **Estado de cuenta**: Indicador visual del estado de verificación

### 🔍 Validación de PDFs Firmados
- **Validación de integridad**: Verifica si el PDF fue modificado después de la firma
- **Validación de origen**: Confirma si el PDF fue firmado por nuestro sistema
- **Verificación de certificado**: Valida el certificado usado para firmar
- **Extracción de información QR**: Lee datos del firmante desde el QR integrado
- **Validación por archivo o URL**: Soporte para subir archivo o validar desde URL
- **Información detallada**: Muestra número de firmas, estado de certificado, etc.

### 🛡️ Seguridad y Privacidad
- **Filtrado por usuario**: Cada usuario solo ve sus propios documentos
- **Validación de propiedad**: Verificación de permisos en todas las operaciones
- **Middleware de autenticación**: Protección de rutas sensibles
- **Mensajes de seguridad**: No revela si un email existe o no

## 🚀 Instalación

### Prerrequisitos

- **Node.js** 16+ y npm
- **Python** 3.8+ y pip
- **MongoDB** (local o Atlas)

### Instalación del Backend

```bash
cd backend
npm install
```

### Instalación de pyHanko (Python)

**Linux/Mac:**
```bash
cd backend/MicroservicioPyHanko
chmod +x install.sh
./install.sh
```

**Windows:**
```cmd
cd backend\MicroservicioPyHanko
install.bat
```

**Manual:**
```bash
cd backend/MicroservicioPyHanko
pip install -r requirements.txt
```

**Nota importante:** Los certificados generados con el sistema anterior pueden no ser compatibles con pyHanko debido a caracteres especiales. Para obtener firmas válidas, usa el nuevo endpoint `/api/certificados/generate-pyhanko` que genera certificados compatibles.

### Instalación del Frontend

```bash
cd frontend
npm install
```

### Configuración de la Base de Datos

1. Asegúrate de que MongoDB esté ejecutándose
2. El sistema creará automáticamente la CA interna en `backend/CrearCACentral/`

### Configuración de Email (Opcional)

Para habilitar las funcionalidades de email (verificación y recuperación de contraseña):

1. **Activar verificación en 2 pasos** en tu cuenta de Gmail
2. **Generar contraseña de aplicación** en configuración de seguridad
3. **Crear archivo `.env`** en el directorio `backend/`:

```env
EMAIL_USER=tu-email@gmail.com
EMAIL_PASS=tu-contraseña-de-aplicación
MONGODB_URI=mongodb://localhost:27017/digital_sign
JWT_SECRET=mi_clave_secreta
```

**Nota:** Si no configuras el email, el registro funcionará pero sin verificación automática.

### Ejecución

**Backend:**
```bash
cd backend
npm start
```

**Frontend:**
```bash
cd frontend
npm run dev
```

El sistema estará disponible en:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## 🔐 Firma Digital con pyHanko

El sistema ahora utiliza **pyHanko** (Python) para crear firmas digitales válidas que son reconocidas por Adobe y otros validadores de PDF.

## 📧 Sistema de Email y Autenticación

### Flujo de Registro con Verificación
1. **Usuario se registra** → Sistema valida datos y política de contraseñas
2. **Email de verificación** → Se envía código de 6 dígitos por email
3. **Verificación de código** → Usuario ingresa código para activar cuenta
4. **Cuenta activada** → Usuario puede iniciar sesión normalmente

### Flujo de Recuperación de Contraseña
1. **Usuario olvida contraseña** → Clic en "¿Olvidaste tu contraseña?"
2. **Ingresa email** → Sistema envía enlace seguro por email
3. **Clic en enlace** → Llega a página de restablecimiento
4. **Nueva contraseña** → Sistema valida y actualiza contraseña
5. **Redirección** → Usuario vuelve al login automáticamente

### Cambio de Contraseña desde Perfil
1. **Acceso al perfil** → Usuario va a "Mi Perfil"
2. **Botón cambiar contraseña** → Abre modal de cambio
3. **Validación actual** → Sistema verifica contraseña actual
4. **Nueva contraseña** → Validación de política de seguridad
5. **Confirmación** → Contraseña actualizada exitosamente

### Política de Contraseñas
- **Mínimo 8 caracteres**
- **Al menos una letra mayúscula**
- **Al menos una letra minúscula**
- **Al menos un número**
- **Barra de fortaleza en tiempo real**
- **Validación en frontend y backend**

### Flujo de Firma Digital

1. **Usuario selecciona posición**: Hace clic en el PDF para elegir dónde aparecerá la firma
2. **Extracción de datos**: El sistema extrae nombre y organización del certificado .p12
3. **Firma con pyHanko**: Se ejecuta el microservicio Python que:
   - Crea una firma digital criptográficamente válida
   - Integra un QR code con los datos del firmante
   - Posiciona el sello visual en las coordenadas exactas
4. **Descarga**: El PDF firmado se descarga automáticamente

### Características de la Firma

- ✅ **Firma Válida**: Adobe y otros lectores reconocen la firma como válida
- ✅ **QR Integrado**: El QR es parte del sello oficial de la firma
- ✅ **Posicionamiento Preciso**: El usuario elige exactamente dónde aparece
- ✅ **Datos del Certificado**: Nombre y organización se extraen automáticamente
- ✅ **Tamaño Configurable**: El usuario puede ajustar el tamaño del QR

### Estructura del Sello Visual

El sello incluye:
- **QR Code**: Contiene nombre, email y organización del firmante
- **Texto**: "Firmado electrónicamente por: [NOMBRE] [ORGANIZACIÓN]"
- **Validación**: "Validar únicamente con Digital Sign PUCESE"

### Dependencias

**Backend Node.js:**
- `child_process` (para ejecutar Python)
- `tmp` (archivos temporales)
- `node-forge` (extracción de datos del certificado)
- `pdf-lib` (cálculo de coordenadas)
- `nodemailer` (envío de emails)
- `bcrypt` (encriptación de contraseñas)
- `jsonwebtoken` (tokens de autenticación)
- `dotenv` (variables de entorno)

**Microservicio Python:**
- `pyhanko>=1.8.0` (firma digital)
- `cryptography>=3.4.8` (operaciones criptográficas)

### Instalación de Python

```bash
# En el directorio backend/MicroservicioPyHanko
pip install -r requirements.txt
```

### Gestión de Certificados Digitales

El sistema ahora genera **certificados compatibles con pyHanko** usando OpenSSL directamente:

#### **Características de los Certificados:**

- **✅ Compatibles con pyHanko**: Todos los certificados generados son compatibles con el sistema de firma digital
- **🔐 RSA 2048 bits**: Claves criptográficas seguras
- **📋 Datos limpios**: Solo caracteres ASCII para máxima compatibilidad
- **🏢 Firmados por CA**: Todos los certificados están firmados por la CA interna del sistema
- **📦 Formato PKCS#12**: Estándar compatible con todos los sistemas

#### **Generación de Certificados:**

```bash
POST /api/certificados/generate
{
  "commonName": "Nombre del Usuario",
  "organization": "Organización",
  "organizationalUnit": "Departamento",
  "locality": "Ciudad",
  "state": "Provincia", 
  "country": "EC",
  "email": "usuario@ejemplo.com",
  "password": "contraseña_segura"
}
```

#### **Limpieza Automática de Datos:**

El sistema limpia automáticamente los datos para compatibilidad:
- **Nombres**: Solo letras, números y espacios
- **Organizaciones**: Sin caracteres especiales
- **Emails**: Solo caracteres válidos de email
- **Ubicaciones**: Solo texto alfanumérico

#### **Ventajas vs Certificados Anteriores:**

| Aspecto | Anterior (node-forge) | Actual (OpenSSL) |
|---------|----------------------|------------------|
| **Compatibilidad pyHanko** | ❌ Caracteres especiales | ✅ Solo ASCII |
| **Firma Digital** | ⚠️ Posibles errores | ✅ 100% compatible |
| **Estándar** | ⚠️ Formato variable | ✅ PKCS#12 estándar |
| **Validación** | ❌ Falla en pyHanko | ✅ Pasa todas las pruebas |

### Archivos del Sistema

**Backend:**
- `backend/src/controllers/documentoController.js`: Controlador principal de documentos
- `backend/src/controllers/usuarioController.js`: Controlador de usuarios y autenticación
- `backend/src/controllers/validacionController.js`: Controlador de validación de PDFs
- `backend/src/services/emailService.js`: Servicio de envío de emails
- `backend/src/models/Usuario.js`: Modelo de usuario con campos de verificación
- `backend/src/middleware/auth.js`: Middleware de autenticación JWT
- `backend/src/config/email.js`: Configuración de email
- `backend/src/utils/pdfValidator.js`: Utilidad para validar PDFs firmados
- `backend/MicroservicioPyHanko/firmar-pdf.py`: Script de Python para pyHanko
- `backend/MicroservicioPyHanko/requirements.txt`: Dependencias Python
- `backend/CrearCACentral/ca.crt`: Certificado CA del sistema (no se sube al repo)

**Frontend:**
- `frontend/src/components/auth/LoginForm.jsx`: Formulario de login con recuperación
- `frontend/src/components/auth/RegisterForm.jsx`: Registro con verificación de email
- `frontend/src/components/auth/ForgotPasswordModal.jsx`: Modal de recuperación
- `frontend/src/components/auth/RecuperarContrasenaPage.jsx`: Página de restablecimiento
- `frontend/src/components/profile/ProfilePage.jsx`: Perfil de usuario
- `frontend/src/components/profile/ChangePasswordModal.jsx`: Modal de cambio de contraseña
- `frontend/src/components/auth/PasswordStrengthBar.jsx`: Barra de fortaleza de contraseña
- `frontend/src/components/validacion/PDFValidationPage.jsx`: Página de validación de PDFs

### Ventajas vs Implementación Anterior

| Aspecto | Anterior (Node.js) | Actual (pyHanko) |
|---------|-------------------|------------------|
| **Validez de Firma** | ❌ "Invalid" en Adobe | ✅ Válida en Adobe |
| **QR Code** | 📍 Posicionamiento libre | 🔗 Integrado en sello |
| **Estándar PDF** | ⚠️ Modificación post-firma | ✅ Cumple PDF/A |
| **Validación** | ❌ Falla validación criptográfica | ✅ Pasa validación |

### Seguridad y Privacidad

| Aspecto | Descripción |
|---------|-------------|
| **Filtrado por Usuario** | Cada usuario solo ve sus propios documentos |
| **Validación de Propiedad** | Verificación de permisos en todas las operaciones |
| **Middleware de Autenticación** | Protección de rutas sensibles |
| **Tokens de Recuperación** | Expiración automática de 1 hora |
| **Política de Contraseñas** | Validación robusta en frontend y backend |
| **Mensajes de Seguridad** | No revela si un email existe o no |

### Notas Técnicas

- El certificado CA del sistema se copia temporalmente para cada firma
- Las coordenadas se convierten de canvas (frontend) a PDF (backend)
- El sistema mantiene compatibilidad con la interfaz existente
- Los archivos temporales se limpian automáticamente después de cada firma
- Los tokens de recuperación se invalidan automáticamente después de su uso
- Las contraseñas se encriptan con bcrypt antes de almacenarse
- Los emails de verificación expiran después de 15 minutos
- El sistema soporta modo oscuro y claro en toda la interfaz

## 🔧 API Endpoints

### Autenticación y Usuarios
- `POST /api/usuarios/registro` - Registro de usuario
- `POST /api/usuarios/login` - Inicio de sesión
- `POST /api/usuarios/logout` - Cerrar sesión
- `POST /api/usuarios/verificar-email` - Verificar email con código
- `POST /api/usuarios/reenviar-codigo` - Reenviar código de verificación
- `POST /api/usuarios/solicitar-recuperacion` - Solicitar recuperación de contraseña
- `POST /api/usuarios/restablecer-contrasena` - Restablecer contraseña con token
- `PUT /api/usuarios/cambiar-contrasena` - Cambiar contraseña desde perfil
- `GET /api/usuarios/perfil` - Obtener perfil de usuario
- `PUT /api/usuarios/perfil` - Actualizar perfil de usuario

### Documentos
- `GET /api/documentos` - Listar documentos del usuario
- `POST /api/documentos/subir` - Subir documento
- `POST /api/documentos/:id/firmar` - Firmar documento
- `GET /api/documentos/:id/download` - Descargar documento
- `DELETE /api/documentos/:id` - Eliminar documento

### Certificados
- `POST /api/certificados/generate` - Generar certificado
- `POST /api/certificados/upload` - Subir certificado
- `GET /api/certificados` - Listar certificados del usuario

### Validación
- `POST /api/validacion/validar-pdf` - Validar PDF subido
- `POST /api/validacion/validar-pdf-url` - Validar PDF desde URL
- `POST /api/validacion/informacion-firmas` - Obtener información detallada de firmas
- `POST /api/validacion/verificar-integridad` - Verificar integridad del PDF

## 🔧 Troubleshooting

### Problemas Comunes

**Error de Email:**
```
Error: Invalid login: 535-5.7.8 Username and Password not accepted.
```
**Solución:** Verificar que la contraseña de aplicación de Gmail sea correcta y que la verificación en 2 pasos esté activada.

**Error de Variables de Entorno:**
```
[dotenv@17.2.1] injecting env (6) from .env
```
**Solución:** Asegurarse de que `require('dotenv').config();` esté al inicio de `backend/src/app.js`.

**Error de Ruta de Recuperación:**
```
No routes matched location "/recuperar-contrasena?token=..."
```
**Solución:** Verificar que la ruta esté agregada en `frontend/src/App.jsx`.

**Documentos de Otro Usuario:**
Si ves documentos de otro usuario, verificar que el middleware de autenticación esté aplicado en todas las rutas de documentos.

### Scripts de Diagnóstico

El proyecto incluye scripts de diagnóstico en el directorio `backend/`:
- `verify-env.js` - Verificar variables de entorno
- `test-system.js` - Probar funcionalidades del sistema
- `clear-test-users.js` - Limpiar usuarios de prueba
- `debug-registration.js` - Diagnosticar problemas de registro
- `test-validation.js` - Probar funcionalidad de validación de PDFs

**Uso del script de validación:**
```bash
# Probar validación básica
node test-validation.js

# Probar con un PDF firmado específico
node test-validation.js ruta/al/archivo-firmado.pdf
```