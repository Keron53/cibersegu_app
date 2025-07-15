const mongoose = require('mongoose');
const crypto = require('crypto');
const fs = require('fs-extra');
const Certificate = require('../models/Certificate');
const forge = require('node-forge');

class CertificateManager {

  static deriveKey(password, salt) {
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(password, salt, 100000, 32, 'sha256', (err, derivedKey) => {
        if (err) reject(err);
        resolve(derivedKey);
      });
    });
  }

  static async encryptAndStoreCertificate(filePath, password, userId) {
    if (!fs.existsSync(filePath)) {
      throw new Error('El archivo .p12 no existe');
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('El userId proporcionado no es válido');
    }

    // Lee el archivo .p12
    const p12Buffer = await fs.promises.readFile(filePath);

    try {
      // Intenta parsear el archivo .p12 con la contraseña
      const p12Asn1 = forge.asn1.fromDer(p12Buffer.toString('binary'));
      forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, password); // <-- lanza error si la contraseña es incorrecta
    } catch (err) {
      throw new Error('La contraseña del certificado es incorrecta');
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
    const certificate = new Certificate({
      userId: new mongoose.Types.ObjectId(userId), // Asegurarse de que sea un ObjectId
      filename: filePath.split('/').pop(),
      certificateData: encrypted,
      encryptionSalt: salt.toString('hex'), // Guardar salt en la base de datos
      encryptionKey: iv.toString('hex'), // Guardar IV en la base de datos
    });

    await certificate.save();
    console.log('Archivo .p12 cifrado y almacenado con éxito');
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

    const decrypted = Buffer.concat([decipher.update(certificate.certificateData), decipher.final()]);

    fs.writeFileSync(outputPath, decrypted); // Guardar el archivo descifrado
    console.log('Archivo .p12 recuperado y descifrado con éxito');
  }
}

module.exports = CertificateManager;

