const mongoose = require('mongoose');
const Certificate = require('../src/models/Certificate');

async function cleanInvalidCertificates() {
  try {
    console.log('🔍 Conectando a MongoDB...');
    
    // Usar la misma configuración que el backend
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:MongoDB2024%21%40%23Seguro@mongodb:27017/firmasDB?authSource=admin';
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    console.log('\n🔍 Buscando certificados inválidos...');
    
    // Buscar certificados sin datos cifrados
    const invalidCertificates = await Certificate.find({
      $or: [
        { datosCifrados: { $exists: false } },
        { datosCifrados: null }
      ]
    });

    // Filtrar también los que tienen datosCifrados vacíos
    const emptyDataCertificates = await Certificate.find({
      datosCifrados: { $exists: true, $ne: null }
    });

    const trulyInvalid = emptyDataCertificates.filter(cert => 
      !cert.datosCifrados || cert.datosCifrados.length === 0
    );

    const allInvalid = [...invalidCertificates, ...trulyInvalid];

    if (allInvalid.length === 0) {
      console.log('✅ No se encontraron certificados inválidos');
      return;
    }

    console.log(`❌ Encontrados ${allInvalid.length} certificados inválidos:\n`);

    for (const cert of allInvalid) {
      console.log(`   - ${cert.nombreComun || 'Sin nombre'} (${cert._id})`);
      console.log(`     Problema: datosCifrados vacíos o faltantes`);
      console.log(`     Salt: ${cert.encryptionSalt ? '✅ Presente' : '❌ Faltante'}`);
      console.log(`     IV: ${cert.encryptionKey ? '✅ Presente' : '❌ Faltante'}`);
      console.log('');
    }

    console.log('🗑️ Eliminando certificados inválidos...');
    
    // Eliminar certificados inválidos uno por uno
    let deletedCount = 0;
    for (const cert of allInvalid) {
      try {
        await Certificate.findByIdAndDelete(cert._id);
        deletedCount++;
        console.log(`   ✅ Eliminado: ${cert.nombreComun || 'Sin nombre'} (${cert._id})`);
      } catch (deleteError) {
        console.log(`   ❌ Error eliminando: ${cert.nombreComun || 'Sin nombre'} - ${deleteError.message}`);
      }
    }

    console.log(`✅ Eliminados ${deletedCount} certificados inválidos`);

    // Verificar certificados restantes
    console.log('\n🔍 Verificando certificados restantes...');
    const remainingCertificates = await Certificate.find({});
    console.log(`📊 Total de certificados válidos: ${remainingCertificates.length}`);

    // Verificar que no queden certificados corruptos
    const stillInvalid = await Certificate.find({
      $or: [
        { datosCifrados: { $exists: false } },
        { datosCifrados: null },
        { $expr: { $eq: [{ $strLenCP: { $toString: "$datosCifrados" } }, 0] } }
      ]
    });

    if (stillInvalid.length === 0) {
      console.log('✅ Todos los certificados restantes son válidos');
    } else {
      console.log(`❌ Aún quedan ${stillInvalid.length} certificados inválidos`);
    }

  } catch (error) {
    console.error('❌ Error durante la limpieza:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
  }
}

// Ejecutar limpieza
cleanInvalidCertificates();
