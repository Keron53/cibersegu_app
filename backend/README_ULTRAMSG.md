# 📱 WhatsApp Authentication con UltraMsg

## 🚀 Configuración Rápida

### 1. Credenciales UltraMsg
- **Token**: `1fvgcgr7qmdcr0wk`
- **Instance ID**: `instance135447`
- **URL**: `https://api.ultramsg.com/instance135447/messages/chat`

### 2. Variables de Entorno
Agrega al archivo `.env`:
```env
ULTRAMSG_TOKEN=1fvgcgr7qmdcr0wk
ULTRAMSG_INSTANCE_ID=instance135447
NODE_ENV=development
```

## 📋 Funcionalidades Implementadas

### ✅ **Registro con WhatsApp**
- Validación de número de teléfono ecuatoriano
- Envío de código de verificación por WhatsApp
- Verificación del código ingresado
- Reenvío de código si es necesario

### ✅ **Login con WhatsApp**
- Validación de número de teléfono
- Envío de código de acceso
- Verificación y autenticación

### ✅ **Recuperación de Contraseña**
- Envío de código de recuperación por WhatsApp
- Restablecimiento de contraseña

### ✅ **Validación de Números**
- Formato ecuatoriano: `+593XXXXXXXXX`
- Acepta formatos: `0991234567`, `593991234567`, `+593991234567`
- Validación automática de formato

## 🔧 Archivos del Sistema

### **Configuración**
- `backend/config/ultramsg.js` - Configuración de UltraMsg
- `backend/src/services/ultramsgService.js` - Servicio principal

### **Controladores**
- `backend/src/controllers/usuarioController.js` - Lógica de negocio
- `backend/src/api/usuarioRoutes.js` - Rutas de la API

### **Frontend**
- `frontend/src/components/auth/RegisterWhatsAppForm.jsx` - Formulario de registro
- `frontend/src/components/auth/RegisterMethodSelector.jsx` - Selector de método
- `frontend/src/components/register/RegisterPage.jsx` - Página de registro

## 🧪 Pruebas

### **Script de Prueba**
```bash
node test-ultramsg.js
```

### **Prueba Manual**
1. Ve a http://localhost:3000/register
2. Selecciona "Registro con WhatsApp"
3. Ingresa tu número: `+593992061812`
4. Completa el registro

## 📱 Endpoints de la API

### **Registro con WhatsApp**
```
POST /api/usuarios/registro-whatsapp
{
  "nombre": "Tu Nombre",
  "username": "usuario123",
  "telefono": "+593992061812",
  "password": "Contraseña123"
}
```

### **Verificación de WhatsApp**
```
POST /api/usuarios/verificar-whatsapp
{
  "telefono": "+593992061812",
  "codigo": "123456"
}
```

### **Reenvío de Código**
```
POST /api/usuarios/reenviar-codigo-whatsapp
{
  "telefono": "+593992061812"
}
```

## 🎯 Ventajas de UltraMsg

### ✅ **Simplicidad**
- API simple y directa
- Sin sandbox complicado
- Configuración rápida

### ✅ **Confiabilidad**
- Mensajes llegan directamente
- Sin verificación previa de números
- Respuesta inmediata

### ✅ **Costo**
- Plan gratuito disponible
- Sin costos ocultos
- Transparente

## 🔒 Seguridad

### **Validación de Números**
- Formato ecuatoriano obligatorio
- Validación de longitud
- Prevención de números inválidos

### **Códigos de Verificación**
- Códigos de 6 dígitos
- Expiración en 10 minutos
- Límite de intentos

### **Encriptación**
- Contraseñas hasheadas con bcrypt
- Tokens JWT seguros
- Validación de sesiones

## 🚀 Próximos Pasos

1. **Probar el registro completo**
2. **Configurar en producción**
3. **Agregar más validaciones**
4. **Implementar logs detallados**

## 📞 Soporte

Si tienes problemas:
1. Verifica las credenciales de UltraMsg
2. Revisa los logs del servidor
3. Ejecuta `node test-ultramsg.js`
4. Verifica el formato del número de teléfono

---

**¡UltraMsg es mucho más simple y confiable que Twilio!** 🎉 