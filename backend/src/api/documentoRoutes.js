const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const documentoController = require('../controllers/documentoController')
const auth = require('../middleware/auth')

const router = express.Router()

// Debug: verificar que el controlador se importe correctamente


// Configuración de multer para subir archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    // Generar nombre único para el archivo
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Solo permitir PDFs
    if (file.mimetype === 'application/pdf') {
      cb(null, true)
    } else {
      cb(new Error('Solo se permiten archivos PDF'), false)
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB máximo
  }
})

// Rutas para documentos
router.post('/subir', auth, upload.single('documento'), documentoController.subir)
router.get('/', auth, documentoController.listar)
router.get('/:id', auth, documentoController.ver)
router.delete('/:id', auth, documentoController.eliminar)

// Nueva ruta para procesar firmas digitales
router.post('/:id/firmar', auth, documentoController.firmarDocumento)

// Nueva ruta para obtener información del PDF
router.get('/:id/info', auth, documentoController.obtenerInfoPDF)

module.exports = router 