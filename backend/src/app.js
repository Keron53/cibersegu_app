const express = require('express');
const app = express();
const cors = require('cors');
const usuarioRoutes = require('./api/usuarioRoutes');
require('./config/db'); // Importar la conexión a la base de datos

app.use(express.json());
app.use(cors());

app.use('/api/usuarios', usuarioRoutes);

app.listen(3001, () => {
  console.log('Servidor iniciado en http://localhost:3001');
});
