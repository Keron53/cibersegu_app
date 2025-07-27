// Script para verificar variables de entorno
require('dotenv').config();

console.log('🔍 Verificando variables de entorno...');
console.log('');

// Verificar variables críticas
const variables = {
  'EMAIL_USER': process.env.EMAIL_USER,
  'EMAIL_PASS': process.env.EMAIL_PASS,
  'MONGODB_URI': process.env.MONGODB_URI,
  'JWT_SECRET': process.env.JWT_SECRET,
  'PORT': process.env.PORT,
  'NODE_ENV': process.env.NODE_ENV
};

console.log('📋 Variables de entorno:');
Object.entries(variables).forEach(([key, value]) => {
  if (value) {
    console.log(`✅ ${key}: ${key.includes('PASS') ? '***configurado***' : value}`);
  } else {
    console.log(`❌ ${key}: NO CONFIGURADO`);
  }
});

console.log('');
console.log('🔧 Configuración de email:');
console.log(`Usuario: ${process.env.EMAIL_USER || 'NO CONFIGURADO'}`);
console.log(`Contraseña: ${process.env.EMAIL_PASS ? 'CONFIGURADO' : 'NO CONFIGURADO'}`);

if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  console.log('✅ Configuración de email completa');
} else {
  console.log('❌ Configuración de email incompleta');
}

console.log('');
console.log('🎯 Estado del sistema:');
console.log(`- Servidor: ${process.env.PORT || 3001}`);
console.log(`- Base de datos: ${process.env.MONGODB_URI || 'mongodb://localhost:27017/digital_sign'}`);
console.log(`- Entorno: ${process.env.NODE_ENV || 'development'}`); 