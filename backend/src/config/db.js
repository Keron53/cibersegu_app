const mongoose = require('mongoose');

console.log('Intentando conectar a MongoDB...');

mongoose.connect('mongodb://localhost:27017/firmasDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Conexión a MongoDB establecida correctamente.');
}).catch(err => {
  console.error('Error al conectar a MongoDB:', err);
});
