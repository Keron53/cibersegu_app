const fs = require('fs');
const tmp = require('tmp');
const { execSync } = require('child_process');
const forge = require('node-forge');

const documentoController = {
  // Endpoint para firma visual con QR usando pyHanko
  firmarDocumentoVisible: async (req, res) => {
    try {
      const pdfPath = req.files['pdf'][0].path;
      const p12Path = req.files['cert'][0].path;
      const passphrase = req.body.password;

      // Extraer .key y .crt del .p12 usando openssl
      const keyPath = tmp.tmpNameSync({ postfix: '.key' });
      const crtPath = tmp.tmpNameSync({ postfix: '.crt' });
      execSync(`openssl pkcs12 -in "${p12Path}" -out "${keyPath}" -nocerts -nodes -passin pass:${passphrase}`);
      execSync(`openssl pkcs12 -in "${p12Path}" -out "${crtPath}" -clcerts -nokeys -passin pass:${passphrase}`);

      // Leer el archivo .crt para extraer datos para el QR
      const crtPem = fs.readFileSync(crtPath, 'utf8');
      const cert = forge.pki.certificateFromPem(crtPem);
      let qrData = {
        signer: '',
        organization: '',
        email: '',
        serialNumber: '',
        document: req.files['pdf'][0].originalname,
        date: new Date().toISOString(),
        validator: 'Digital Sign PUCESE'
      };
      qrData.serialNumber = cert.serialNumber;
      for (const attr of cert.subject.attributes) {
        switch (attr.name) {
          case 'CN':
          case 'commonName':
            qrData.signer = attr.value;
            break;
          case 'O':
          case 'organizationName':
            qrData.organization = attr.value;
            break;
          case 'E':
          case 'emailAddress':
            qrData.email = attr.value;
            break;
        }
      }

      // Archivos temporales para QR, YAML de sello y YAML de identidad
      const qrPath = tmp.tmpNameSync({ postfix: '.png' });
      const yamlPath = tmp.tmpNameSync({ postfix: '.yml' });
      const signerYamlPath = tmp.tmpNameSync({ postfix: '.yml' });

      // Generar QR y YAML de sello visual
      execSync(`python pyhanko_service/generate_qr_and_stamp.py '${JSON.stringify(qrData).replace(/'/g, "\\'")}' ${qrPath} ${yamlPath}`);

      // Generar YAML de identidad para pyHanko
      const signerYaml = `signers:\n  default:\n    key: ${keyPath}\n    cert: ${crtPath}\n    key_passphrase: \"${passphrase}\"\n    other_certs:\n      - CrearCACentral/ca.crt\n`;
      fs.writeFileSync(signerYamlPath, signerYaml);

      // Archivo temporal para el PDF firmado
      const signedPdfPath = tmp.tmpNameSync({ postfix: '.pdf' });

      // Crear archivo temporal con la contraseña del .p12
      const passFilePath = tmp.tmpNameSync({ postfix: '.txt' });
      fs.writeFileSync(passFilePath, passphrase, 'utf8');

      // Ejecutar pyHanko para firmar el PDF directamente, permitiendo xref híbrido
      execSync(
        `venv\\Scripts\\python.exe -m pyhanko sign addsig pkcs12 --no-strict-syntax --passfile ${passFilePath} ${pdfPath} ${signedPdfPath} ${p12Path}`
      );

      // Enviar el PDF firmado
      const signedPdfBuffer = fs.readFileSync(signedPdfPath);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="firmado_visible.pdf"');
      res.send(signedPdfBuffer);

      // Limpieza
      [qrPath, yamlPath, signerYamlPath, keyPath, crtPath, signedPdfPath, passFilePath].forEach(f => fs.existsSync(f) && fs.unlinkSync(f));
    } catch (error) {
      console.error('Error al firmar el PDF con pyHanko:', error);
      res.status(500).json({ 
        error: error.message,
        stderr: error.stderr?.toString(),
        stdout: error.stdout?.toString()
      });
    }
  }
};

module.exports = documentoController; 