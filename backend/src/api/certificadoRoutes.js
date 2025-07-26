const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const fs = require('fs-extra')
const CertificateManager = require('../utils/CertificateManager');
const certificadoController = require('../controllers/certificadoController');
const auth = require('../middleware/auth');

// Configuramos multer para guardar archivos temporalmente en la carpeta /uploads
const upload = multer({
  dest: path.join(__dirname, '../../uploads/')
})

// Ruta de prueba sin autenticación
router.get('/test', (req, res) => {
  res.json({ message: 'Ruta de certificados funcionando correctamente' });
});

// Ruta GET para listar todos los certificados del usuario
router.get('/', auth, certificadoController.listCertificates);

// Ruta POST que recibe un archivo .p12 y una contraseña para cifrarlo
router.post('/upload', auth, upload.single('file'), certificadoController.uploadCertificate);

// Ruta POST para generar un nuevo certificado digital (compatible con pyHanko)
router.post('/generate', auth, certificadoController.generateCertificate);

// Ruta POST para descargar un certificado específico
router.post('/download/:certificateId', auth, certificadoController.downloadCertificate);

// Ruta DELETE para eliminar un certificado
router.delete('/:certificateId', auth, certificadoController.deleteCertificate);

// Ruta POST para validar la contraseña de un certificado
router.post('/:certificateId/validate-password', auth, certificadoController.validateCertificatePassword);

module.exports = router
