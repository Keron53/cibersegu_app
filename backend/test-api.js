const axios = require('axios');

async function testSignatureAPI() {
  try {
    console.log('🔍 Probando API de firma...');
    
    // Primero obtener un token (simular login)
    const loginResponse = await axios.post('http://localhost:3001/api/usuarios/login', {
      username: 'Walter',
      password: 'Walter123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Token obtenido:', token ? 'SÍ' : 'NO');
    
    // Probar la ruta de firma
    const signatureData = {
      position: { x: 100, y: 100, page: 1, width: 200, height: 120 },
      qrData: '{"test": "data"}',
      signatureData: { signer: 'Test User' },
      userData: {},
      certificateData: { nombreComun: 'Test Certificate' }
    };
    
    const response = await axios.post(
      'http://localhost:3001/api/documentos/687c252f5c5742af137a4d9a/firmar',
      signatureData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ API de firma funciona:', response.status);
    console.log('📋 Respuesta:', response.data);
    
  } catch (error) {
    console.log('❌ Error:', error.response?.status, error.response?.data || error.message);
  }
}

testSignatureAPI(); 