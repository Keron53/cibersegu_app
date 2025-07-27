const multer = require('multer');
const PDFValidator = require('../utils/pdfValidator');
const fs = require('fs');
const tmp = require('tmp');

const validacionController = {
  /**
   * Valida un PDF subido por el usuario
   */
  async validarPDF(req, res) {
    try {
      if (!req.files || !req.files.pdf) {
        return res.status(400).json({
          success: false,
          message: 'No se proporcionó ningún archivo PDF'
        });
      }

      const pdfFile = req.files.pdf[0];
      const pdfBuffer = fs.readFileSync(pdfFile.path);

      // Validar que sea un PDF
      if (!pdfFile.mimetype.includes('pdf')) {
        return res.status(400).json({
          success: false,
          message: 'El archivo debe ser un PDF'
        });
      }

      console.log('🔍 Validando PDF:', pdfFile.originalname);

      // Realizar validación completa
      const validationResult = await PDFValidator.validatePDFSignature(pdfBuffer);

      // Limpiar archivo temporal
      fs.unlinkSync(pdfFile.path);

      // Extraer información QR si es válido
      let qrInfo = null;
      if (validationResult.isValid) {
        const tempPdfPath = tmp.tmpNameSync({ postfix: '.pdf' });
        fs.writeFileSync(tempPdfPath, pdfBuffer);
        qrInfo = await PDFValidator.extractQRInfo(tempPdfPath);
        fs.unlinkSync(tempPdfPath);
      }

      res.json({
        success: true,
        fileName: pdfFile.originalname,
        validation: validationResult,
        qrInfo: qrInfo
      });

    } catch (error) {
      console.error('Error validando PDF:', error);
      res.status(500).json({
        success: false,
        message: 'Error al validar el PDF',
        error: error.message
      });
    }
  },

  /**
   * Valida un PDF desde una URL (para validación remota)
   */
  async validarPDFDesdeURL(req, res) {
    try {
      const { url } = req.body;

      if (!url) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere una URL del PDF'
        });
      }

      // Descargar PDF desde URL
      const response = await fetch(url);
      if (!response.ok) {
        return res.status(400).json({
          success: false,
          message: 'No se pudo descargar el PDF desde la URL proporcionada'
        });
      }

      const pdfBuffer = await response.arrayBuffer();

      console.log('🔍 Validando PDF desde URL:', url);

      // Realizar validación completa
      const validationResult = await PDFValidator.validatePDFSignature(Buffer.from(pdfBuffer));

      // Extraer información QR si es válido
      let qrInfo = null;
      if (validationResult.isValid) {
        const tempPdfPath = tmp.tmpNameSync({ postfix: '.pdf' });
        fs.writeFileSync(tempPdfPath, Buffer.from(pdfBuffer));
        qrInfo = await PDFValidator.extractQRInfo(tempPdfPath);
        fs.unlinkSync(tempPdfPath);
      }

      res.json({
        success: true,
        url: url,
        validation: validationResult,
        qrInfo: qrInfo
      });

    } catch (error) {
      console.error('Error validando PDF desde URL:', error);
      res.status(500).json({
        success: false,
        message: 'Error al validar el PDF desde URL',
        error: error.message
      });
    }
  },

  /**
   * Obtiene información detallada de las firmas en un PDF
   */
  async obtenerInformacionFirmas(req, res) {
    try {
      if (!req.files || !req.files.pdf) {
        return res.status(400).json({
          success: false,
          message: 'No se proporcionó ningún archivo PDF'
        });
      }

      const pdfFile = req.files.pdf[0];
      const pdfBuffer = fs.readFileSync(pdfFile.path);

      console.log('📋 Obteniendo información de firmas:', pdfFile.originalname);

      // Crear archivo temporal
      const tempPdfPath = tmp.tmpNameSync({ postfix: '.pdf' });
      fs.writeFileSync(tempPdfPath, pdfBuffer);

      // Obtener información detallada
      const signatureInfo = await PDFValidator.getSignatureInfo(tempPdfPath);
      const qrInfo = await PDFValidator.extractQRInfo(tempPdfPath);

      // Limpiar archivos temporales
      fs.unlinkSync(pdfFile.path);
      fs.unlinkSync(tempPdfPath);

      res.json({
        success: true,
        fileName: pdfFile.originalname,
        signatures: signatureInfo,
        qrInfo: qrInfo,
        signatureCount: signatureInfo.length
      });

    } catch (error) {
      console.error('Error obteniendo información de firmas:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener información de las firmas',
        error: error.message
      });
    }
  },

  /**
   * Verifica la integridad de un PDF (si fue modificado)
   */
  async verificarIntegridad(req, res) {
    try {
      if (!req.files || !req.files.pdf) {
        return res.status(400).json({
          success: false,
          message: 'No se proporcionó ningún archivo PDF'
        });
      }

      const pdfFile = req.files.pdf[0];
      const pdfBuffer = fs.readFileSync(pdfFile.path);

      console.log('🔒 Verificando integridad:', pdfFile.originalname);

      // Crear archivo temporal
      const tempPdfPath = tmp.tmpNameSync({ postfix: '.pdf' });
      fs.writeFileSync(tempPdfPath, pdfBuffer);

      // Verificar integridad
      const isModified = await PDFValidator.verifyIntegrity(tempPdfPath);

      // Limpiar archivos temporales
      fs.unlinkSync(pdfFile.path);
      fs.unlinkSync(tempPdfPath);

      res.json({
        success: true,
        fileName: pdfFile.originalname,
        isModified: isModified,
        message: isModified 
          ? '⚠️ El PDF ha sido modificado después de la firma'
          : '✅ El PDF mantiene su integridad'
      });

    } catch (error) {
      console.error('Error verificando integridad:', error);
      res.status(500).json({
        success: false,
        message: 'Error al verificar la integridad del PDF',
        error: error.message
      });
    }
  }
};

module.exports = validacionController; 