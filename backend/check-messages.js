const twilio = require('twilio');

const accountSid = 'AC187512305ab73c555e340fd2b4fff16c';
const authToken = '3a1bc2c3d387762c1480cf72f381a388';

const client = twilio(accountSid, authToken);

async function checkMessages() {
  try {
    console.log('📱 Verificando mensajes enviados...\n');
    
    const messages = await client.messages.list({limit: 10});
    
    console.log('Últimos mensajes:');
    messages.forEach((msg, index) => {
      console.log(`${index + 1}. Para: ${msg.to}`);
      console.log(`   Estado: ${msg.status}`);
      console.log(`   Error: ${msg.errorMessage || 'Sin error'}`);
      console.log(`   Fecha: ${msg.dateCreated}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkMessages(); 