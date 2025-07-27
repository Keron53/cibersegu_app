const mongoose = require('mongoose');
const Usuario = require('./src/models/Usuario');

async function clearTestUsers() {
  try {
    // Conectar a MongoDB
    await mongoose.connect('mongodb://localhost:27017/digital_sign');
    console.log('✅ Conectado a MongoDB');

    // Buscar usuarios con email de prueba
    const testUsers = await Usuario.find({
      email: { $in: ['ticscatolica@gmail.com', 'test@gmail.com'] }
    });

    console.log(`📊 Encontrados ${testUsers.length} usuarios de prueba:`);
    testUsers.forEach(user => {
      console.log(`- ${user.nombre} (${user.email}) - ${user.username}`);
    });

    if (testUsers.length > 0) {
      // Eliminar usuarios de prueba
      await Usuario.deleteMany({
        email: { $in: ['ticscatolica@gmail.com', 'test@gmail.com'] }
      });
      console.log('✅ Usuarios de prueba eliminados');
    } else {
      console.log('ℹ️ No hay usuarios de prueba para eliminar');
    }

    console.log('🎉 Limpieza completada');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

clearTestUsers(); 