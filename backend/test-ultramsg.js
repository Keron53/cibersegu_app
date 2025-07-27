const axios = require('axios');
const qs = require('qs');

async function testUltraMsg() {
  console.log('🚀 INICIANDO PRUEBAS DE ULTRAMSG WHATSAPP\n');

  try {
    // Configuración
    const token = '1fvgcgr7qmdcr0wk';
    const instanceId = 'instance135447';
    const testPhone = '+593992061812';
    const testMessage = '🔐 *Digital Sign - Prueba*\n\nEste es un mensaje de prueba desde Digital Sign usando UltraMsg.\n\n✅ Si recibes este mensaje, la configuración está funcionando correctamente.';

    console.log('📱 Configuración:');
    console.log('   Token:', token);
    console.log('   Instance ID:', instanceId);
    console.log('   Número de prueba:', testPhone);
    console.log('');

    // Preparar datos
    const data = qs.stringify({
      'token': token,
      'to': testPhone,
      'body': testMessage
    });

    const config = {
      method: 'post',
      url: `https://api.ultramsg.com/${instanceId}/messages/chat`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: data
    };

    console.log('📤 Enviando mensaje...');
    console.log('   URL:', config.url);
    console.log('   Para:', testPhone);
    console.log('   Mensaje:', testMessage);
    console.log('');

    // Enviar mensaje
    const response = await axios(config);
    
    console.log('✅ Respuesta del servidor:');
    console.log('   Status:', response.status);
    console.log('   Data:', JSON.stringify(response.data, null, 2));
    console.log('');

    if (response.data.sent) {
      console.log('🎉 ¡Mensaje enviado exitosamente!');
      console.log('   ID:', response.data.id);
      console.log('   Estado: Enviado');
    } else {
      console.log('❌ Error al enviar mensaje:');
      console.log('   Error:', response.data.error);
    }

    console.log('\n📱 Si recibiste el mensaje en WhatsApp, la configuración está funcionando correctamente.');
    console.log('🔧 Ahora puedes usar el sistema de registro con WhatsApp.');

  } catch (error) {
    console.error('❌ Error en las pruebas:', error.message);
    
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

// Ejecutar pruebas
testUltraMsg(); 