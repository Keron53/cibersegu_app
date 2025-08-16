#!/usr/bin/env node

/**
 * Script de prueba para verificar notificaciones
 * Uso: node test-notifications.js
 */

require('dotenv').config();

// Función para probar email
async function testEmail() {
  console.log('📧 Probando configuración de email...');
  
  try {
    const nodemailer = require('nodemailer');
    
    // Verificar variables de entorno
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error('❌ Variables de entorno SMTP no configuradas');
      console.log('📝 Configura en tu archivo .env:');
      console.log('SMTP_USER=tu-email@gmail.com');
      console.log('SMTP_PASS=tu-contraseña-de-aplicacion');
      return false;
    }
    
    console.log('✅ Variables de entorno SMTP configuradas');
    console.log(`📧 Usuario: ${process.env.SMTP_USER}`);
    console.log(`🔑 Contraseña: ${process.env.SMTP_PASS ? 'Configurada' : 'No configurada'}`);
    
    // Crear transportador
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    
    // Verificar conexión
    await transporter.verify();
    console.log('✅ Conexión SMTP exitosa');
    
    // Enviar email de prueba
    const info = await transporter.sendMail({
      from: `"Sistema de Firmas Digitales" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER, // Enviar a ti mismo para prueba
      subject: '🧪 Prueba de Email - Sistema de Firmas',
      html: `
        <h1>Prueba de Email</h1>
        <p>Este es un email de prueba para verificar que la configuración SMTP funciona correctamente.</p>
        <p>Si recibes este email, la configuración está funcionando.</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
      `
    });
    
    console.log('✅ Email de prueba enviado exitosamente');
    console.log('📨 Message ID:', info.messageId);
    return true;
    
  } catch (error) {
    console.error('❌ Error en prueba de email:', error.message);
    return false;
  }
}

// Función para probar WebSocket
async function testWebSocket() {
  console.log('\n🔌 Probando conexión WebSocket...');
  
  try {
    const response = await fetch('http://localhost:3000/test');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ WebSocket funcionando:', data.message);
      console.log('👥 Usuarios conectados:', data.usuariosConectados);
      console.log('⏰ Timestamp:', data.timestamp);
      return true;
    } else {
      console.error('❌ Error en WebSocket:', response.status, response.statusText);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error conectando a WebSocket:', error.message);
    console.log('💡 Asegúrate de que el servidor WebSocket esté corriendo en puerto 3000');
    return false;
  }
}

// Función para probar notificación WebSocket
async function testWebSocketNotification() {
  console.log('\n📨 Probando notificación WebSocket...');
  
  try {
    // Simular una notificación de solicitud múltiple
    const notificacion = {
      userId: 'test-user-123',
      documento: {
        tipo: 'solicitud_multiple',
        solicitudId: 'test-solicitud-123',
        titulo: 'Prueba de Solicitud Múltiple',
        documentoNombre: 'Documento de Prueba.pdf',
        solicitanteNombre: 'Usuario de Prueba',
        mensaje: 'Esta es una notificación de prueba',
        fechaExpiracion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      }
    };
    
    const response = await fetch('http://localhost:3000/emitir', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notificacion)
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Notificación WebSocket enviada:', data.message);
      console.log('📋 Tipo:', data.tipo);
      console.log('⏰ Timestamp:', data.timestamp);
      return true;
    } else {
      const errorData = await response.json();
      console.error('❌ Error enviando notificación:', errorData);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error en prueba de notificación WebSocket:', error.message);
    return false;
  }
}

// Función principal
async function runTests() {
  console.log('🧪 Iniciando pruebas de notificaciones...\n');
  
  const emailTest = await testEmail();
  const webSocketTest = await testWebSocket();
  const webSocketNotificationTest = await testWebSocketNotification();
  
  console.log('\n📊 Resumen de Pruebas:');
  console.log(`📧 Email: ${emailTest ? '✅ PASÓ' : '❌ FALLÓ'}`);
  console.log(`🔌 WebSocket: ${webSocketTest ? '✅ PASÓ' : '❌ FALLÓ'}`);
  console.log(`📨 Notificación WebSocket: ${webSocketNotificationTest ? '✅ PASÓ' : '❌ FALLÓ'}`);
  
  if (emailTest && webSocketTest && webSocketNotificationTest) {
    console.log('\n🎉 ¡Todas las pruebas pasaron! El sistema de notificaciones está funcionando correctamente.');
  } else {
    console.log('\n⚠️ Algunas pruebas fallaron. Revisa la configuración.');
    
    if (!emailTest) {
      console.log('\n🔧 Para solucionar problemas de email:');
      console.log('1. Verifica que tengas verificación en 2 pasos activada en Gmail');
      console.log('2. Genera una contraseña de aplicación');
      console.log('3. Configura las variables SMTP_USER y SMTP_PASS en tu archivo .env');
    }
    
    if (!webSocketTest) {
      console.log('\n🔧 Para solucionar problemas de WebSocket:');
      console.log('1. Asegúrate de que el servidor WebSocket esté corriendo en puerto 3000');
      console.log('2. Verifica que no haya conflictos de puerto');
    }
  }
}

// Ejecutar pruebas si el script se ejecuta directamente
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testEmail, testWebSocket, testWebSocketNotification };
