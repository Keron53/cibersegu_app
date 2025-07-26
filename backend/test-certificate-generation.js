const axios = require('axios');

async function testCertificateGeneration() {
  try {
    console.log('🧪 Probando generación de certificado compatible con pyHanko...');
    
    const response = await axios.post('http://localhost:3001/api/certificados/generate', {
      commonName: 'Test User',
      organization: 'Test Organization',
      organizationalUnit: 'IT Department',
      locality: 'Guayaquil',
      state: 'Guayas',
      country: 'EC',
      email: 'test@example.com',
      password: 'test123'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_TOKEN_HERE' // Necesitarás un token válido
      }
    });

    console.log('✅ Certificado generado exitosamente:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error generando certificado:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Ejecutar la prueba
testCertificateGeneration(); 