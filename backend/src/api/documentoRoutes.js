const express = require('express');
const router = express.Router();
const documentoController = require('../controllers/documentoController');
const multer = require('multer');
const path = require('path');
const authMiddleware = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Todas las rutas de documentos requieren autenticación
router.use(authMiddleware);

router.post('/subir', upload.single('pdf'), documentoController.subir);
router.get('/', documentoController.listar);
router.get('/:id', documentoController.ver);
router.delete('/:id', documentoController.eliminar);

module.exports = router; 