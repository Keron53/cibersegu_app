const mongoose = require('mongoose');
const Certificate = require('./src/models/Certificate');

mongoose.connect('mongodb://localhost:27017/firmasDB');

async function checkCertificate() {
  try {
    console.log('🔍 Verificando certificado en la base de datos...\n');
    
    // Obtener el certificado más reciente
    const cert = await Certificate.findOne().sort({ createdAt: -1 });
    
    if (!cert) {
      console.log('❌ No se encontraron certificados');
      return;
    }
    
    console.log('📋 Certificado encontrado:');
    console.log(`   ID: ${cert._id}`);
    console.log(`   filename: "${cert.filename}"`);
    console.log(`   originalFilename: "${cert.originalFilename || 'NO EXISTE'}"`);
    console.log(`   nombreComun: "${cert.nombreComun || 'NO EXISTE'}"`);
    console.log(`   createdAt: ${cert.createdAt}`);
    console.log('');
    console.log('🔍 Todos los campos del documento:');
    console.log(JSON.stringify(cert.toObject(), null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkCertificate(); 