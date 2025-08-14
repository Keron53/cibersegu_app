const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');
const forge = require('node-forge');
const CertificateManager = require('../utils/CertificateManager');
const Usuario = require('../models/Usuario');
const Certificate = require('../models/Certificate');
const os = require('os');

const certificadoController = {
  // Subir certificado existente
  uploadCertificate: async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No se subió ningún archivo' });
    }

    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: 'La contraseña es requerida' });
    }

    try {
      // Usar CertificateManager para validar y almacenar el certificado
      const certificateMetadata = await CertificateManager.encryptAndStoreCertificate(
        req.file.path,
        password,
        req.usuario.id,
        req.file.originalname
      );

      // Limpiar archivo temporal
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      // Si llegamos aquí, el certificado se validó y almacenó correctamente
      res.status(201).json({
        message: 'Certificado subido correctamente',
        certificate: {
          id: certificateMetadata._id,
          nombre: certificateMetadata.nombreComun,
          organizacion: certificateMetadata.organizacion,
          email: certificateMetadata.email,
          fechaVencimiento: certificateMetadata.fechaVencimiento,
          activo: certificateMetadata.activo
        }
      });
    } catch (error) {
      console.error('Error al subir el certificado:', error);
      
      // Limpiar archivo temporal en caso de error
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      // Mapear errores específicos a mensajes amigables
      let errorMessage = 'Error al procesar el certificado';
      let statusCode = 400;
      
      // Errores de contraseña
      if (error.message.includes('incorrect password') || 
          error.message.includes('Invalid password') ||
          error.message === 'Contraseña incorrecta' ||
          error.message.includes('invalid password')) {
        errorMessage = 'La contraseña del certificado es incorrecta';
        statusCode = 401;
      } 
      // Errores de formato de archivo
      else if (error.message.includes('Invalid PKCS12 data') || 
              error.message.includes('Not enough data to read') ||
              error.message.includes('Invalid encoding')) {
        errorMessage = 'El archivo no es un certificado PKCS#12 válido o está dañado';
      } 
      // Errores de clave privada faltante
      else if (error.message.includes('no contiene una clave privada') ||
              error.message.includes('no contiene claves privadas')) {
        errorMessage = 'El archivo no contiene una clave privada. Asegúrese de que el archivo .p12 incluya tanto el certificado como la clave privada.';
      } 
      // Errores de certificado faltante
      else if (error.message.includes('no contiene certificados válidos')) {
        errorMessage = 'El archivo no contiene certificados válidos. Verifique que el archivo sea un certificado PKCS#12 (.p12) correcto.';
      }
      
      res.status(statusCode).json({ 
        error: errorMessage,
        code: statusCode === 401 ? 'INVALID_PASSWORD' : 'INVALID_CERTIFICATE'
      });
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
      const { password, validateOnly } = req.body;

      if (!password) {
        return res.status(400).json({ error: 'La contraseña es requerida' });
      }

      console.log('🔍 Buscando certificado:', certificateId);
      const certificate = await Certificate.findOne({ 
        _id: certificateId, 
        userId: req.usuario.id 
      });

      if (!certificate) {
        console.error('❌ Certificado no encontrado');
        return res.status(404).json({ error: 'Certificado no encontrado' });
      }

      try {
        console.log('🔑 Validando contraseña...');
        // Primero validamos la contraseña usando el método de validación
        const encryptedData = certificate.certificateData || certificate.datosCifrados;
        if (!encryptedData) {
          console.error('❌ No se encontraron datos cifrados en el certificado');
          throw new Error('Datos del certificado no válidos');
        }
        
        const validation = await CertificateManager.validatePassword(
          encryptedData,
          certificate.encryptionSalt,
          certificate.encryptionKey,
          password
        );

        if (!validation.valid) {
          console.error('❌ Validación de contraseña fallida');
          throw new Error('Contraseña incorrecta');
        }

        console.log('✅ Contraseña validada correctamente');

        // Si solo es validación, retornar éxito
        if (validateOnly) {
          return res.json({ valid: true });
        }
        
        // Si es descarga real, descifrar y enviar el archivo
        console.log('🔓 Descargando y descifrando certificado...');
        
        const decryptedData = CertificateManager.decryptCertificate(
          certificate.certificateData || certificate.datosCifrados, 
          certificate.encryptionSalt, 
          certificate.encryptionKey, 
          password
        );
        
        if (!decryptedData) {
          throw new Error('No se pudieron descifrar los datos del certificado');
        }

        console.log('✅ Certificado descifrado correctamente');
        
        console.log('📥 Enviando archivo de certificado...');
        res.setHeader('Content-Type', 'application/x-pkcs12');
        res.setHeader('Content-Disposition', `attachment; filename="${certificate.originalFilename || 'certificado.p12'}"`);
        res.send(decryptedData);

      } catch (error) {
        console.error('❌ Error al validar o descifrar certificado:', {
          error: error.message,
          stack: error.stack,
          hasSalt: !!certificate?.encryptionSalt,
          hasKey: !!certificate?.encryptionKey,
          hasData: !!(certificate?.certificateData || certificate?.datosCifrados),
          dataLength: certificate?.certificateData?.length || certificate?.datosCifrados?.length,
          fields: Object.keys(certificate ? certificate.toObject() : {})
        });
        
        const errorMessage = error.message.includes('Contraseña incorrecta')
        if (validateOnly) {
          return res.status(401).json({ 
            valid: false, 
            error: errorMessage
          });
        }
        return res.status(401).json({ 
          error: errorMessage
        });
      }

    } catch (error) {
      console.error('❌ Error en downloadCertificate:', {
        error: error.message,
        stack: error.stack,
        params: req.params,
        body: req.body
      });
      res.status(500).json({ 
        error: 'Error al procesar la solicitud de descarga',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Eliminar certificado
  deleteCertificate: async (req, res) => {
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

      // Primero validar la contraseña
      const validation = CertificateManager.validatePassword(
        certificate.datosCifrados, 
        certificate.encryptionSalt, 
        certificate.encryptionKey, 
        password
      );
      
      if (!validation.valid) {
        return res.status(401).json({ error: validation.error || 'Contraseña incorrecta' });
      }

      // Si la contraseña es válida, proceder con la descarga
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

      // Validar la contraseña antes de eliminar
      const validation = CertificateManager.validatePassword(
        certificate.datosCifrados, 
        certificate.encryptionSalt, 
        certificate.encryptionKey, 
        password
      );
      
      if (!validation.valid) {
        return res.status(401).json({ error: validation.error || 'Contraseña incorrecta' });
      }

      // Si la contraseña es válida, proceder con la eliminación
      await Certificate.findByIdAndDelete(certificateId);

      res.json({ message: 'Certificado eliminado correctamente' });
    } catch (error) {
      console.error('Error al eliminar certificado:', error);
      res.status(500).json({ error: 'Error al procesar la solicitud de eliminación' });
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

      const validation = CertificateManager.validatePassword(
        certificate.datosCifrados, 
        certificate.encryptionSalt, 
        certificate.encryptionKey, 
        password
      );
      
      if (validation.valid) {
        res.json({ valid: true, message: 'Contraseña válida' });
      } else {
        res.json({ valid: false, message: validation.error || 'Contraseña incorrecta' });
      }

    } catch (error) {
      console.error('Error al validar contraseña:', error);
      res.status(500).json({ error: 'Error al validar contraseña' });
    }
  }
};

module.exports = certificadoController;
