const twilio = require('twilio');
const whatsappConfig = require('../../config/whatsapp');

// Configuración del cliente de Twilio
const client = twilio(whatsappConfig.accountSid, whatsappConfig.authToken);

// Función para validar formato de número de teléfono
const validarTelefono = (telefono) => {
  // Eliminar espacios, guiones y paréntesis
  const numeroLimpio = telefono.replace(/[\s\-\(\)]/g, '');
  
  // Validar formato básico (debe empezar con + y tener al menos 10 dígitos)
  const telefonoRegex = /^\+[1-9]\d{1,14}$/;
  return telefonoRegex.test(numeroLimpio);
};

// Función para formatear número de teléfono
const formatearTelefono = (telefono) => {
  // Eliminar espacios, guiones y paréntesis
  let numeroLimpio = telefono.replace(/[\s\-\(\)]/g, '');
  
  // Si no empieza con +, agregar +593 (código de Ecuador)
  if (!numeroLimpio.startsWith('+')) {
    if (numeroLimpio.startsWith('0')) {
      // Si empieza con 0, reemplazar con +593
      numeroLimpio = '+593' + numeroLimpio.substring(1);
    } else if (numeroLimpio.startsWith('593')) {
      // Si empieza con 593, agregar +
      numeroLimpio = '+' + numeroLimpio;
    } else {
      // Si no tiene código de país, agregar +593
      numeroLimpio = '+593' + numeroLimpio;
    }
  }
  
  return numeroLimpio;
};

// Función para enviar código de verificación por WhatsApp
const enviarCodigoWhatsApp = async (telefono, nombre, codigo) => {
  try {
    if (!validarTelefono(telefono)) {
      throw new Error('Formato de número de teléfono inválido');
    }

    const numeroFormateado = formatearTelefono(telefono);
    
    const mensaje = `🔐 *Digital Sign - Verificación*

Hola *${nombre}*,

Tu código de verificación es:

*${codigo}*

⏰ Este código expira en 15 minutos.

🔒 Si no solicitaste este código, ignora este mensaje.

---
*Digital Sign - Sistema de Firma Digital*`;

    const message = await client.messages.create({
      body: mensaje,
      from: `whatsapp:${whatsappConfig.fromNumber}`,
      to: `whatsapp:${numeroFormateado}`
    });

    console.log('✅ Código WhatsApp enviado:', message.sid);
    return {
      success: true,
      messageId: message.sid,
      to: numeroFormateado
    };

  } catch (error) {
    console.error('❌ Error enviando código WhatsApp:', error);
    
    // En desarrollo, simular envío exitoso
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Modo desarrollo: Simulando envío exitoso');
      return {
        success: true,
        messageId: 'dev-simulated-' + Date.now(),
        to: numeroFormateado
      };
    }
    
    // Manejar errores específicos de Twilio
    if (error.code === 21211) {
      throw new Error('Número de teléfono inválido');
    } else if (error.code === 21214) {
      throw new Error('Número de teléfono no está registrado en WhatsApp');
    } else if (error.code === 21608) {
      throw new Error('Número de teléfono no está verificado en WhatsApp Business');
    } else {
      throw new Error('Error al enviar el código por WhatsApp');
    }
  }
};

// Función para enviar mensaje de recuperación de contraseña por WhatsApp
const enviarRecuperacionWhatsApp = async (telefono, nombre, resetUrl) => {
  try {
    if (!validarTelefono(telefono)) {
      throw new Error('Formato de número de teléfono inválido');
    }

    const numeroFormateado = formatearTelefono(telefono);
    
    const mensaje = `🔐 *Digital Sign - Recuperación de Contraseña*

Hola *${nombre}*,

Has solicitado restablecer tu contraseña en Digital Sign.

🔗 Haz clic en el siguiente enlace para crear una nueva contraseña:

${resetUrl}

⏰ Este enlace es válido por 1 hora.

🔒 Si no solicitaste este cambio, puedes ignorar este mensaje.

---
*Digital Sign - Sistema de Firma Digital*`;

    const message = await client.messages.create({
      body: mensaje,
      from: `whatsapp:${whatsappConfig.fromNumber}`,
      to: `whatsapp:${numeroFormateado}`
    });

    console.log('✅ Mensaje de recuperación WhatsApp enviado:', message.sid);
    return {
      success: true,
      messageId: message.sid,
      to: numeroFormateado
    };

  } catch (error) {
    console.error('❌ Error enviando recuperación WhatsApp:', error);
    throw new Error('Error al enviar el mensaje de recuperación por WhatsApp');
  }
};

// Función para verificar si un número está registrado en WhatsApp
const verificarNumeroWhatsApp = async (telefono) => {
  try {
    if (!validarTelefono(telefono)) {
      return false;
    }

    const numeroFormateado = formatearTelefono(telefono);
    
    // Intentar enviar un mensaje de prueba (será rechazado si el número no está en WhatsApp)
    const message = await client.messages.create({
      body: 'Test',
      from: `whatsapp:${whatsappConfig.fromNumber}`,
      to: `whatsapp:${numeroFormateado}`
    });

    // Si llega aquí, el número está en WhatsApp
    return true;

  } catch (error) {
    // Si hay error, probablemente el número no está en WhatsApp
    console.log('Número no verificado en WhatsApp:', telefono);
    return false;
  }
};

module.exports = {
  enviarCodigoWhatsApp,
  enviarRecuperacionWhatsApp,
  validarTelefono,
  formatearTelefono,
  verificarNumeroWhatsApp
}; 