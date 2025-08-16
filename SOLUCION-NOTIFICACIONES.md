# 🔧 Solución a Problemas de Notificaciones - Solicitudes Múltiples

## 📋 **Problemas Identificados**

1. **❌ Las notificaciones por email no llegan a los usuarios seleccionados**
2. **❌ No aparecen las notificaciones en tiempo real con WebSockets**

## 🚀 **Soluciones Implementadas**

### **1. Configuración de Variables de Entorno (.env)**

**Paso 1:** Edita el archivo `backend/.env` y agrega esta configuración:

```bash
# Configuración de Email (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-contraseña-de-aplicacion

# Configuración de Base de Datos
MONGODB_URI=mongodb://localhost:27017/cibersegu

# Configuración de JWT
JWT_SECRET=mi_clave_secreta_super_segura_cibersegu_2024

# Configuración del Servidor
PORT=3001
NODE_ENV=development

# Configuración del Frontend
FRONTEND_URL=http://localhost:5173

# Configuración de WebSocket
WEBSOCKET_URL=http://localhost:3000
```

**Paso 2:** Configura Gmail:
- Activa **verificación en 2 pasos** en tu cuenta de Google
- Ve a **"Contraseñas de aplicación"**
- Genera una contraseña para **"Correo"**
- Copia la contraseña de 16 caracteres
- Reemplaza `tu-contraseña-de-aplicacion` con esa contraseña

### **2. Integración de WebSockets en Solicitudes Múltiples**

**✅ Cambios realizados:**
- Agregada función `enviarNotificacionWebSocket` en `solicitudMultipleController.js`
- Integración automática con WebSocket al crear solicitudes múltiples
- Notificaciones en tiempo real para todos los firmantes

### **3. Componente de Notificaciones en Tiempo Real**

**✅ Nuevo componente creado:**
- `frontend/src/components/notificaciones/NotificacionesTiempoReal.jsx`
- Conexión automática al WebSocket
- Interfaz moderna con Tailwind CSS y Framer Motion
- Manejo de diferentes tipos de notificaciones

### **4. Servidor WebSocket Mejorado**

**✅ Mejoras implementadas:**
- Manejo específico de notificaciones de solicitudes múltiples
- Endpoint de prueba `/test` para verificar funcionamiento
- Logs detallados para debugging
- Manejo de errores mejorado

## 🧪 **Pruebas y Verificación**

### **Script de Pruebas Automáticas**

Ejecuta el script de pruebas para verificar que todo funcione:

```bash
cd backend
node test-notifications.js
```

Este script verificará:
- ✅ Configuración de email SMTP
- ✅ Conexión al servidor WebSocket
- ✅ Envío de notificaciones WebSocket

### **Pruebas Manuales**

**1. Probar Email:**
```bash
# Verificar que el archivo .env esté configurado
cat .env

# Verificar que las variables estén cargadas
node -e "require('dotenv').config(); console.log('SMTP_USER:', process.env.SMTP_USER); console.log('SMTP_PASS:', process.env.SMTP_PASS ? 'Configurada' : 'No configurada');"
```

**2. Probar WebSocket:**
```bash
# Verificar que el servidor esté corriendo
curl http://localhost:3000/test

# Verificar usuarios conectados
curl http://localhost:3000/test | jq '.usuariosConectados'
```

**3. Probar Notificación:**
```bash
# Enviar notificación de prueba
curl -X POST http://localhost:3000/emitir \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","documento":{"tipo":"solicitud_multiple","titulo":"Prueba"}}'
```

## 🔍 **Debugging y Solución de Problemas**

### **Problema: Email no llega**

**Síntomas:**
- No se reciben emails de solicitudes múltiples
- Error en logs: "Error enviando notificaciones"

**Soluciones:**
1. **Verificar archivo .env:**
   ```bash
   cd backend
   cat .env
   ```

2. **Verificar configuración Gmail:**
   - Verificación en 2 pasos activada
   - Contraseña de aplicación generada
   - Variables SMTP_USER y SMTP_PASS configuradas

3. **Probar configuración SMTP:**
   ```bash
   node test-notifications.js
   ```

### **Problema: WebSocket no funciona**

**Síntomas:**
- No aparecen notificaciones en tiempo real
- Error: "Usuario no conectado"

**Soluciones:**
1. **Verificar que el servidor WebSocket esté corriendo:**
   ```bash
   ps aux | grep webSocket
   ```

2. **Verificar puerto 3000:**
   ```bash
   netstat -tlnp | grep :3000
   ```

3. **Reiniciar servidor WebSocket:**
   ```bash
   cd WebSocket
   node webSocketServer.js
   ```

### **Problema: Notificaciones no aparecen en frontend**

**Síntomas:**
- WebSocket conectado pero sin notificaciones
- Componente de notificaciones no muestra nada

**Soluciones:**
1. **Verificar conexión WebSocket en frontend:**
   - Abrir DevTools → Console
   - Buscar mensajes: "🔌 Conectado al WebSocket"

2. **Verificar registro de usuario:**
   - Console debe mostrar: "✅ Usuario registrado en WebSocket: [ID]"

3. **Verificar componente de notificaciones:**
   - Asegurarse de que esté incluido en el layout principal
   - Verificar que no haya errores de JavaScript

## 📱 **Integración en el Frontend**

### **Paso 1: Incluir el componente de notificaciones**

Agrega el componente en tu layout principal o navbar:

```jsx
import NotificacionesTiempoReal from './components/notificaciones/NotificacionesTiempoReal';

// En tu navbar o header
<NotificacionesTiempoReal />
```

### **Paso 2: Verificar conexión WebSocket**

El componente se conecta automáticamente al WebSocket y registra al usuario.

### **Paso 3: Probar notificaciones**

1. Crea una solicitud múltiple
2. Verifica que aparezca la notificación en tiempo real
3. Verifica que llegue el email

## 🔄 **Reinicio de Servicios**

Después de hacer los cambios, reinicia los servicios:

```bash
# Reiniciar backend
cd backend
npm restart

# Reiniciar WebSocket
cd WebSocket
node webSocketServer.js

# Verificar que ambos estén corriendo
ps aux | grep -E "(app.js|webSocketServer.js)"
```

## 📊 **Verificación Final**

**✅ Checklist de verificación:**

- [ ] Archivo `.env` configurado con credenciales SMTP
- [ ] Servidor WebSocket corriendo en puerto 3000
- [ ] Backend corriendo en puerto 3001
- [ ] Script de pruebas ejecutándose sin errores
- [ ] Componente de notificaciones incluido en frontend
- [ ] Usuario registrado en WebSocket
- [ ] Notificaciones apareciendo en tiempo real
- [ ] Emails llegando a los firmantes

## 🆘 **Soporte Adicional**

Si los problemas persisten:

1. **Revisar logs del backend:**
   ```bash
   cd backend
   tail -f logs/app.log
   ```

2. **Revisar logs del WebSocket:**
   ```bash
   cd WebSocket
   tail -f logs/websocket.log
   ```

3. **Verificar variables de entorno:**
   ```bash
   node -e "require('dotenv').config(); console.log(process.env)"
   ```

4. **Probar conexión SMTP manualmente:**
   ```bash
   node test-notifications.js
   ```

---

**🎯 Con estas soluciones, tu sistema de notificaciones para solicitudes múltiples debería funcionar perfectamente tanto por email como por WebSocket en tiempo real.**
