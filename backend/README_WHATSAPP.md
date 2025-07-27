# Configuración de WhatsApp para Digital Sign

Este documento explica cómo configurar la funcionalidad de WhatsApp para el registro y verificación de usuarios.

## 📱 Funcionalidades de WhatsApp

### ✅ Implementadas:
- **Registro con WhatsApp**: Los usuarios pueden registrarse usando su número de teléfono
- **Verificación por WhatsApp**: Códigos de 6 dígitos enviados por WhatsApp
- **Reenvío de códigos**: Posibilidad de reenviar códigos de verificación
- **Validación de números**: Verificación de formato y existencia en WhatsApp
- **Recuperación de contraseña**: Envío de enlaces de recuperación por WhatsApp

## 🔧 Configuración de Twilio

### 1. Crear cuenta en Twilio
1. Ve a [https://www.twilio.com/](https://www.twilio.com/)
2. Crea una cuenta gratuita
3. Verifica tu número de teléfono

### 2. Obtener credenciales
1. Ve al [Twilio Console](https://console.twilio.com/)
2. Copia tu **Account SID** y **Auth Token**
3. Ve a la sección de **WhatsApp** en el menú lateral

### 3. Configurar WhatsApp Business API
1. En la sección WhatsApp, haz clic en **"Get Started"**
2. Sigue las instrucciones para activar WhatsApp Business API
3. Obtén tu número de WhatsApp Business

### 4. Configurar variables de entorno
Agrega estas variables a tu archivo `.env`:

```env
# Twilio Credentials
TWILIO_ACCOUNT_SID=tu_account_sid_aqui
TWILIO_AUTH_TOKEN=tu_auth_token_aqui
TWILIO_WHATSAPP_NUMBER=+1234567890

# Otras variables existentes
EMAIL_USER=tu-email@gmail.com
EMAIL_PASS=tu-contraseña-de-aplicación
MONGODB_URI=mongodb://localhost:27017/digital_sign
JWT_SECRET=mi_clave_secreta
```

## 📋 Estructura de la Base de Datos

### Nuevos campos en el modelo Usuario:

```javascript
// Campos para WhatsApp
telefono: {
  type: String,
  required: false,
  unique: true,
  sparse: true,
  trim: true
},
telefonoVerificado: {
  type: Boolean,
  default: false
},
codigoWhatsApp: {
  type: String,
  required: false
},
codigoWhatsAppExpiracion: {
  type: Date,
  required: false
}
```

## 🔄 Nuevos Endpoints

### Registro y Verificación:
- `POST /api/usuarios/registro-whatsapp` - Registro con WhatsApp
- `POST /api/usuarios/verificar-whatsapp` - Verificar código WhatsApp
- `POST /api/usuarios/reenviar-codigo-whatsapp` - Reenviar código

### Ejemplo de uso:

```javascript
// Registro con WhatsApp
const response = await fetch('/api/usuarios/registro-whatsapp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    nombre: 'Juan Pérez',
    username: 'juanperez',
    telefono: '0991234567',
    password: 'Contraseña123'
  })
});

// Verificar código
const verification = await fetch('/api/usuarios/verificar-whatsapp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'juanperez',
    codigo: '123456'
  })
});
```

## 📱 Formato de Números de Teléfono

### Automático:
- `0991234567` → `+593991234567`
- `593991234567` → `+593991234567`
- `+593991234567` → `+593991234567`

### Validación:
- Debe tener al menos 10 dígitos
- Se agrega automáticamente el código de país (+593 para Ecuador)
- Se eliminan espacios, guiones y paréntesis

## 🎨 Interfaz de Usuario

### Nuevos componentes:
- `RegisterMethodSelector.jsx` - Selector de método de registro
- `RegisterWhatsAppForm.jsx` - Formulario de registro con WhatsApp

### Flujo de usuario:
1. **Selección de método**: Email o WhatsApp
2. **Formulario de registro**: Con validación de teléfono
3. **Verificación**: Ingreso del código de 6 dígitos
4. **Confirmación**: Redirección al login

## 🧪 Pruebas

### Script de prueba:
```bash
# Instalar dependencias
npm install twilio

# Probar configuración
node test-whatsapp.js
```

### Crear archivo `test-whatsapp.js`:
```javascript
const { enviarCodigoWhatsApp, validarTelefono } = require('./src/services/whatsappService');

async function testWhatsApp() {
  console.log('🧪 Probando WhatsApp...');
  
  // Probar validación de teléfono
  const telefono = '0991234567';
  const esValido = validarTelefono(telefono);
  console.log('Teléfono válido:', esValido);
  
  // Probar envío (solo si tienes credenciales configuradas)
  try {
    await enviarCodigoWhatsApp(telefono, 'Test User', '123456');
    console.log('✅ Código enviado exitosamente');
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

testWhatsApp();
```

## ⚠️ Limitaciones y Consideraciones

### Desarrollo:
- **Sandbox de Twilio**: Para desarrollo, usa el sandbox de Twilio
- **Números limitados**: Solo funciona con números verificados
- **Mensajes de prueba**: Limitados en la versión gratuita

### Producción:
- **WhatsApp Business**: Requiere aprobación de WhatsApp
- **Números verificados**: Todos los números deben estar verificados
- **Plantillas de mensaje**: Deben ser aprobadas por WhatsApp

## 🔒 Seguridad

### Validaciones implementadas:
- **Formato de teléfono**: Validación de formato internacional
- **Códigos únicos**: Cada código es único y expira en 15 minutos
- **Intentos limitados**: Máximo 3 intentos de verificación
- **Limpieza automática**: Códigos se eliminan después del uso

### Mensajes de error:
- Número inválido
- Número no registrado en WhatsApp
- Código expirado
- Demasiados intentos

## 📞 Soporte

### Problemas comunes:
1. **"Número inválido"**: Verificar formato del número
2. **"No está en WhatsApp"**: El número debe tener WhatsApp instalado
3. **"Credenciales inválidas"**: Verificar Account SID y Auth Token
4. **"Sandbox limitado"**: En desarrollo, solo funciona con números verificados

### Contacto:
- Revisar logs del servidor para errores detallados
- Verificar configuración de Twilio en la consola
- Comprobar variables de entorno en `.env`

## 🚀 Próximos pasos

### Mejoras planificadas:
- [ ] Soporte para múltiples países
- [ ] Plantillas de mensaje personalizables
- [ ] Integración con webhooks de Twilio
- [ ] Dashboard de mensajes enviados
- [ ] Métricas de entrega y lectura 