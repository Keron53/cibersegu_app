const mongoose = require('mongoose');
const Certificate = require('../src/models/Certificate');

// Configuración de conexión
const MONGODB_URI = 'mongodb://admin:MongoDB2024%21%40%23Seguro@mongodb:27017/firmasDB?authSource=admin';

async function verifyCertificates() {
  try {
    console.log('🔍 Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    console.log('\n🔍 Verificando certificados...');
    const certificates = await Certificate.find({});
    
    if (certificates.length === 0) {
      console.log('ℹ️ No hay certificados en la base de datos');
      return;
    }

    console.log(`📊 Total de certificados encontrados: ${certificates.length}\n`);

    let validCount = 0;
    let invalidCount = 0;
    const invalidCertificates = [];

    for (const cert of certificates) {
      console.log(`🔍 Verificando certificado: ${cert.nombreComun || 'Sin nombre'} (${cert._id})`);
      
      const issues = [];
      
      // Verificar datos cifrados
      if (!cert.datosCifrados || cert.datosCifrados.length === 0) {
        issues.push('❌ datosCifrados: VACÍO o NO EXISTE');
      } else {
        console.log(`   ✅ datosCifrados: ${cert.datosCifrados.length} bytes`);
      }
      
      // Verificar salt
      if (!cert.encryptionSalt || cert.encryptionSalt.length !== 32) {
        issues.push(`❌ encryptionSalt: ${cert.encryptionSalt ? cert.encryptionSalt.length : 0} caracteres (debe ser 32)`);
      } else {
        console.log(`   ✅ encryptionSalt: ${cert.encryptionSalt.length} caracteres`);
      }
      
      // Verificar IV
      if (!cert.encryptionKey || cert.encryptionKey.length !== 32) {
        issues.push(`❌ encryptionKey: ${cert.encryptionKey ? cert.encryptionKey.length : 0} caracteres (debe ser 32)`);
      } else {
        console.log(`   ✅ encryptionKey: ${cert.encryptionKey.length} caracteres`);
      }
      
      // Verificar metadatos
      if (!cert.nombreComun) issues.push('❌ nombreComun: FALTANTE');
      if (!cert.organizacion) issues.push('❌ organizacion: FALTANTE');
      if (!cert.email) issues.push('❌ email: FALTANTE');
      
      if (issues.length === 0) {
        console.log('   ✅ Certificado VÁLIDO\n');
        validCount++;
      } else {
        console.log('   ❌ Certificado INVÁLIDO:');
        issues.forEach(issue => console.log(`      ${issue}`));
        console.log('');
        invalidCount++;
        invalidCertificates.push({
          id: cert._id,
          nombre: cert.nombreComun,
          issues: issues
        });
      }
    }

    // Resumen
    console.log('📊 RESUMEN DE VERIFICACIÓN:');
    console.log(`   ✅ Certificados válidos: ${validCount}`);
    console.log(`   ❌ Certificados inválidos: ${invalidCount}`);
    
    if (invalidCertificates.length > 0) {
      console.log('\n🚨 CERTIFICADOS INVÁLIDOS:');
      invalidCertificates.forEach(cert => {
        console.log(`   - ${cert.nombre || 'Sin nombre'} (${cert.id})`);
        cert.issues.forEach(issue => console.log(`     ${issue}`));
      });
      
      console.log('\n💡 RECOMENDACIONES:');
      console.log('   1. Eliminar certificados inválidos');
      console.log('   2. Regenerar certificados desde el frontend');
      console.log('   3. Verificar que el proceso de cifrado funcione correctamente');
    }

  } catch (error) {
    console.error('❌ Error durante la verificación:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
  }
}

// Ejecutar verificación
verifyCertificates();
