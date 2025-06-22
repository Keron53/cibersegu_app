import { CertificateManager } from '../utils/CertificateManager.js';

// Controlador para manejar la subida y cifrado de certificados .p12
export const uploadCertificate = async (req, res) => {
  // Extraemos la contraseña y el ID del usuario desde el cuerpo de la solicitud
  const { password, userId } = req.body;
  // Obtenemos la ruta temporal del archivo subido (multer la añade como req.file.path)
  const filePath = req.file.path;

  try {
    // Usamos la clase CertificateManager para cifrar el certificado con la contraseña del usuario
    // y almacenarlo en la base de datos junto con el IV y el salt
    await CertificateManager.encryptAndStoreCertificate(filePath, password, userId);

    // Respondemos al cliente con un mensaje de éxito
    res.status(200).json({ message: 'Certificado almacenado exitosamente' });
  } catch (error) {
    // Si ocurre un error durante el cifrado o almacenamiento, devolvemos un error 500
    res.status(500).json({ error: error.message });
  }
};
