// Configuración para UltraMsg WhatsApp API
// https://ultramsg.com/

module.exports = {
  // Credenciales de UltraMsg
  token: process.env.ULTRAMSG_TOKEN || '1fvgcgr7qmdcr0wk',
  instanceId: process.env.ULTRAMSG_INSTANCE_ID || 'instance135447',
  
  // URL base de la API
  baseUrl: 'https://api.ultramsg.com',
  
  // Configuración de la aplicación
  appName: 'Digital Sign',
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  
  // Configuración de desarrollo
  development: {
    simulateMessages: process.env.NODE_ENV === 'development',
    testPhoneNumbers: ['+5930992061812', '+593992061812']
  }
};

/*
INSTRUCCIONES PARA CONFIGURAR ULTRAMSG:

1. Ve a https://ultramsg.com/
2. Crea una cuenta gratuita
3. Crea una instancia de WhatsApp
4. Obtén las credenciales:
   - Token
   - Instance ID

5. Agrega al archivo .env:
   ULTRAMSG_TOKEN=tu-token
   ULTRAMSG_INSTANCE_ID=tu-instance-id

6. ¡Listo! UltraMsg es mucho más simple que Twilio
*/ 