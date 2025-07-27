const axios = require('axios');
const qs = require('qs');
const ultramsgConfig = require('../../config/ultramsg');

class UltraMsgService {
  constructor() {
    this.token = ultramsgConfig.token;
    this.instanceId = ultramsgConfig.instanceId;
    this.baseUrl = ultramsgConfig.baseUrl;
  }

  // Validar formato de número de teléfono
  validarTelefono(numero) {
    // Remover espacios, guiones y paréntesis
    let numeroLimpio = numero.replace(/[\s\-\(\)]/g, '');
    
    // Si empieza con 0, agregar código de país
    if (numeroLimpio.startsWith('0')) {
      numeroLimpio = '+593' + numeroLimpio.substring(1);
    }
    
    // Si no tiene código de país, agregar +593
    if (!numeroLimpio.startsWith('+')) {
      numeroLimpio = '+593' + numeroLimpio;
    }
    
    // Validar formato final
    const regex = /^\+593[0-9]{9}$/;
    if (!regex.test(numeroLimpio)) {
      throw new Error('Formato de número de teléfono inválido. Debe ser un número ecuatoriano válido.');
    }
    
    return numeroLimpio;
  }

  // Formatear número para WhatsApp
  formatearTelefono(numero) {
    const numeroValidado = this.validarTelefono(numero);
    return numeroValidado;
  }

  // Enviar mensaje usando UltraMsg API
  async enviarMensaje(numero, mensaje) {
    const numeroFormateado = this.formatearTelefono(numero);
    
    // En modo desarrollo, simular envío
    if (ultramsgConfig.development.simulateMessages) {
      console.log('🔄 MODO SIMULACIÓN: UltraMsg requiere renovación de suscripción');
      console.log('📱 Para:', numeroFormateado);
      console.log('💬 Mensaje:', mensaje);
      console.log('💡 Para envío real, renueva la suscripción en https://ultramsg.com/');
      return {
        success: true,
        messageId: 'dev-simulated-' + Date.now(),
        to: numeroFormateado
      };
    }

    const data = qs.stringify({
      'token': this.token,
      'to': numeroFormateado,
      'body': mensaje
    });

    const config = {
      method: 'post',
      url: `${this.baseUrl}/${this.instanceId}/messages/chat`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: data
    };

    try {
      console.log('📱 Enviando mensaje con UltraMsg...');
      const response = await axios(config);
      
      if (response.data.sent) {
        console.log('✅ Mensaje enviado exitosamente');
        return {
          success: true,
          messageId: response.data.id || 'ultramsg-' + Date.now(),
          to: numeroFormateado
        };
      } else {
        throw new Error(response.data.error || 'Error al enviar mensaje');
      }
    } catch (error) {
      console.error('❌ Error enviando mensaje:', error.response?.data || error.message);
      throw new Error('Error al enviar el mensaje por WhatsApp');
    }
  }

  // Enviar código de verificación
  async enviarCodigoVerificacion(numero, codigo) {
    const mensaje = `🔐 *Digital Sign - Código de Verificación*\n\nTu código de verificación es: *${codigo}*\n\nEste código expira en 10 minutos.\n\nSi no solicitaste este código, ignora este mensaje.`;
    
    return await this.enviarMensaje(numero, mensaje);
  }

  // Enviar código de recuperación de contraseña
  async enviarCodigoRecuperacion(numero, codigo) {
    const mensaje = `🔑 *Digital Sign - Recuperación de Contraseña*\n\nTu código de recuperación es: *${codigo}*\n\nEste código expira en 10 minutos.\n\nSi no solicitaste recuperar tu contraseña, ignora este mensaje.`;
    
    return await this.enviarMensaje(numero, mensaje);
  }

  // Verificar si un número está registrado en WhatsApp
  async verificarNumero(numero) {
    const numeroFormateado = this.formatearTelefono(numero);
    
    // En modo desarrollo, simular verificación exitosa
    if (ultramsgConfig.development.simulateMessages) {
      return { valid: true, number: numeroFormateado };
    }

    try {
      const data = qs.stringify({
        'token': this.token,
        'to': numeroFormateado,
        'body': 'Verificación de número'
      });

      const config = {
        method: 'post',
        url: `${this.baseUrl}/${this.instanceId}/messages/chat`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: data
      };

      const response = await axios(config);
      
      if (response.data.sent) {
        return { valid: true, number: numeroFormateado };
      } else {
        return { valid: false, error: response.data.error };
      }
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }
}

module.exports = UltraMsgService; 