const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');
const tmp = require('tmp');
const forge = require('node-forge');

class PDFValidator {
  /**
   * Valida si un PDF fue firmado por nuestro sistema
   * @param {Buffer} pdfBuffer - Buffer del PDF a validar
   * @returns {Object} Resultado de la validación
   */
  static async validatePDFSignature(pdfBuffer) {
    try {
      // Crear archivo temporal para el PDF
      const tempPdfPath = tmp.tmpNameSync({ postfix: '.pdf' });
      fs.writeFileSync(tempPdfPath, pdfBuffer);

      // Verificar si el PDF tiene firmas digitales
      const hasSignatures = await this.checkForSignatures(tempPdfPath);
      
      if (!hasSignatures) {
        return {
          isValid: false,
          message: 'El PDF no contiene firmas digitales',
          details: {
            hasSignatures: false,
            signatureCount: 0,
            isModified: false,
            isOurSystem: false
          }
        };
      }

      // Obtener información detallada de las firmas
      const signatureInfo = await this.getSignatureInfo(tempPdfPath);
      
      // Verificar si fue firmado por nuestro sistema
      const isOurSystem = await this.verifyOurSystemSignature(signatureInfo);
      
      // Verificar integridad (si fue modificado)
      const isModified = await this.verifyIntegrity(tempPdfPath);
      
      // Verificar certificado
      const certificateInfo = await this.verifyCertificate(signatureInfo);

      // Limpiar archivo temporal
      fs.unlinkSync(tempPdfPath);

      return {
        isValid: !isModified && isOurSystem && certificateInfo.isValid,
        message: this.generateValidationMessage(isModified, isOurSystem, certificateInfo),
        details: {
          hasSignatures: true,
          signatureCount: signatureInfo.length,
          isModified: isModified,
          isOurSystem: isOurSystem,
          certificateInfo: certificateInfo,
          signatures: signatureInfo
        }
      };

    } catch (error) {
      console.error('Error validando PDF:', error);
      return {
        isValid: false,
        message: 'Error al validar el PDF',
        error: error.message,
        details: {
          hasSignatures: false,
          signatureCount: 0,
          isModified: false,
          isOurSystem: false
        }
      };
    }
  }

  /**
   * Verifica si el PDF tiene firmas digitales
   */
  static async checkForSignatures(pdfPath) {
    try {
      const output = execSync(`python -m pyhanko.cli validate "${pdfPath}"`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      // Si pyhanko puede leer el PDF, tiene firmas
      return output.includes('Signature') || output.includes('signature');
    } catch (error) {
      // Si pyhanko falla, probablemente no tiene firmas
      return false;
    }
  }

  /**
   * Obtiene información detallada de las firmas
   */
  static async getSignatureInfo(pdfPath) {
    try {
      const output = execSync(`python -m pyhanko.cli validate "${pdfPath}" --pretty-print`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      });

      const signatures = [];
      const lines = output.split('\n');
      let currentSignature = {};

      for (const line of lines) {
        if (line.includes('Signature')) {
          if (Object.keys(currentSignature).length > 0) {
            signatures.push(currentSignature);
          }
          currentSignature = {
            name: line.trim(),
            details: {}
          };
        } else if (line.includes(':')) {
          const [key, value] = line.split(':').map(s => s.trim());
          if (currentSignature.details) {
            currentSignature.details[key] = value;
          }
        }
      }

      if (Object.keys(currentSignature).length > 0) {
        signatures.push(currentSignature);
      }

      return signatures;
    } catch (error) {
      console.error('Error obteniendo información de firmas:', error);
      return [];
    }
  }

  /**
   * Verifica si la firma fue creada por nuestro sistema
   */
  static async verifyOurSystemSignature(signatureInfo) {
    try {
      // Verificar características específicas de nuestro sistema
      for (const signature of signatureInfo) {
        const details = signature.details;
        
        // Verificar si contiene QR code (característica de nuestro sistema)
        if (details['Signature Type'] && details['Signature Type'].includes('QR')) {
          return true;
        }
        
        // Verificar si contiene texto específico de nuestro sistema
        if (details['Signature Text'] && 
            (details['Signature Text'].includes('Digital Sign') || 
             details['Signature Text'].includes('Firmado electrónicamente'))) {
          return true;
        }
        
        // Verificar certificado CA de nuestro sistema
        if (details['Certificate Issuer'] && 
            details['Certificate Issuer'].includes('Digital Sign CA')) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error verificando firma de nuestro sistema:', error);
      return false;
    }
  }

  /**
   * Verifica la integridad del PDF (si fue modificado)
   */
  static async verifyIntegrity(pdfPath) {
    try {
      const output = execSync(`python -m pyhanko.cli validate "${pdfPath}" --verify`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      });

      // Si la verificación es exitosa, no fue modificado
      return !output.includes('FAILED') && !output.includes('INVALID');
    } catch (error) {
      // Si hay error en la verificación, probablemente fue modificado
      return false;
    }
  }

  /**
   * Verifica el certificado usado para firmar
   */
  static async verifyCertificate(signatureInfo) {
    try {
      for (const signature of signatureInfo) {
        const details = signature.details;
        
        // Verificar si el certificado es válido
        if (details['Certificate Status'] && 
            details['Certificate Status'].includes('VALID')) {
          return {
            isValid: true,
            issuer: details['Certificate Issuer'] || 'Unknown',
            subject: details['Certificate Subject'] || 'Unknown',
            validFrom: details['Valid From'] || 'Unknown',
            validTo: details['Valid To'] || 'Unknown'
          };
        }
      }
      
      return {
        isValid: false,
        issuer: 'Unknown',
        subject: 'Unknown',
        validFrom: 'Unknown',
        validTo: 'Unknown'
      };
    } catch (error) {
      console.error('Error verificando certificado:', error);
      return {
        isValid: false,
        issuer: 'Error',
        subject: 'Error',
        validFrom: 'Error',
        validTo: 'Error'
      };
    }
  }

  /**
   * Genera mensaje de validación en español
   */
  static generateValidationMessage(isModified, isOurSystem, certificateInfo) {
    if (isModified) {
      return '⚠️ El PDF ha sido modificado después de la firma';
    }
    
    if (!isOurSystem) {
      return '❌ El PDF no fue firmado por este sistema';
    }
    
    if (!certificateInfo.isValid) {
      return '❌ El certificado usado para firmar no es válido';
    }
    
    return '✅ El PDF es válido y fue firmado por este sistema';
  }

  /**
   * Extrae información del QR code en la firma
   */
  static async extractQRInfo(pdfPath) {
    try {
      // Usar pyhanko para extraer información del sello visual
      const output = execSync(`python -m pyhanko.cli extract "${pdfPath}" --output-format json`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      });

      const data = JSON.parse(output);
      
      // Buscar información del QR en los sellos visuales
      for (const signature of data.signatures || []) {
        if (signature.visual_elements) {
          for (const element of signature.visual_elements) {
            if (element.type === 'qr' || element.content) {
              return {
                qrContent: element.content,
                signerName: element.signer_name,
                signerEmail: element.signer_email,
                organization: element.organization,
                signingDate: element.signing_date
              };
            }
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error extrayendo información QR:', error);
      return null;
    }
  }
}

module.exports = PDFValidator; 