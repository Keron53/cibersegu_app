// Configuración para el servicio de email
// Para usar Gmail, necesitas:
// 1. Habilitar la verificación en 2 pasos
// 2. Generar una contraseña de aplicación
// 3. Usar esa contraseña aquí

module.exports = {
  // Configuración de Gmail
  gmail: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  
  // Configuración del remitente
  from: process.env.EMAIL_USER,
  
  // Configuración de la aplicación
  appName: 'Digital Sign',
  appUrl: process.env.APP_URL || 'http://localhost:3000'
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