const CertificateManager = require('../utils/CertificateManager');
const forge = require('node-forge');
const Certificate = require('../models/Certificate'); // Added missing import
const fs = require('fs-extra'); // Added missing import
const path = require('path'); // Added missing import
const os = require('os');

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

// Listar todos los certificados del usuario
const listCertificates = async (req, res) => {
  try {
    const userId = req.usuario.id;
    
    const certificates = await Certificate.find({ userId })
      .select('filename createdAt updatedAt')
      .sort({ createdAt: -1 });
    
    res.json({
      certificates: certificates.map(cert => ({
        id: cert._id,
        filename: cert.filename,
        createdAt: cert.createdAt,
        updatedAt: cert.updatedAt
      }))
    });
  } catch (error) {
    console.error('Error al listar certificados:', error);
    res.status(500).json({ error: 'Error interno del servidor al listar certificados' });
  }
};

// Descargar un certificado específico
const downloadCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;
    const { password } = req.body;
    const userId = req.usuario.id;

    if (!password) {
      return res.status(400).json({ error: 'La contraseña es obligatoria' });
    }

    // Verificar que el certificado pertenece al usuario
    const certificate = await Certificate.findOne({ _id: certificateId, userId });
    if (!certificate) {
      return res.status(404).json({ error: 'Certificado no encontrado' });
    }

    // Crear archivo temporal para descifrar usando el directorio temporal del sistema
    const tempPath = path.join(os.tmpdir(), `cert_${Date.now()}.p12`);
    
    // Descifrar el certificado
    await CertificateManager.decryptAndRetrieveCertificate(certificateId, password, tempPath);
    
    // Enviar el archivo
    res.download(tempPath, certificate.filename, (err) => {
      // Limpiar archivo temporal
      fs.remove(tempPath).catch(console.error);
    });

  } catch (error) {
    console.error('Error al descargar certificado:', error);
    if (error.message.includes('contraseña') || error.message.includes('Certificado no encontrado')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Error interno del servidor al descargar el certificado' });
    }
  }
};

// Eliminar un certificado
const deleteCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;
    const userId = req.usuario.id;

    // Verificar que el certificado pertenece al usuario
    const certificate = await Certificate.findOneAndDelete({ _id: certificateId, userId });
    
    if (!certificate) {
      return res.status(404).json({ error: 'Certificado no encontrado' });
    }

    res.json({ message: 'Certificado eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar certificado:', error);
    res.status(500).json({ error: 'Error interno del servidor al eliminar el certificado' });
  }
};

module.exports = {
  uploadCertificate,
  listCertificates,
  downloadCertificate,
  generateCertificate,
  deleteCertificate
};
