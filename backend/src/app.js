const express = require('express');
const app = express();
const cors = require('cors');
const usuarioRoutes = require('./api/usuarioRoutes');
const documentoRoutes = require('./api/documentoRoutes');
const certificadoRoutes = require('./api/certificadoRoutes')
require('./config/db'); // Importar la conexión a la base de datos
const path = require('path');

app.use(express.json());
app.use(cors());

app.use('/api/usuarios', usuarioRoutes);
app.use('/api/documentos', documentoRoutes);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/api/certificados', certificadoRoutes)

app.listen(3001, () => {
  console.log('Servidor iniciado en http://localhost:3001');
});
