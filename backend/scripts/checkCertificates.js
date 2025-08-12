const mongoose = require('mongoose');
require('dotenv').config();
const Certificate = require('../src/models/Certificate');

async function checkCertificates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('🔍 Buscando certificados sin datos cifrados...');
    
    // Encontrar certificados que no tengan ni certificateData ni datosCifrados
    const certificates = await Certificate.find({
      $or: [
        { datosCifrados: { $exists: false } },
        { datosCifrados: null }
      ],
      $and: [
        { filename: { $exists: true } },
        { filename: { $ne: null } }
      ]
    });

    console.log(`📊 Total de certificados sin datos cifrados: ${certificates.length}`);
    
    if (certificates.length > 0) {
      console.log('\n📋 Lista de certificados afectados:');
      certificates.forEach(cert => {
        console.log(`- ID: ${cert._id}, Nombre: ${cert.originalFilename || cert.filename || 'Sin nombre'}`);
      });
      
      console.log('\n⚠️  Se recomienda eliminar estos certificados y volver a subirlos.');
      console.log('   Los certificados sin datos cifrados no son utilizables para firmar documentos.');
    } else {
      console.log('✅ No se encontraron certificados sin datos cifrados.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al verificar certificados:', error);
    process.exit(1);
  }
}

checkCertificates();
