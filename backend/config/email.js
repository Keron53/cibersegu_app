// Configuración para el servicio de email
// Para usar Gmail, necesitas:
// 1. Habilitar la verificación en 2 pasos
// 2. Generar una contraseña de aplicación
// 3. Usar esa contraseña aquí

module.exports = {
  gmail: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  ultramsg: {
    token: process.env.ULTRAMSG_TOKEN || '',
    instance_id: process.env.ULTRAMSG_INSTANCE_ID || ''
  }
};

/*
INSTRUCCIONES PARA CONFIGURAR GMAIL:

1. Ve a tu cuenta de Google
2. Activa la verificación en 2 pasos
3. Ve a "Contraseñas de aplicación"
4. Genera una nueva contraseña para "Correo"
5. Usa esa contraseña en EMAIL_PASS

Variables de entorno necesarias:
EMAIL_USER=tu-email@gmail.com
EMAIL_PASS=contraseña-de-aplicacion-generada
*/ 