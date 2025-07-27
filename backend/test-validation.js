const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Colores para console
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️ ${msg}${colors.reset}`),
  title: (msg) => console.log(`${colors.bold}${colors.blue}${msg}${colors.reset}`)
};

const BASE_URL = 'http://localhost:3001/api';

async function testValidation() {
  log.title('\n🧪 PRUEBA DE VALIDACIÓN DE PDFs\n');

  try {
    // 1. Probar validación con PDF sin firmas
    log.info('1. Probando validación con PDF sin firmas...');
    
    // Crear un PDF de prueba simple
    const testPdfPath = path.join(__dirname, 'test-validation.pdf');
    
    // Simular un PDF básico (esto es solo para prueba)
    const pdfContent = '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 12 Tf\n72 720 Td\n(Test PDF) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000204 00000 n \ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n297\n%%EOF';
    
    fs.writeFileSync(testPdfPath, pdfContent);

    const formData = new FormData();
    formData.append('pdf', fs.createReadStream(testPdfPath));

    try {
      const response = await axios.post(`${BASE_URL}/validacion/validar-pdf`, formData, {
        headers: formData.getHeaders()
      });

      if (response.data.validation.isValid === false) {
        log.success('PDF sin firmas detectado correctamente');
        console.log('   Mensaje:', response.data.validation.message);
      } else {
        log.warning('Resultado inesperado para PDF sin firmas');
      }
    } catch (error) {
      log.error('Error en validación de PDF sin firmas:');
      console.log('   ', error.response?.data?.message || error.message);
    }

    // 2. Probar validación con URL inválida
    log.info('2. Probando validación con URL inválida...');
    
    try {
      const response = await axios.post(`${BASE_URL}/validacion/validar-pdf-url`, {
        url: 'https://ejemplo.com/archivo-inexistente.pdf'
      });

      log.warning('Se esperaba un error para URL inválida');
    } catch (error) {
      if (error.response?.status === 400) {
        log.success('URL inválida rechazada correctamente');
        console.log('   Mensaje:', error.response.data.message);
      } else {
        log.error('Error inesperado con URL inválida:');
        console.log('   ', error.response?.data?.message || error.message);
      }
    }

    // 3. Probar validación de integridad
    log.info('3. Probando verificación de integridad...');
    
    try {
      const formDataIntegrity = new FormData();
      formDataIntegrity.append('pdf', fs.createReadStream(testPdfPath));

      const response = await axios.post(`${BASE_URL}/validacion/verificar-integridad`, formDataIntegrity, {
        headers: formDataIntegrity.getHeaders()
      });

      log.success('Verificación de integridad completada');
      console.log('   Archivo:', response.data.fileName);
      console.log('   Modificado:', response.data.isModified);
      console.log('   Mensaje:', response.data.message);
    } catch (error) {
      log.error('Error en verificación de integridad:');
      console.log('   ', error.response?.data?.message || error.message);
    }

    // 4. Probar información de firmas
    log.info('4. Probando obtención de información de firmas...');
    
    try {
      const formDataInfo = new FormData();
      formDataInfo.append('pdf', fs.createReadStream(testPdfPath));

      const response = await axios.post(`${BASE_URL}/validacion/informacion-firmas`, formDataInfo, {
        headers: formDataInfo.getHeaders()
      });

      log.success('Información de firmas obtenida');
      console.log('   Archivo:', response.data.fileName);
      console.log('   Número de firmas:', response.data.signatureCount);
    } catch (error) {
      log.error('Error obteniendo información de firmas:');
      console.log('   ', error.response?.data?.message || error.message);
    }

    // Limpiar archivo de prueba
    if (fs.existsSync(testPdfPath)) {
      fs.unlinkSync(testPdfPath);
    }

    log.title('\n✅ PRUEBAS DE VALIDACIÓN COMPLETADAS\n');

  } catch (error) {
    log.error('Error general en pruebas de validación:');
    console.log('   ', error.message);
  }
}

// Función para probar con un PDF firmado real
async function testWithSignedPDF(pdfPath) {
  if (!fs.existsSync(pdfPath)) {
    log.error(`El archivo ${pdfPath} no existe`);
    return;
  }

  log.title(`\n🧪 PRUEBA CON PDF FIRMADO: ${path.basename(pdfPath)}\n`);

  try {
    const formData = new FormData();
    formData.append('pdf', fs.createReadStream(pdfPath));

    const response = await axios.post(`${BASE_URL}/validacion/validar-pdf`, formData, {
      headers: formData.getHeaders()
    });

    log.success('Validación completada');
    console.log('   Archivo:', response.data.fileName);
    console.log('   Válido:', response.data.validation.isValid);
    console.log('   Mensaje:', response.data.validation.message);
    
    if (response.data.validation.details) {
      console.log('   Firmas encontradas:', response.data.validation.details.signatureCount);
      console.log('   Modificado:', response.data.validation.details.isModified);
      console.log('   Nuestro sistema:', response.data.validation.details.isOurSystem);
      console.log('   Certificado válido:', response.data.validation.details.certificateInfo.isValid);
    }

    if (response.data.qrInfo) {
      console.log('   Información QR disponible');
    }

  } catch (error) {
    log.error('Error validando PDF firmado:');
    console.log('   ', error.response?.data?.message || error.message);
  }
}

// Ejecutar pruebas
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    // Si se proporciona una ruta de PDF, probar con ese archivo
    testWithSignedPDF(args[0]);
  } else {
    // Ejecutar pruebas básicas
    testValidation();
  }
}

module.exports = { testValidation, testWithSignedPDF }; 