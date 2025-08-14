const mongoose = require('mongoose');
require('dotenv').config();
const Certificate = require('../src/models/Certificate');

async function deleteInvalidCertificates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('🔍 Buscando y eliminando certificados sin datos cifrados...');
    
    // Find and delete certificates without encrypted data
    const result = await Certificate.deleteMany({
      $or: [
        { datosCifrados: { $exists: false } },
        { datosCifrados: null },
        { $where: '!this.datosCifrados || this.datosCifrados.length === 0' }
      ]
    });

    console.log(`✅ Se eliminaron ${result.deletedCount} certificados sin datos cifrados.`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al eliminar certificados inválidos:', error);
    process.exit(1);
  }
}

deleteInvalidCertificates();
