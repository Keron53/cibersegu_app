// Cargar variables de entorno al inicio
require('dotenv').config();

const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const usuarioRoutes = require('./api/usuarioRoutes');
const documentoRoutes = require('./api/documentoRoutes');
const certificadoRoutes = require('./api/certificadoRoutes');
const validacionRoutes = require('./api/validacionRoutes');
const solicitudFirmaRoutes = require('./api/solicitudFirmaRoutes');
const { connectDB, checkDBConnection } = require('./config/db'); // Importar la conexión a la base de datos
const path = require('path');
const CertificateManager = require('./utils/CertificateManager');

app.use(express.json());
app.use(cors());

// Ruta de health check completa
app.get('/api/health', async (req, res) => {
  try {
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      services: {
        server: 'running',
        database: 'unknown',
        certificates: 'unknown'
      }
    };

    // Verificar conexión a MongoDB
    try {
      const isConnected = checkDBConnection();
      if (isConnected) {
        healthCheck.services.database = 'connected';
      } else {
        healthCheck.services.database = 'disconnected';
        healthCheck.status = 'degraded';
      }
    } catch (dbError) {
      healthCheck.services.database = 'error';
      healthCheck.status = 'unhealthy';
    }

    // Verificar certificados
    try {
      await CertificateManager.ensureCAExists();
      healthCheck.services.certificates = 'available';
    } catch (certError) {
      healthCheck.services.certificates = 'error';
      healthCheck.status = 'degraded';
    }

    // Determinar status final
    const hasErrors = Object.values(healthCheck.services).some(service => service === 'error');
    const hasDisconnected = Object.values(healthCheck.services).some(service => service === 'disconnected');
    
    if (hasErrors) {
      healthCheck.status = 'unhealthy';
      res.status(503);
    } else if (hasDisconnected) {
      healthCheck.status = 'degraded';
      res.status(200);
    } else {
      res.status(200);
    }

    res.json(healthCheck);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      services: {
        server: 'error',
        database: 'unknown',
        certificates: 'unknown'
      }
    });
  }
});

// Ruta de prueba para verificar que el servidor esté funcionando
app.get('/api/test', (req, res) => {
  res.json({ message: 'Servidor funcionando correctamente', timestamp: new Date().toISOString() });
});

app.use('/api/usuarios', usuarioRoutes);
app.use('/api/documentos', documentoRoutes);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/api/certificados', certificadoRoutes);
app.use('/api/validacion', validacionRoutes);
app.use('/api/solicitudes', solicitudFirmaRoutes);

// Asegurar que la CA exista al iniciar
CertificateManager.ensureCAExists();

app.listen(3001, () => {
  console.log('Servidor iniciado en http://localhost:3001');
});
