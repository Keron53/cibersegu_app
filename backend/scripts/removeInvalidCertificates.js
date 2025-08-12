const mongoose = require('mongoose');
require('dotenv').config();
const Certificate = require('../src/models/Certificate');

async function removeInvalidCertificates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('🔍 Buscando y eliminando certificados sin datos cifrados...');
    
    // Encontrar y eliminar certificados sin datos cifrados
    const result = await Certificate.deleteMany({
      $or: [
        { datosCifrados: { $exists: false } },
        { datosCifrados: null }
      ],
      $and: [
        { filename: { $exists: true } },
        { filename: { $ne: null } }
      ]
    });

    console.log(`✅ Se eliminaron ${result.deletedCount} certificados sin datos cifrados.`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al eliminar certificados:', error);
    process.exit(1);
  }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  console.log('⚠️  Esta acción eliminará permanentemente los certificados sin datos cifrados.');
  console.log('   Asegúrate de tener una copia de seguridad antes de continuar.');
  
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  readline.question('¿Estás seguro de que deseas continuar? (s/n) ', async (answer) => {
    if (answer.toLowerCase() === 's') {
      await removeInvalidCertificates();
    } else {
      console.log('Operación cancelada.');
      process.exit(0);
    }
    readline.close();
  });
}
