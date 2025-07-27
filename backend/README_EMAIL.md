# Configuración del Sistema de Email - Digital Sign

## 📧 Configuración de Gmail

Para que el sistema de verificación de email funcione correctamente, necesitas configurar Gmail con una contraseña de aplicación.

### 🔧 Pasos para Configurar Gmail:

1. **Activar Verificación en 2 Pasos:**
   - Ve a tu cuenta de Google
   - Navega a "Seguridad"
   - Activa "Verificación en 2 pasos"

2. **Generar Contraseña de Aplicación:**
   - Ve a "Contraseñas de aplicación"
   - Selecciona "Correo" como aplicación
   - Copia la contraseña generada (16 caracteres)

3. **Configurar Variables de Entorno:**
   - Crea un archivo `.env` en el directorio `backend/`
   - Agrega las siguientes variables:

```env
EMAIL_USER=tu-email@gmail.com
EMAIL_PASS=contraseña-de-aplicacion-generada
```

### 📋 Variables de Entorno Requeridas:

```env
# Configuración de Email
EMAIL_USER=tu-email@gmail.com
EMAIL_PASS=contraseña-de-aplicacion-de-16-caracteres

# Configuración de Base de Datos
MONGODB_URI=mongodb://localhost:27017/digital_sign

# Configuración de JWT
JWT_SECRET=mi_clave_secreta_super_segura

# Configuración del Servidor
PORT=3001
NODE_ENV=development
```

### 🚀 Funcionalidades Implementadas:

#### ✅ **Registro Mejorado:**
- **Nombre completo** (requerido)
- **Nombre de usuario** (único, requerido)
- **Email** (único, requerido, validado)
- **Contraseña** (mínimo 6 caracteres)

#### ✅ **Validación de Email:**
- **Formato válido** (regex)
- **Verificación de unicidad**
- **Envío de código de verificación**

#### ✅ **Sistema de Verificación:**
- **Código de 6 dígitos** (expira en 15 minutos)
- **Máximo 3 intentos** de verificación
- **Reenvío de código** disponible
- **Bloqueo temporal** después de 3 intentos fallidos

#### ✅ **Seguridad:**
- **Contraseñas hasheadas** con bcrypt
- **Tokens JWT** para autenticación
- **Validación de email** antes del login
- **Protección contra spam** y abuso

### 📧 Plantilla de Email:

El sistema envía emails con:
- **Diseño profesional** y responsive
- **Código destacado** y fácil de leer
- **Instrucciones claras** para el usuario
- **Información de seguridad**

### 🔍 Endpoints Disponibles:

#### **Registro y Autenticación:**
- `POST /api/usuarios/registro` - Registrar nuevo usuario
- `POST /api/usuarios/login` - Iniciar sesión
- `POST /api/usuarios/logout` - Cerrar sesión

#### **Verificación de Email:**
- `POST /api/usuarios/verificar-email` - Verificar código
- `POST /api/usuarios/reenviar-codigo` - Reenviar código

#### **Gestión de Perfil:**
- `GET /api/usuarios/perfil` - Obtener perfil
- `PUT /api/usuarios/perfil` - Actualizar perfil

### 🛠️ Instalación:

1. **Instalar dependencias:**
```bash
cd backend
npm install
```

2. **Configurar variables de entorno:**
```bash
cp .env.example .env
# Editar .env con tus credenciales
```

3. **Iniciar servidor:**
```bash
npm start
```

### ⚠️ Notas Importantes:

- **Gmail requiere** verificación en 2 pasos activada
- **Contraseña de aplicación** es diferente a tu contraseña normal
- **El código expira** en 15 minutos por seguridad
- **Máximo 3 intentos** de verificación por usuario
- **Emails no verificados** no pueden hacer login

### 🔧 Solución de Problemas:

#### **Error de Autenticación Gmail:**
- Verifica que la verificación en 2 pasos esté activada
- Asegúrate de usar la contraseña de aplicación correcta
- Revisa que el email esté bien configurado

#### **Email no llega:**
- Revisa la carpeta de spam
- Verifica que el email esté bien escrito
- Comprueba la configuración del servidor

#### **Código no funciona:**
- Verifica que no haya expirado (15 minutos)
- Asegúrate de no haber excedido los 3 intentos
- Intenta reenviar el código 