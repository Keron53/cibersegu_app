const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');
const CertificateManager = require('../utils/CertificateManager');
const Usuario = require('../models/Usuario');
const Certificate = require('../models/Certificate');
const os = require('os');

const certificadoController = {
  // Subir certificado existente
  uploadCertificate: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No se subió ningún archivo' });
      }

      const { password } = req.body;
      if (!password) {
        return res.status(400).json({ error: 'La contraseña es requerida' });
      }

      const fileBuffer = fs.readFileSync(req.file.path);
      const encryptedResult = CertificateManager.encryptCertificate(fileBuffer, password);

      const certificate = new Certificate({
        userId: req.usuario.id,
        nombreComun: req.file.originalname.replace('.p12', ''),
        organizacion: '',
        email: '',
        datosCifrados: encryptedResult.encryptedData,
        encryptionSalt: encryptedResult.salt,
        encryptionKey: encryptedResult.iv,
        originalFilename: req.file.originalname
      });

      await certificate.save();

      // Limpiar archivo temporal
      fs.unlinkSync(req.file.path);

      res.json({
        message: 'Certificado subido exitosamente',
        certificate: {
          id: certificate._id,
          nombreComun: certificate.nombreComun,
          organizacion: certificate.organizacion,
          email: certificate.email,
          originalFilename: certificate.originalFilename
        }
      });
    } catch (error) {
      console.error('Error al subir certificado:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Generar certificado compatible con pyHanko usando OpenSSL
  generateCertificate: async (req, res) => {
    try {
      const {
        commonName,
        organization,
        organizationalUnit,
        locality,
        state,
        country,
        email,
        password
      } = req.body;

      // Validar campos requeridos
      if (!commonName || !password) {
        return res.status(400).json({ error: 'Nombre común y contraseña son requeridos' });
      }

      // Limpiar y limitar longitud de los campos
      const cleanName = (commonName || 'User').replace(/[^a-zA-Z0-9\s]/g, '').trim().substring(0, 64);
      const cleanOrg = (organization || 'Test Organization').replace(/[^a-zA-Z0-9\s]/g, '').trim().substring(0, 64);
      const cleanOU = (organizationalUnit || 'IT').replace(/[^a-zA-Z0-9\s]/g, '').trim().substring(0, 64);
      const cleanEmail = (email || 'test@example.com').replace(/[^a-zA-Z0-9@.-]/g, '').trim().substring(0, 64);
      const cleanLocality = (locality || 'Guayaquil').replace(/[^a-zA-Z0-9\s]/g, '').trim().substring(0, 64);
      const cleanState = (state || 'Guayas').replace(/[^a-zA-Z0-9\s]/g, '').trim().substring(0, 64);
      const cleanCountry = (country || 'EC').replace(/[^a-zA-Z]/g, '').trim().substring(0, 2);

      // Crear directorio temporal
      const tempDir = path.join(__dirname, '../../temp-certs');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const keyFile = path.join(tempDir, 'user.key');
      const certFile = path.join(tempDir, 'user.crt');
      const p12File = path.join(tempDir, 'user.p12');

      try {
        // Generar clave privada RSA 2048 bits
        console.log('🔑 Generando clave privada RSA...');
        execSync(`openssl genrsa -out "${keyFile}" 2048`, { 
          stdio: 'pipe',
          cwd: tempDir 
        });

        // Crear archivo de configuración para el certificado
        const configContent = `[req]
distinguished_name = req_distinguished_name
prompt = no
req_extensions = v3_req
string_mask = utf8only

[req_distinguished_name]
C = ${cleanCountry}
ST = ${cleanState}
L = ${cleanLocality}
O = ${cleanOrg}
OU = ${cleanOU}
CN = ${cleanName}
emailAddress = ${cleanEmail}

[v3_req]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = 127.0.0.1
`;

        const configFile = path.join(tempDir, 'openssl.conf');
        fs.writeFileSync(configFile, configContent);

        // Generar certificado firmado por la CA
        const caKeyPath = path.join(__dirname, '../../CrearCACentral/ca.key');
        const caCertPath = path.join(__dirname, '../../CrearCACentral/ca.crt');

        console.log('📝 Generando solicitud de certificado...');
        execSync(`openssl req -new -key "${keyFile}" -out "${tempDir}/user.csr" -config "${configFile}"`, { 
          stdio: 'pipe',
          cwd: tempDir 
        });

        console.log('🔐 Firmando certificado con CA...');
        execSync(`openssl x509 -req -in "${tempDir}/user.csr" -CA "${caCertPath}" -CAkey "${caKeyPath}" -CAcreateserial -out "${certFile}" -days 365 -extensions v3_req -extfile "${configFile}"`, { 
          stdio: 'pipe',
          cwd: tempDir 
        });

        // Convertir a PKCS#12
        console.log('📦 Convirtiendo a formato PKCS#12...');
        execSync(`openssl pkcs12 -export -out "${p12File}" -inkey "${keyFile}" -in "${certFile}" -passout pass:"${password}"`, { 
          stdio: 'pipe',
          cwd: tempDir 
        });

        // Leer el archivo .p12
        const p12Buffer = fs.readFileSync(p12File);

        // Cifrar y guardar en la base de datos
        const encryptedData = CertificateManager.encryptCertificate(p12Buffer, password);
        
        const certificate = new Certificate({
          userId: req.usuario.id,
          nombreComun: cleanName,
          organizacion: cleanOrg,
          email: cleanEmail,
          datosCifrados: encryptedData.encryptedData,
          encryptionSalt: encryptedData.salt,
          encryptionKey: encryptedData.iv,
          originalFilename: `${cleanName}.p12`
        });

        await certificate.save();

        // Limpiar archivos temporales
        const filesToClean = [
          keyFile, 
          certFile, 
          p12File, 
          configFile, 
          path.join(tempDir, 'user.csr'),
          path.join(tempDir, 'ca.srl')
        ];
        
        filesToClean.forEach(file => {
          if (fs.existsSync(file)) {
            try {
              fs.unlinkSync(file);
            } catch (e) {
              console.error('Error eliminando archivo temporal:', e);
            }
          }
        });

        console.log('✅ Certificado generado exitosamente');

        res.json({
          message: 'Certificado generado exitosamente',
          certificate: {
            id: certificate._id,
            nombreComun: certificate.nombreComun,
            organizacion: certificate.organizacion,
            email: certificate.email,
            originalFilename: certificate.originalFilename
          }
        });

      } catch (opensslError) {
        console.error('❌ Error generando certificado con OpenSSL:', opensslError);
        res.status(500).json({ 
          error: 'Error generando certificado con OpenSSL',
          details: opensslError.message 
        });
      }

    } catch (error) {
      console.error('❌ Error en generateCertificate:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Listar todos los certificados del usuario
  listCertificates: async (req, res) => {
    try {
      const certificates = await Certificate.find({ userId: req.usuario.id }).sort({ createdAt: -1 });
      res.json(certificates);
    } catch (error) {
      console.error('Error al listar certificados:', error);
      res.status(500).json({ error: 'Error al listar certificados' });
    }
  },

  // Descargar certificado
  downloadCertificate: async (req, res) => {
    try {
      const { certificateId } = req.params;
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({ error: 'La contraseña es requerida' });
      }

      const certificate = await Certificate.findOne({ 
        _id: certificateId, 
        userId: req.usuario.id 
      });

      if (!certificate) {
        return res.status(404).json({ error: 'Certificado no encontrado' });
      }

      const decryptedData = CertificateManager.decryptCertificate(
        certificate.datosCifrados, 
        certificate.encryptionSalt, 
        certificate.encryptionKey, 
        password
      );
      
      res.setHeader('Content-Type', 'application/x-pkcs12');
      res.setHeader('Content-Disposition', `attachment; filename="${certificate.originalFilename}"`);
      res.send(decryptedData);

    } catch (error) {
      console.error('Error al descargar certificado:', error);
      res.status(500).json({ error: 'Error al descargar certificado' });
    }
  },

  // Eliminar certificado
  deleteCertificate: async (req, res) => {
    try {
      const { certificateId } = req.params;
      const certificate = await Certificate.findOneAndDelete({ 
        _id: certificateId, 
        userId: req.usuario.id 
      });

      if (!certificate) {
        return res.status(404).json({ error: 'Certificado no encontrado' });
      }

      res.json({ message: 'Certificado eliminado correctamente' });
    } catch (error) {
      console.error('Error al eliminar certificado:', error);
      res.status(500).json({ error: 'Error al eliminar certificado' });
    }
  },

  // Validar contraseña de certificado
  validateCertificatePassword: async (req, res) => {
    try {
      const { certificateId } = req.params;
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({ error: 'La contraseña es requerida' });
      }

      const certificate = await Certificate.findOne({ 
        _id: certificateId, 
        userId: req.usuario.id 
      });

      if (!certificate) {
        return res.status(404).json({ error: 'Certificado no encontrado' });
      }

      try {
        CertificateManager.decryptCertificate(certificate.datosCifrados, password);
        res.json({ valid: true, message: 'Contraseña válida' });
      } catch (decryptError) {
        res.json({ valid: false, message: 'Contraseña incorrecta' });
      }

    } catch (error) {
      console.error('Error al validar contraseña:', error);
      res.status(500).json({ error: 'Error al validar contraseña' });
    }
  }
};

module.exports = certificadoController;
