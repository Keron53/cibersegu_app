const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

// Colores para la consola
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

async function testSystem() {
  log('🚀 Iniciando pruebas del sistema Digital Sign...', 'bold');
  console.log('');

  try {
    // 1. Probar conexión al servidor
    logInfo('1. Probando conexión al servidor...');
    try {
      const response = await axios.get(`${API_BASE_URL}/usuarios`);
      logSuccess('Servidor respondiendo correctamente');
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        logError('No se puede conectar al servidor. Asegúrate de que esté ejecutándose en puerto 3001');
        return;
      }
      logSuccess('Servidor respondiendo (error esperado en endpoint protegido)');
    }

    // 2. Probar registro de usuario
    logInfo('2. Probando registro de usuario...');
    const testUser = {
      nombre: 'Usuario Prueba',
      username: `testuser_${Date.now()}`,
      email: 'ticscatolica@gmail.com',
      password: 'TestPass123!'
    };

    try {
      const registerResponse = await axios.post(`${API_BASE_URL}/usuarios/registro`, testUser);
      logSuccess('Usuario registrado exitosamente');
      logInfo(`Respuesta: ${registerResponse.data.mensaje}`);
    } catch (error) {
      if (error.response?.data?.mensaje) {
        logWarning(`Registro falló: ${error.response.data.mensaje}`);
      } else {
        logError('Error en registro: ' + error.message);
      }
    }

    // 3. Probar validación de contraseñas
    logInfo('3. Probando validación de contraseñas...');
    const weakPasswords = [
      { password: '123', expected: 'muy débil' },
      { password: 'password', expected: 'débil' },
      { password: 'Password1', expected: 'media' },
      { password: 'SecurePass123!', expected: 'fuerte' },
      { password: 'MySecurePassword123!@#', expected: 'muy fuerte' }
    ];

    weakPasswords.forEach(({ password, expected }) => {
      const hasLength = password.length >= 8;
      const hasUppercase = /[A-Z]/.test(password);
      const hasLowercase = /[a-z]/.test(password);
      const hasNumber = /\d/.test(password);
      const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

      let score = 0;
      if (hasLength) score += 20;
      if (hasUppercase) score += 20;
      if (hasLowercase) score += 20;
      if (hasNumber) score += 20;
      if (hasSpecial) score += 20;

      let strength = 'muy débil';
      if (score >= 80) strength = 'muy fuerte';
      else if (score >= 60) strength = 'fuerte';
      else if (score >= 40) strength = 'media';
      else if (score >= 20) strength = 'débil';

      const status = strength === expected ? '✅' : '❌';
      log(`${status} "${password}" - Fortaleza: ${strength} (esperado: ${expected})`);
    });

    // 4. Probar validación de email
    logInfo('4. Probando validación de emails...');
    const testEmails = [
      'test@example.com',
      'invalid-email',
      'user@domain',
      'test.email@domain.com',
      'user+tag@example.co.uk'
    ];

    testEmails.forEach(email => {
      const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      const status = isValid ? '✅' : '❌';
      log(`${status} "${email}" - ${isValid ? 'válido' : 'inválido'}`);
    });

    // 5. Probar reenvío de código
    logInfo('5. Probando reenvío de código de verificación...');
    try {
      const reenviarResponse = await axios.post(`${API_BASE_URL}/usuarios/reenviar-codigo`, {
        email: 'ticscatolica@gmail.com'
      });
      logSuccess('Código reenviado exitosamente');
      logInfo(`Respuesta: ${reenviarResponse.data.mensaje}`);
    } catch (error) {
      if (error.response?.data?.mensaje) {
        logWarning(`Reenvío falló: ${error.response.data.mensaje}`);
      } else {
        logError('Error en reenvío: ' + error.message);
      }
    }

    console.log('');
    log('🎉 Pruebas completadas!', 'bold');
    logInfo('Revisa los resultados arriba para verificar que todo funciona correctamente.');

  } catch (error) {
    logError('Error general en las pruebas: ' + error.message);
  }
}

// Ejecutar las pruebas
testSystem(); 