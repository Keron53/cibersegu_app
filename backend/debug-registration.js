const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

async function debugRegistration() {
  console.log('🔍 Diagnosticando problema de registro...');
  console.log('');

  // 1. Probar con datos válidos
  console.log('1. Probando registro con datos válidos:');
  const validUser = {
    nombre: 'Usuario Prueba',
    username: `testuser_${Date.now()}`,
    email: 'ticscatolica@gmail.com',
    password: 'TestPass123!'
  };

  console.log('Datos enviados:', JSON.stringify(validUser, null, 2));

  try {
    const response = await axios.post(`${API_BASE_URL}/usuarios/registro`, validUser);
    console.log('✅ Registro exitoso:', response.data);
  } catch (error) {
    console.log('❌ Error en registro:');
    console.log('Status:', error.response?.status);
    console.log('Mensaje:', error.response?.data?.mensaje);
    console.log('Error completo:', error.response?.data);
  }

  console.log('');
  console.log('2. Probando con datos inválidos:');

  // 2. Probar con contraseña débil
  const weakPasswordUser = {
    nombre: 'Usuario Prueba',
    username: `testuser_${Date.now()}`,
    email: 'ticscatolica@gmail.com',
    password: '123'
  };

  try {
    const response = await axios.post(`${API_BASE_URL}/usuarios/registro`, weakPasswordUser);
    console.log('❌ Debería haber fallado con contraseña débil');
  } catch (error) {
    console.log('✅ Correcto - Error con contraseña débil:', error.response?.data?.mensaje);
  }

  // 3. Probar con email inválido
  const invalidEmailUser = {
    nombre: 'Usuario Prueba',
    username: `testuser_${Date.now()}`,
    email: 'email-invalido',
    password: 'TestPass123!'
  };

  try {
    const response = await axios.post(`${API_BASE_URL}/usuarios/registro`, invalidEmailUser);
    console.log('❌ Debería haber fallado con email inválido');
  } catch (error) {
    console.log('✅ Correcto - Error con email inválido:', error.response?.data?.mensaje);
  }

  // 4. Probar con campos faltantes
  const missingFieldsUser = {
    nombre: 'Usuario Prueba',
    // username faltante
    email: 'ticscatolica@gmail.com',
    password: 'TestPass123!'
  };

  try {
    const response = await axios.post(`${API_BASE_URL}/usuarios/registro`, missingFieldsUser);
    console.log('❌ Debería haber fallado con campos faltantes');
  } catch (error) {
    console.log('✅ Correcto - Error con campos faltantes:', error.response?.data?.mensaje);
  }

  console.log('');
  console.log('🎯 Diagnóstico completado');
}

debugRegistration(); 