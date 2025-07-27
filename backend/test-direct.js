const https = require('https');
const querystring = require('querystring');

function sendWhatsAppMessage(phoneNumber, message) {
  const accountSid = 'AC187512305ab73c555e340fd2b4fff16c';
  const authToken = '3a1bc2c3d387762c1480cf72f381a388';
  
  const data = querystring.stringify({
    'From': 'whatsapp:+14155238886',
    'To': `whatsapp:${phoneNumber}`,
    'Body': message
  });

  const options = {
    hostname: 'api.twilio.com',
    port: 443,
    path: `/2010-04-01/Accounts/${accountSid}/Messages.json`,
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': data.length
    }
  };

  console.log('📱 Enviando mensaje directamente...');
  console.log('Para:', phoneNumber);
  console.log('Mensaje:', message);
  console.log('');

  const req = https.request(options, (res) => {
    let responseData = '';
    
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    
    res.on('end', () => {
      console.log('✅ Respuesta del servidor:');
      console.log('Status:', res.statusCode);
      console.log('Headers:', res.headers);
      console.log('Body:', responseData);
      
      try {
        const response = JSON.parse(responseData);
        if (response.sid) {
          console.log('✅ Mensaje enviado exitosamente');
          console.log('Message SID:', response.sid);
          console.log('Status:', response.status);
        } else {
          console.log('❌ Error en la respuesta:', response);
        }
      } catch (e) {
        console.log('❌ Error parseando respuesta:', e.message);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Error de conexión:', error.message);
  });

  req.write(data);
  req.end();
}

// Probar con tu número
const phoneNumber = '+5930992061812';
const message = '🔐 *Digital Sign - Prueba*\n\nEste es un mensaje de prueba desde Digital Sign usando Node.js directamente.\n\n✅ Si recibes este mensaje, la configuración está funcionando correctamente.';

sendWhatsAppMessage(phoneNumber, message); 