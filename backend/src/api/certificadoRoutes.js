const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const fs = require('fs-extra')
const CertificateManager = require('../utils/CertificateManager');
const { generateCertificate } = require('../controllers/certificadoController');
const auth = require('../middleware/auth');

// Configuramos multer para guardar archivos temporalmente en la carpeta /uploads
const upload = multer({
  dest: path.join(__dirname, '../../uploads/')
})

// Ruta POST que recibe un archivo .p12 y una contraseña para cifrarlo
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  const { password } = req.body // Extraemos la contraseña desde el cuerpo de la solicitud
  const userId = req.usuario.id  // ID de usuario desde el JWT

  // Validamos que tanto el archivo como la contraseña estén presentes
  if (!req.file || !password) {
    return res.status(400).json({ error: 'Falta archivo o contraseña' })
  }

  try {
    // Llamamos al método que cifra y almacena el certificado
    await CertificateManager.encryptAndStoreCertificate(req.file.path, password, userId)
    // Elimina archivo temporal
    await fs.remove(req.file.path)
    //Responde con exito
    res.status(200).json({ message: 'Certificado subido y cifrado correctamente' })
  } catch (err) {
    //Si ocurre un error durante el proceso, lo muestra y responde un error 500
    console.error(err)
    const message = err.message || 'Error al procesar el certificado'
    const statusCode = message.includes('contraseña') ? 400 : 500 // Devuelve 400 si es problema de usuario
    res.status(statusCode).json({ error: message })
  }
})

// Ruta POST para generar un nuevo certificado digital
router.post('/generate', auth, generateCertificate);

module.exports = router
