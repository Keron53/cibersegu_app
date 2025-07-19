const express = require('express');
const app = express();
const cors = require('cors');

app.use(express.json());
app.use(cors());

// Ruta de prueba
app.get('/api/test', (req, res) => {
  res.json({ message: 'Servidor funcionando correctamente' });
});

// Ruta de prueba para certificados
app.get('/api/certificados/test', (req, res) => {
  res.json({ message: 'Ruta de certificados funcionando' });
});

app.listen(3001, () => {
  console.log('Servidor de prueba iniciado en http://localhost:3001');
  console.log('Prueba: http://localhost:3001/api/test');
  console.log('Prueba certificados: http://localhost:3001/api/certificados/test');
}); 