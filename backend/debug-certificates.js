#!/usr/bin/env node

/**
 * Script para diagnosticar y arreglar problemas con certificados
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Certificate = require('./src/models/Certificate');
const CertificateManager = require('./src/utils/CertificateManager');

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/digital_sign');
    console.log('✅ Conectado a MongoDB');
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error);
    process.exit(1);
  }
}

async function debugCertificates() {
  try {
    console.log('🔍 Diagnosticando certificados...\n');
    
    const certificates = await Certificate.find({});
    console.log(`📊 Total de certificados: ${certificates.length}\n`);
    
    let problematicCerts = [];
    let systemCerts = [];
    let normalCerts = [];
    
    for (const cert of certificates) {
      console.log(`\n📋 Certificado: ${cert.nombreComun || 'Sin nombre'}`);
      console.log(`   ID: ${cert._id}`);
      console.log(`   Usuario: ${cert.usuario}`);
      console.log(`   Tiene salt: ${!!cert.encryptionSalt}`);
      console.log(`   Tiene IV: ${!!cert.encryptionKey}`);
      console.log(`   Tamaño datos: ${cert.datosCifrados ? cert.datosCifrados.length : 0}`);
      
      // Clasificar certificados
      if (!cert.encryptionSalt && !cert.encryptionKey) {
        systemCerts.push(cert);
        console.log('   🔓 Tipo: Certificado del sistema (sin cifrado)');
      } else if (cert.encryptionSalt && cert.encryptionKey) {
        normalCerts.push(cert);
        console.log('   🔐 Tipo: Certificado cifrado normal');
        
        // Probar descifrado con contraseña por defecto
        try {
          CertificateManager.decryptCertificate(
            cert.datosCifrados,
            cert.encryptionSalt,
            cert.encryptionKey,
            '123456' // Contraseña por defecto
          );
          console.log('   ✅ Descifrado exitoso con contraseña por defecto');
        } catch (error) {
          console.log('   ❌ Error descifrando con contraseña por defecto:', error.message);
          problematicCerts.push(cert);
        }
      } else {
        problematicCerts.push(cert);
        console.log('   ⚠️ Tipo: Certificado con configuración inconsistente');
      }
    }
    
    console.log('\n📊 RESUMEN:');
    console.log(`   Certificados del sistema: ${systemCerts.length}`);
    console.log(`   Certificados normales: ${normalCerts.length}`);
    console.log(`   Certificados problemáticos: ${problematicCerts.length}`);
    
    if (problematicCerts.length > 0) {
      console.log('\n⚠️ CERTIFICADOS PROBLEMÁTICOS:');
      for (const cert of problematicCerts) {
        console.log(`   - ${cert.nombreComun || 'Sin nombre'} (${cert._id})`);
      }
      
      console.log('\n🔧 OPCIONES PARA ARREGLAR:');
      console.log('   1. Eliminar certificados problemáticos');
      console.log('   2. Convertir a certificados del sistema');
      console.log('   3. Regenerar certificados');
      
      // Aquí podrías agregar lógica para arreglar automáticamente
    }
    
  } catch (error) {
    console.error('❌ Error diagnosticando certificados:', error);
  }
}

async function fixProblematicCertificates() {
  try {
    console.log('🔧 Arreglando certificados problemáticos...\n');
    
    const certificates = await Certificate.find({
      $or: [
        { encryptionSalt: { $exists: false } },
        { encryptionKey: { $exists: false } },
        { encryptionSalt: null },
        { encryptionKey: null }
      ]
    });
    
    console.log(`📊 Certificados a arreglar: ${certificates.length}`);
    
    for (const cert of certificates) {
      console.log(`\n🔧 Arreglando: ${cert.nombreComun || 'Sin nombre'}`);
      
      // Convertir a certificado del sistema (sin cifrado)
      cert.encryptionSalt = undefined;
      cert.encryptionKey = undefined;
      await cert.save();
      
      console.log('   ✅ Convertido a certificado del sistema');
    }
    
    console.log('\n✅ Proceso completado');
    
  } catch (error) {
    console.error('❌ Error arreglando certificados:', error);
  }
}

async function main() {
  await connectDB();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'debug':
      await debugCertificates();
      break;
    case 'fix':
      await fixProblematicCertificates();
      break;
    default:
      console.log('Uso: node debug-certificates.js [debug|fix]');
      console.log('  debug: Diagnosticar certificados');
      console.log('  fix: Arreglar certificados problemáticos');
  }
  
  await mongoose.disconnect();
  console.log('👋 Desconectado de MongoDB');
}

if (require.main === module) {
  main().catch(console.error);
} 