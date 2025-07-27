const { exec } = require('child_process');

function sendWhatsAppMessage(phoneNumber, message) {
  const curlCommand = `curl 'https://api.twilio.com/2010-04-01/Accounts/AC187512305ab73c555e340fd2b4fff16c/Messages.json' \\
  -X POST \\
  -u AC187512305ab73c555e340fd2b4fff16c:3a1bc2c3d387762c1480cf72f381a388 \\
  --data-urlencode 'From=whatsapp:+14155238886' \\
  --data-urlencode 'To=whatsapp:${phoneNumber}' \\
  --data-urlencode 'Body=${message}'`;

  console.log('📱 Enviando mensaje con curl...');
  console.log('Comando:', curlCommand);
  console.log('');

  exec(curlCommand, (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Error:', error.message);
      return;
    }
    if (stderr) {
      console.error('❌ stderr:', stderr);
      return;
    }
    console.log('✅ Respuesta:', stdout);
  });
}

// Probar con tu número
const phoneNumber = '+5930992061812';
const message = '🔐 *Digital Sign - Prueba*\n\nEste es un mensaje de prueba desde Digital Sign usando curl.\n\n✅ Si recibes este mensaje, la configuración está funcionando correctamente.';

sendWhatsAppMessage(phoneNumber, message); 