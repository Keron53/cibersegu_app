#!/usr/bin/env node

/**
 * Script para probar directamente el endpoint del WebSocket
 */

async function testWebSocketEndpoint() {
  const testData = {
    userId: '68952fe68f0807f5a5fd1143', // Tu ID de usuario
    documento: {
      tipo: 'solicitud_multiple',
      solicitudId: 'test-solicitud-123',
      titulo: 'Contrato de Prueba',
      documentoNombre: 'contrato-test.pdf',
      solicitanteNombre: 'Walter Santiago',
      mensaje: 'Por favor firma este documento de prueba',
      fechaExpiracion: '2025-08-25T23:59:59.000Z'
    }
  };

  try {
    console.log('🧪 Enviando datos de prueba al WebSocket:');
    console.log(JSON.stringify(testData, null, 2));

    const response = await fetch('http://localhost:3000/emitir', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Respuesta exitosa:', result);
    } else {
      const error = await response.text();
      console.log('❌ Error:', response.status, error);
    }
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
  }
}

// Ejecutar prueba
testWebSocketEndpoint();
