const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const fs = require('fs-extra')
const CertificateManager = require('../utils/CertificateManager');
const { uploadCertificate, generateCertificate, listCertificates, downloadCertificate, deleteCertificate, validateCertificatePassword } = require('../controllers/certificadoController');
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
router.get('/', auth, listCertificates);

// Ruta POST que recibe un archivo .p12 y una contraseña para cifrarlo
router.post('/upload', auth, upload.single('file'), uploadCertificate);

// Ruta POST para generar un nuevo certificado digital
router.post('/generate', auth, generateCertificate);

// Ruta POST para descargar un certificado específico
router.post('/download/:certificateId', auth, downloadCertificate);

// Ruta DELETE para eliminar un certificado
router.delete('/:certificateId', auth, deleteCertificate);

// Ruta POST para validar la contraseña de un certificado
router.post('/:certificateId/validate-password', auth, validateCertificatePassword);

module.exports = router
