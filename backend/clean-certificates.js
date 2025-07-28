#!/usr/bin/env node

/**
 * Script para limpiar certificados problemáticos
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Certificate = require('./src/models/Certificate');

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/digital_sign');
    console.log('✅ Conectado a MongoDB');
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error);
    process.exit(1);
  }
}

async function cleanCertificates() {
  try {
    console.log('🧹 Limpiando certificados problemáticos...\n');
    
    // Encontrar certificados con datos vacíos o problemas
    const problematicCerts = await Certificate.find({
      $or: [
        { datosCifrados: { $exists: false } },
        { datosCifrados: null },
        { $expr: { $eq: [{ $strLenCP: { $toString: "$datosCifrados" } }, 0] } }
      ]
    });
    
    console.log(`📊 Certificados problemáticos encontrados: ${problematicCerts.length}`);
    
    if (problematicCerts.length > 0) {
      console.log('\n🗑️ Eliminando certificados problemáticos:');
      
      for (const cert of problematicCerts) {
        console.log(`   - ${cert.nombreComun || 'Sin nombre'} (${cert._id})`);
        await Certificate.findByIdAndDelete(cert._id);
      }
      
      console.log('\n✅ Certificados eliminados');
    } else {
      console.log('✅ No se encontraron certificados problemáticos para eliminar');
    }
    
    // Mostrar certificados restantes
    const remainingCerts = await Certificate.find({});
    console.log(`\n📊 Certificados restantes: ${remainingCerts.length}`);
    
    for (const cert of remainingCerts) {
      console.log(`   - ${cert.nombreComun || 'Sin nombre'} (${cert._id}) - Tamaño: ${cert.datosCifrados ? cert.datosCifrados.length : 0}`);
    }
    
  } catch (error) {
    console.error('❌ Error limpiando certificados:', error);
  }
}

async function main() {
  await connectDB();
  await cleanCertificates();
  await mongoose.disconnect();
  console.log('👋 Desconectado de MongoDB');
}

if (require.main === module) {
  main().catch(console.error);
} 