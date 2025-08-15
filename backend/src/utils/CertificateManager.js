const mongoose = require('mongoose');
const crypto = require('crypto');
const fs = require('fs-extra');
const Certificate = require('../models/Certificate');
const forge = require('node-forge');

const CA_DIR = require('path').join(__dirname, '../../CrearCACentral');
const CA_KEY_PATH = require('path').join(CA_DIR, 'ca.key');
const CA_CERT_PATH = require('path').join(CA_DIR, 'ca.crt');

class CertificateManager {

  static deriveKey(password, salt) {
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(password, salt, 100000, 32, 'sha256', (err, derivedKey) => {
        if (err) reject(err);
        resolve(derivedKey);
      });
    });
  }

  static async encryptAndStoreCertificate(filePath, password, userId, originalFilename = null) {
    if (!fs.existsSync(filePath)) {
      throw new Error('El archivo .p12 no existe');
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('El userId proporcionado no es válido');
    }

    // Lee el archivo .p12
    const p12Buffer = await fs.promises.readFile(filePath);

    // Extraer metadatos del certificado
    let certificateMetadata = {
      nombreComun: '',
      organizacion: '',
      email: '',
      numeroSerie: ''
    };

    try {
      // Intenta parsear el archivo .p12 con la contraseña
      const p12Asn1 = forge.asn1.fromDer(p12Buffer.toString('binary'));
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, password); // <-- lanza error si la contraseña es incorrecta
      
      try {
        // Obtener el primer certificado del archivo .p12
        const certs = p12.getBags({ bagType: forge.pki.oids.certBag })[forge.pki.oids.certBag];
        if (certs && certs.length > 0) {
          const cert = certs[0].cert;
          
          // Extraer número de serie
          certificateMetadata.numeroSerie = cert.serialNumber;
          
          // Extraer información del subject
          const subject = cert.subject;
          
          // Buscar campos de manera más robusta
          for (const attr of subject.attributes) {
            switch (attr.name) {
              case 'CN':
              case 'commonName':
                certificateMetadata.nombreComun = attr.value;
                break;
              case 'O':
              case 'organizationName':
                certificateMetadata.organizacion = attr.value;
                break;
              case 'OU':
              case 'organizationalUnitName':
                if (!certificateMetadata.organizacion) {
                  certificateMetadata.organizacion = attr.value;
                }
                break;
              case 'E':
              case 'emailAddress':
                certificateMetadata.email = attr.value;
                break;
            }
          }
          
          // Si no se encontró nombre común, usar el originalFilename
          if (!certificateMetadata.nombreComun) {
            certificateMetadata.nombreComun = originalFilename ? originalFilename.replace('.p12', '') : 'Certificado';
          }
          
          // Si no se encontró organización, usar un valor por defecto
          if (!certificateMetadata.organizacion) {
            certificateMetadata.organizacion = 'Organización';
          }
        }
      } catch (err) {
        console.log('No se pudieron extraer metadatos del certificado:', err.message);
        // Usar valores por defecto
        certificateMetadata.nombreComun = originalFilename ? originalFilename.replace('.p12', '') : 'Certificado';
        certificateMetadata.organizacion = 'Organización';
      }
    } catch (err) {
      throw new Error('❌ La contraseña del certificado es incorrecta. Verifica la contraseña e intenta nuevamente.');
    }

    const salt = crypto.randomBytes(16); // Crear un salt único
    const derivedKey = await this.deriveKey(password, salt.toString('hex')); // Derivar clave
    console.log('Cifer Salt: ' + salt.toString('hex'));
    console.log('Cifer Key: ', derivedKey);

    const iv = crypto.randomBytes(16); // IV aleatorio para AES
    const cipher = crypto.createCipheriv('aes-256-cbc', derivedKey, iv);
    console.log('IV: ', iv.toString('hex'));

    const fileBuffer = fs.readFileSync(filePath); // Leer archivo .p12

    let encrypted = Buffer.concat([cipher.update(fileBuffer), cipher.final()]);

    // Almacenar en MongoDB
    const fallbackFilename = filePath.split('/').pop();
    const finalOriginalFilename = originalFilename || fallbackFilename;

    const certificate = new Certificate({
      userId: new mongoose.Types.ObjectId(userId), // Asegurarse de que sea un ObjectId
      filename: filePath.split('/').pop(),
      originalFilename: finalOriginalFilename,
      nombreComun: certificateMetadata.nombreComun,
      organizacion: certificateMetadata.organizacion,
      email: certificateMetadata.email,
      numeroSerie: certificateMetadata.numeroSerie,
      datosCifrados: encrypted,
      encryptionSalt: salt.toString('hex'), // Guardar salt en la base de datos
      encryptionKey: iv.toString('hex'), // Guardar IV en la base de datos
    });



    const savedCertificate = await certificate.save();
    
    // Retornar los metadatos del certificado guardado
    return {
      _id: savedCertificate._id,
      nombreComun: savedCertificate.nombreComun,
      organizacion: savedCertificate.organizacion,
      email: savedCertificate.email,
      numeroSerie: savedCertificate.numeroSerie,
      fechaVencimiento: savedCertificate.fechaVencimiento,
      activo: savedCertificate.activo,
      originalFilename: savedCertificate.originalFilename
    };
  }

  // Recuperar y descifrar el archivo .p12 usando la clave derivada
  static async decryptAndRetrieveCertificate(certificateId, password, outputPath) {
    const certificate = await Certificate.findById(certificateId);
    if (!certificate) {
      throw new Error('Certificado no encontrado');
    }

    const salt = Buffer.from(certificate.encryptionSalt, 'hex'); // Recuperar salt

    const derivedKey = await this.deriveKey(password, certificate.encryptionSalt); // Derivar clave con la contraseña
    console.log("salt", salt)
    console.log("derivedKey: ", derivedKey)
    const iv = Buffer.from(certificate.encryptionKey, 'hex'); // Recuperar IV
    console.log('IV: ', iv.toString('hex'));
    const decipher = crypto.createDecipheriv('aes-256-cbc', derivedKey, iv);

          const decrypted = Buffer.concat([decipher.update(certificate.datosCifrados), decipher.final()]);

    fs.writeFileSync(outputPath, decrypted); // Guardar el archivo descifrado
    console.log('Archivo .p12 recuperado y descifrado con éxito');
  }

  // Cifrar un buffer de certificado
  static encryptCertificate(p12Buffer, password) {
    const salt = crypto.randomBytes(16);
    const derivedKey = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', derivedKey, iv);
    
    const encrypted = Buffer.concat([cipher.update(p12Buffer), cipher.final()]);
    
    return {
      encryptedData: encrypted,
      salt: salt.toString('hex'),
      iv: iv.toString('hex')
    };
  }

  // Validar la contraseña sin descifrar completamente el certificado
  static async validatePassword(encryptedData, salt, iv, password) {
    try {
      // Si no hay salt o iv, es un certificado del sistema (no cifrado)
      if (!salt || !iv) {
        console.log('🔓 Certificado del sistema detectado (sin cifrado)');
        return { valid: true };
      }

      console.log('🔐 Validando contraseña del certificado...');
      
      // Validar que los parámetros sean correctos
      if (!encryptedData || !Buffer.isBuffer(encryptedData)) {
        throw new Error('Datos cifrados no válidos');
      }
      
      if (!salt || typeof salt !== 'string') {
        throw new Error('Salt no válido');
      }
      
      if (!iv || typeof iv !== 'string') {
        throw new Error('IV no válido');
      }
      
      if (!password || typeof password !== 'string') {
        throw new Error('Contraseña no válida');
      }
      
      const saltBuffer = Buffer.from(salt, 'hex');
      const ivBuffer = Buffer.from(iv, 'hex');
      
      // Derivar la clave usando PBKDF2
      const derivedKey = crypto.pbkdf2Sync(password, saltBuffer, 100000, 32, 'sha256');
      
      // Crear un decipher para validar la contraseña
      const decipher = crypto.createDecipheriv('aes-256-cbc', derivedKey, ivBuffer);
      
      try {
        // Intentar descifrar solo una pequeña porción para validar la contraseña
        const chunkSize = Math.min(32, encryptedData.length);
        decipher.update(encryptedData.slice(0, chunkSize));
        
        // Si llegamos aquí, la contraseña es válida
        console.log('✅ Contraseña válida');
        return { valid: true };
      } catch (decryptError) {
        if (decryptError.code === 'ERR_OSSL_BAD_DECRYPT') {
          console.log('❌ Contraseña incorrecta');
          return { valid: false, error: 'Contraseña incorrecta' };
        }
        throw decryptError;
      }
    } catch (error) {
      console.error('❌ Error validando contraseña:', error.message);
      return { 
        valid: false, 
        error: 'Error validando la contraseña',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // Descifrar un buffer de certificado
  static decryptCertificate(encryptedData, salt, iv, password) {
    try {
      // Si no hay salt o iv, es un certificado del sistema (no cifrado)
      if (!salt || !iv) {
        console.log('🔓 Certificado del sistema detectado (sin cifrado)');
        return encryptedData;
      }

      console.log('🔐 Descifrando certificado cifrado...');
      console.log('📊 Salt:', salt);
      console.log('📊 IV:', iv);
      console.log('📊 Password length:', password ? password.length : 0);
      console.log('📊 Encrypted data length:', encryptedData ? encryptedData.length : 0);
      
      // Validar que los datos estén en el formato correcto
      if (!encryptedData || !Buffer.isBuffer(encryptedData)) {
        throw new Error('Los datos cifrados no son un buffer válido');
      }
      
      if (!salt || typeof salt !== 'string') {
        throw new Error('El salt no es una cadena válida');
      }
      
      if (!iv || typeof iv !== 'string') {
        throw new Error('El IV no es una cadena válida');
      }
      
      if (!password || typeof password !== 'string') {
        throw new Error('La contraseña no es una cadena válida');
      }
      
      const saltBuffer = Buffer.from(salt, 'hex');
      const ivBuffer = Buffer.from(iv, 'hex');
      
      console.log('🔑 Salt buffer length:', saltBuffer.length);
      console.log('🔑 IV buffer length:', ivBuffer.length);
      
      const derivedKey = crypto.pbkdf2Sync(password, saltBuffer, 100000, 32, 'sha256');
      console.log('🔑 Derived key length:', derivedKey.length);
      
      const decipher = crypto.createDecipheriv('aes-256-cbc', derivedKey, ivBuffer);
      
      let decrypted;
      try {
        decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
        console.log('✅ Certificado descifrado exitosamente, tamaño:', decrypted.length);
      } catch (decryptError) {
        console.error('❌ Error al descifrar el certificado:', decryptError.message);
        if (decryptError.message.includes('bad decrypt') || 
            decryptError.message.includes('wrong final block length') ||
            decryptError.message.includes('Invalid key length')) {
          throw new Error('Contraseña incorrecta');
        }
        throw new Error('No se pudo descifrar el certificado: ' + decryptError.message);
      }
      
      // Verificar que el certificado descifrado tenga el formato PKCS#12 correcto
      if (decrypted.length < 4) {
        throw new Error('El certificado descifrado es demasiado pequeño o está corrupto');
      }
      
      // Verificar que comience con la secuencia PKCS#12 (0x30)
      if (decrypted[0] !== 0x30) {
        console.warn('⚠️ El certificado descifrado no parece tener el formato PKCS#12 correcto (primer byte:', decrypted[0], ')');
        // No lanzar error aquí, solo advertencia
      }
      
      return decrypted;
    } catch (error) {
      console.error('❌ Error descifrando certificado:', error.message);
      console.error('📊 Detalles del error:', {
        hasSalt: !!salt,
        hasIv: !!iv,
        hasPassword: !!password,
        encryptedDataLength: encryptedData ? encryptedData.length : 0,
        saltType: typeof salt,
        ivType: typeof iv,
        passwordType: typeof password
      });
      
      // Si es un error de descifrado, lanzar un error específico
      if (error.code === 'ERR_OSSL_BAD_DECRYPT') {
        console.error('❌ Error de descifrado: La contraseña es incorrecta o el certificado está dañado');
        const err = new Error('La contraseña es incorrecta o el certificado está dañado');
        err.code = 'INVALID_PASSWORD';
        throw err;
      }
      
      // Para otros errores, incluir más detalles en desarrollo
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Error al descifrar el certificado:', error);
      }
      throw error;
    }
  }

  // Método específico para validación de contraseñas (estricto)
  static validatePassword(encryptedData, salt, iv, password) {
    try {
      // Si no hay salt o iv, es un certificado del sistema
      if (!salt || !iv) {
        console.log('🔓 Certificado del sistema detectado (sin cifrado)');
        return { valid: true };
      }

      console.log('🔐 Validando contraseña de certificado cifrado...');
      console.log('📊 Salt:', salt);
      console.log('📊 IV:', iv);
      console.log('📊 Password length:', password ? password.length : 0);
      console.log('📊 Password (primeros 3 chars):', password ? password.substring(0, 3) + '***' : 'undefined');
      console.log('📊 Encrypted data length:', encryptedData ? encryptedData.length : 0);
      
      // Validar que los datos estén en el formato correcto
      if (!encryptedData || !Buffer.isBuffer(encryptedData)) {
        return { valid: false, error: 'Los datos cifrados no son un buffer válido' };
      }
      
      if (!salt || typeof salt !== 'string') {
        return { valid: false, error: 'El salt no es una cadena válida' };
      }
      
      if (!iv || typeof iv !== 'string') {
        return { valid: false, error: 'El IV no es una cadena válida' };
      }
      
      if (!password || typeof password !== 'string') {
        return { valid: false, error: 'La contraseña no es una cadena válida' };
      }
      
      const saltBuffer = Buffer.from(salt, 'hex');
      const ivBuffer = Buffer.from(iv, 'hex');
      
      console.log('🔑 Salt buffer length:', saltBuffer.length);
      console.log('🔑 IV buffer length:', ivBuffer.length);
      
      const derivedKey = crypto.pbkdf2Sync(password, saltBuffer, 100000, 32, 'sha256');
      console.log('🔑 Derived key length:', derivedKey.length);
      
      const decipher = crypto.createDecipheriv('aes-256-cbc', derivedKey, ivBuffer);
      
      // Intentar descifrar todo el certificado para validar la contraseña
      // (igual que en el proceso de firma)
      const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
      console.log('🔍 Certificado descifrado completamente, tamaño:', decrypted.length);
      
      // Verificar que el certificado descifrado tenga el formato PKCS#12 correcto
      if (decrypted.length < 4) {
        return { valid: false, error: 'El certificado descifrado es demasiado pequeño' };
      }
      
      // Verificar que comience con la secuencia PKCS#12 (0x30)
      if (decrypted[0] !== 0x30) {
        console.warn('⚠️ El certificado descifrado no parece tener el formato PKCS#12 correcto (primer byte:', decrypted[0], ')');
        // No rechazar por esto, solo advertencia
      }
      
      console.log('✅ Contraseña válida');
      return { valid: true };
      
    } catch (error) {
      console.error('❌ Error validando contraseña:', error.message);
      console.error('📊 Detalles del error:', {
        hasSalt: !!salt,
        hasIv: !!iv,
        hasPassword: !!password,
        encryptedDataLength: encryptedData ? encryptedData.length : 0,
        saltType: typeof salt,
        ivType: typeof iv,
        passwordType: typeof password
      });
      
      // Para validación de contraseñas, siempre devolver false en caso de error
      return { valid: false, error: 'Contraseña incorrecta' };
    }
  }
}

CertificateManager.ensureCAExists = function() {
  fs.ensureDirSync(CA_DIR);
  if (!fs.existsSync(CA_KEY_PATH) || !fs.existsSync(CA_CERT_PATH)) {
    // Generar clave privada de la CA
    const keys = forge.pki.rsa.generateKeyPair(2048);
    const cert = forge.pki.createCertificate();
    cert.publicKey = keys.publicKey;
    cert.serialNumber = (new Date().getTime()).toString();
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 10);
    const attrs = [
      { name: 'commonName', value: 'CA CiberseguApp' },
      { name: 'countryName', value: 'EC' },
      { shortName: 'ST', value: 'Esmeraldas' },
      { name: 'localityName', value: 'Esmeraldas' },
      { name: 'organizationName', value: 'CiberseguApp' },
      { shortName: 'OU', value: 'Autoridad Certificadora' }
    ];
    cert.setSubject(attrs);
    cert.setIssuer(attrs);
    cert.setExtensions([
      { name: 'basicConstraints', cA: true },
      { name: 'keyUsage', keyCertSign: true, digitalSignature: true, cRLSign: true },
      { name: 'subjectKeyIdentifier' }
    ]);
    cert.sign(keys.privateKey, forge.md.sha256.create());
    // Guardar clave privada y certificado en disco
    fs.writeFileSync(CA_KEY_PATH, forge.pki.privateKeyToPem(keys.privateKey));
    fs.writeFileSync(CA_CERT_PATH, forge.pki.certificateToPem(cert));
    console.log('CA generada y guardada en disco.');
  } else {
    console.log('CA ya existe en disco.');
  }
};

module.exports = CertificateManager;

