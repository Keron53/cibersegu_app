const CertificateManager = require('../utils/CertificateManager');
const forge = require('node-forge');

// Controlador para manejar la subida y cifrado de certificados .p12
const uploadCertificate = async (req, res) => {
  // Extraemos la contraseña y el ID del usuario desde el cuerpo de la solicitud
  const { password } = req.body;
  const userId = req.usuario.id; // ID de usuario desde el JWT
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

// Generar un nuevo certificado digital
const generateCertificate = async (req, res) => {
  try {
    const {
      commonName,
      organization,
      organizationalUnit,
      locality,
      state,
      country,
      email,
      password,
      validityDays
    } = req.body;

    // Validaciones
    if (!commonName || !password) {
      return res.status(400).json({ error: 'Nombre común y contraseña son obligatorios' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Generar clave privada RSA
    const keys = forge.pki.rsa.generateKeyPair(2048);
    
    // Crear certificado
    const cert = forge.pki.createCertificate();
    
    // Establecer clave pública
    cert.publicKey = keys.publicKey;
    
    // Establecer número de serie
    cert.serialNumber = '01';
    
    // Establecer fechas de validez
    const now = new Date();
    cert.validity.notBefore = now;
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setDate(now.getDate() + (validityDays || 365));
    
    // Crear subject y issuer (autofirmado)
    const subject = [{
      name: 'commonName',
      value: commonName
    }];
    
    if (organization) {
      subject.push({ name: 'organizationName', value: organization });
    }
    if (organizationalUnit) {
      subject.push({ name: 'organizationalUnitName', value: organizationalUnit });
    }
    if (locality) {
      subject.push({ name: 'localityName', value: locality });
    }
    if (state) {
      subject.push({ name: 'stateOrProvinceName', value: state });
    }
    if (country) {
      subject.push({ name: 'countryName', value: country });
    }
    if (email) {
      subject.push({ name: 'emailAddress', value: email });
    }
    
    cert.setSubject(subject);
    cert.setIssuer(subject); // Autofirmado
    
    // Firmar el certificado
    cert.sign(keys.privateKey, forge.md.sha256.create());
    
    // Crear archivo PKCS#12
    const p12Asn1 = forge.pkcs12.toPkcs12Asn1(
      keys.privateKey,
      [cert],
      password,
      {
        algorithm: '3des'
      }
    );
    
    // Convertir a buffer
    const p12Der = forge.asn1.toDer(p12Asn1).getBytes();
    const p12Buffer = Buffer.from(p12Der, 'binary');
    
    // Convertir a base64 para enviar al frontend
    const p12Base64 = p12Buffer.toString('base64');
    
    res.json({
      message: 'Certificado generado exitosamente',
      certificate: {
        data: p12Base64,
        filename: `${commonName}.p12`,
        subject: cert.subject.attributes.map(attr => `${attr.name}=${attr.value}`).join(', '),
        validFrom: cert.validity.notBefore,
        validTo: cert.validity.notAfter
      }
    });
    
  } catch (error) {
    console.error('Error al generar certificado:', error);
    res.status(500).json({ error: 'Error interno del servidor al generar el certificado' });
  }
};

// Funciones placeholder para las otras funciones que se exportan
const listCertificates = async (req, res) => {
  res.status(501).json({ error: 'Función no implementada aún' });
};

const downloadCertificate = async (req, res) => {
  res.status(501).json({ error: 'Función no implementada aún' });
};

module.exports = {
  uploadCertificate,
  listCertificates,
  downloadCertificate,
  generateCertificate
};
