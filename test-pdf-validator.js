const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

async function testPyHanko() {
  console.log('🧪 Probando pyHanko...');
  
  try {
    // Verificar si pyHanko está instalado
    console.log('📦 Verificando instalación de pyHanko...');
    const version = execSync('python -m pyhanko --version', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    console.log('✅ pyHanko instalado:', version.trim());
    
    // Verificar comandos disponibles
    console.log('🔍 Verificando comandos disponibles...');
    const help = execSync('python -m pyhanko.cli --help', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    console.log('📋 Comandos disponibles:', help.substring(0, 200) + '...');
    
    // Verificar si hay un PDF de prueba
    const testPdfPath = path.join(__dirname, 'test.pdf');
    if (fs.existsSync(testPdfPath)) {
      console.log('📄 Probando con PDF de prueba:', testPdfPath);
      
      try {
        const validateOutput = execSync(`python -m pyhanko.cli validate "${testPdfPath}"`, {
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'pipe']
        });
        console.log('✅ Validación exitosa:', validateOutput.substring(0, 200) + '...');
      } catch (validateError) {
        console.log('❌ Error en validación:', validateError.message);
      }
      
      try {
        const dumpOutput = execSync(`python -m pyhanko.cli dump "${testPdfPath}"`, {
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'pipe']
        });
        console.log('✅ Dump exitoso:', dumpOutput.substring(0, 200) + '...');
      } catch (dumpError) {
        console.log('❌ Error en dump:', dumpError.message);
      }
    } else {
      console.log('⚠️ No hay PDF de prueba en:', testPdfPath);
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

testPyHanko(); 