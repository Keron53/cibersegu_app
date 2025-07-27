const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');
const tmp = require('tmp');
const forge = require('node-forge');

class PDFValidator {
  /**
   * Valida si un PDF fue firmado por nuestro sistema usando script de Python
   * @param {Buffer} pdfBuffer - Buffer del PDF a validar
   * @returns {Object} Resultado de la validación
   */
  static async validatePDFSignature(pdfBuffer) {
    try {
      // Crear archivo temporal para el PDF
      const tempPdfPath = tmp.tmpNameSync({ postfix: '.pdf' });
      fs.writeFileSync(tempPdfPath, pdfBuffer);

      console.log('🔍 Validando PDF con script de Python:', tempPdfPath);

      // Usar script de Python para validación completa
      const scriptPath = path.join(__dirname, '../../MicroservicioPyHanko/validar-pdf-simple.py');
      
      try {
        const output = execSync(`python "${scriptPath}" "${tempPdfPath}"`, {
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'pipe']
        });

        console.log('📄 Output del script de validación:', output.substring(0, 500) + '...');

        // Parsear resultado JSON del script
        const result = JSON.parse(output);

        // Limpiar archivo temporal
      fs.unlinkSync(tempPdfPath);

        return result;

      } catch (scriptError) {
        console.error('❌ Error ejecutando script de validación:', scriptError.message);
        
        // Limpiar archivo temporal
        fs.unlinkSync(tempPdfPath);
        
        return {
          isValid: false,
          message: 'Error al validar el PDF con script de Python',
          error: scriptError.message,
          details: {
            hasSignatures: false,
            signatureCount: 0,
            isModified: false,
            isOurSystem: false,
            certificateInfo: {
              isValid: false,
              message: 'Error en script de validación'
            }
          }
        };
      }

    } catch (error) {
      console.error('❌ Error general validando PDF:', error);
      return {
        isValid: false,
        message: 'Error al validar el PDF',
        error: error.message,
        details: {
          hasSignatures: false,
          signatureCount: 0,
          isModified: false,
          isOurSystem: false,
          certificateInfo: {
            isValid: false,
            message: 'Error general en validación'
          }
        }
      };
    }
  }

  /**
   * Verifica si el PDF tiene firmas digitales usando script de Python
   */
  static async checkForSignatures(pdfPath) {
    try {
      console.log('🔍 Verificando firmas en:', pdfPath);
      
      // Usar script de Python para validar
      const scriptPath = path.join(__dirname, '../../MicroservicioPyHanko/validar-pdf-simple.py');
      
      try {
        const output = execSync(`python "${scriptPath}" "${pdfPath}"`, {
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'pipe']
        });
        
        console.log('📄 Output del script de validación:', output.substring(0, 500) + '...');
        
        // Parsear resultado JSON
        const result = JSON.parse(output);
        
        if (result.details && result.details.hasSignatures) {
          console.log('✅ Firmas detectadas con script de Python');
          return true;
        } else {
          console.log('❌ No se detectaron firmas');
          return false;
        }
        
      } catch (scriptError) {
        console.log('⚠️ Script de validación falló:', scriptError.message);
        return false;
      }
      
    } catch (error) {
      console.error('❌ Error general verificando firmas:', error);
      return false;
    }
  }

  /**
   * Obtiene información detallada de las firmas
   */
  static async getSignatureInfo(pdfPath) {
    try {
      console.log('🔍 Obteniendo información de firmas de:', pdfPath);
      
      // Intentar con pyhanko validate --pretty-print
      try {
        const output = execSync(`python -m pyhanko.cli validate "${pdfPath}" --pretty-print`, {
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'pipe']
        });

        console.log('📄 Output detallado de pyhanko:', output.substring(0, 500) + '...');

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

        console.log('📋 Firmas encontradas:', signatures.length);
        return signatures;
        
      } catch (validateError) {
        console.log('⚠️ pyhanko validate --pretty-print falló:', validateError.message);
      }
      
      // Intentar con pyhanko dump
      try {
        const dumpOutput = execSync(`python -m pyhanko.cli dump "${pdfPath}"`, {
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'pipe']
        });

        console.log('📄 Output de pyhanko dump:', dumpOutput.substring(0, 500) + '...');

        // Parsear información básica del dump
        const signatures = [];
        const lines = dumpOutput.split('\n');
        let currentSignature = {};

        for (const line of lines) {
          if (line.includes('Signature') || line.includes('signature')) {
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

        console.log('📋 Firmas encontradas con dump:', signatures.length);
        return signatures;
        
      } catch (dumpError) {
        console.log('⚠️ pyhanko dump falló:', dumpError.message);
      }

      console.log('❌ No se pudo obtener información de firmas');
      return [];
      
    } catch (error) {
      console.error('❌ Error general obteniendo información de firmas:', error);
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