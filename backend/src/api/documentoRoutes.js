const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const documentoController = require('../controllers/documentoController')
const auth = require('../middleware/auth');

const router = express.Router()

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
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (
      file.mimetype === 'application/pdf' ||
      file.mimetype === 'application/x-pkcs12' ||
      file.mimetype === 'application/octet-stream' ||
      file.originalname.endsWith('.p12')
    ) {
      cb(null, true)
    } else {
      cb(new Error('Solo se permiten archivos PDF o .p12'), false)
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB máximo
  }
})

// Ruta deprecada para firma visual con pyHanko (ahora usa /firmar-qr-node)
router.post('/firmar-visible', upload.fields([
    { name: 'pdf', maxCount: 1 },
    { name: 'cert', maxCount: 1 }
]), documentoController.firmarDocumentoVisible);

router.post('/firmar-node', upload.fields([
    { name: 'pdf', maxCount: 1 },
    { name: 'cert', maxCount: 1 }
]), documentoController.firmarDocumentoNode);

router.post('/firmar-qr-node', upload.fields([
    { name: 'pdf', maxCount: 1 },
    { name: 'cert', maxCount: 1 }
]), documentoController.firmarDocumentoQRNode);

// Nueva ruta para firmar documento y guardar información en BD
router.post('/:documentoId/firmar', auth, documentoController.firmarDocumentoConInfo);

router.post('/subir', auth, upload.any(), documentoController.subirDocumento);

router.get('/', auth, documentoController.listarDocumentos);
router.get('/:id', auth, documentoController.obtenerDocumento);
router.get('/:id/info', auth, documentoController.infoDocumento);
router.get('/:id/download', auth, documentoController.descargarDocumento);
router.delete('/:id', auth, documentoController.eliminarDocumento);

module.exports = router 