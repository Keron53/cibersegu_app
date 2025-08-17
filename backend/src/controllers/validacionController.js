const multer = require('multer');
const PDFValidator = require('../utils/pdfValidator');
const ValidacionPDF = require('../models/ValidacionPDF');
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

      // Guardar en historial
      if (req.usuario && req.usuario.id) {
        try {
          const validacion = new ValidacionPDF({
            usuario: req.usuario.id,
            nombreArchivo: pdfFile.originalname,
            tipoValidacion: 'archivo',
            resultado: {
              isValid: validationResult.isValid,
              message: validationResult.message,
              hasSignatures: validationResult.hasSignatures || false,
              signatureCount: validationResult.signatureCount || 0,
              isOurSystem: validationResult.isOurSystem || false,
              systemType: validationResult.systemType || 'Sistema Desconocido',
              isModified: validationResult.isModified || false
            },
            qrInfo: validationResult.qrInfo,
            metadata: {
              tamaño: pdfFile.size,
              paginas: 0, // TODO: Extraer número de páginas
              fechaCreacion: new Date()
            }
          });
          
          await validacion.save();
          console.log('✅ Validación guardada en historial');
        } catch (historialError) {
          console.error('⚠️ Error guardando en historial:', historialError);
        }
      }

      // Limpiar archivo temporal
      fs.unlinkSync(pdfFile.path);

      res.json({
        success: true,
        fileName: pdfFile.originalname,
        validation: validationResult.validation, // Solo los campos de validación
        qrInfo: validationResult.qrInfo
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

      // Guardar en historial
      if (req.usuario && req.usuario.id) {
        try {
          const validacion = new ValidacionPDF({
            usuario: req.usuario.id,
            nombreArchivo: url.split('/').pop() || 'PDF desde URL',
            tipoValidacion: 'url',
            urlArchivo: url,
            resultado: {
              isValid: validationResult.isValid,
              message: validationResult.message,
              hasSignatures: validationResult.hasSignatures || false,
              signatureCount: validationResult.signatureCount || 0,
              isOurSystem: validationResult.isOurSystem || false,
              systemType: validationResult.systemType || 'Sistema Desconocido',
              isModified: validationResult.isModified || false
            },
            qrInfo: validationResult.qrInfo,
            metadata: {
              tamaño: pdfBuffer.byteLength,
              paginas: 0, // TODO: Extraer número de páginas
              fechaCreacion: new Date()
            }
          });
          
          await validacion.save();
          console.log('✅ Validación desde URL guardada en historial');
        } catch (historialError) {
          console.error('⚠️ Error guardando en historial:', historialError);
        }
      }

      res.json({
        success: true,
        url: url,
        validation: validationResult.validation, // Solo los campos de validación
        qrInfo: validationResult.qrInfo
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
  },

  /**
   * Obtiene el historial de validaciones del usuario
   */
  async obtenerHistorial(req, res) {
    try {
      const { page = 1, limit = 10, filtro = 'todos' } = req.query;
      const skip = (page - 1) * limit;

      // Construir filtros
      let filtros = { usuario: req.usuario.id };
      
      if (filtro === 'firmados') {
        filtros['resultado.hasSignatures'] = true;
      } else if (filtro === 'nuestro_sistema') {
        filtros['resultado.isOurSystem'] = true;
      } else if (filtro === 'otros_sistemas') {
        filtros['resultado.hasSignatures'] = true;
        filtros['resultado.isOurSystem'] = false;
      }

      // Obtener validaciones con paginación
      const validaciones = await ValidacionPDF.find(filtros)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('usuario', 'nombre username');

      // Contar total de validaciones
      const total = await ValidacionPDF.countDocuments(filtros);

      // Estadísticas
      const estadisticas = await ValidacionPDF.aggregate([
        { $match: { usuario: req.usuario.id } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            firmados: { $sum: { $cond: ['$resultado.hasSignatures', 1, 0] } },
            nuestroSistema: { $sum: { $cond: ['$resultado.isOurSystem', 1, 0] } },
            otrosSistemas: { $sum: { $cond: [{ $and: ['$resultado.hasSignatures', { $not: '$resultado.isOurSystem' }] }, 1, 0] } }
          }
        }
      ]);

      res.json({
        success: true,
        validaciones,
        paginacion: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        },
        estadisticas: estadisticas[0] || {
          total: 0,
          firmados: 0,
          nuestroSistema: 0,
          otrosSistemas: 0
        }
      });

    } catch (error) {
      console.error('Error obteniendo historial:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener el historial',
        error: error.message
      });
    }
  }
};

module.exports = validacionController; 