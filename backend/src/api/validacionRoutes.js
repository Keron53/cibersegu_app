const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const validacionController = require('../controllers/validacionController');

const router = express.Router();

// Configuración de multer para subir archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads/temp');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'validation-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos PDF'), false);
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB máximo para validación
  }
});

// Rutas de validación
router.post('/validar-pdf', upload.fields([{ name: 'pdf', maxCount: 1 }]), validacionController.validarPDF);
router.post('/validar-pdf-url', validacionController.validarPDFDesdeURL);
router.post('/informacion-firmas', upload.fields([{ name: 'pdf', maxCount: 1 }]), validacionController.obtenerInformacionFirmas);
router.post('/verificar-integridad', upload.fields([{ name: 'pdf', maxCount: 1 }]), validacionController.verificarIntegridad);

module.exports = router; 