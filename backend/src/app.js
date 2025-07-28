// Cargar variables de entorno al inicio
require('dotenv').config();

const express = require('express');
const app = express();
const cors = require('cors');
const usuarioRoutes = require('./api/usuarioRoutes');
const documentoRoutes = require('./api/documentoRoutes');
const certificadoRoutes = require('./api/certificadoRoutes');
const validacionRoutes = require('./api/validacionRoutes');
const solicitudFirmaRoutes = require('./api/solicitudFirmaRoutes');
require('./config/db'); // Importar la conexión a la base de datos
const path = require('path');
const CertificateManager = require('./utils/CertificateManager');

app.use(express.json());
app.use(cors());

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
