const nodemailer = require('nodemailer');

// Configuración del transportador de email
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false, // true para 465, false para otros puertos
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Verificar conexión
transporter.verify(function(error, success) {
  if (error) {
    console.error('❌ Error en configuración de email:', error);
  } else {
    console.log('✅ Servidor de email listo');
  }
});

const emailService = {
  // Enviar solicitud de firma múltiple
  enviarSolicitudFirmaMultiple: async ({
    firmanteEmail,
    firmanteNombre,
    solicitanteNombre,
    documentoNombre,
    titulo,
    mensaje,
    fechaExpiracion,
    enlace
  }) => {
    try {
      const fechaFormateada = new Date(fechaExpiracion).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const htmlContent = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Solicitud de Firma Múltiple</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; }
            .btn { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #64748b; font-size: 14px; }
            .highlight { background: #dbeafe; padding: 15px; border-radius: 6px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📋 Nueva Solicitud de Firma Múltiple</h1>
            </div>
            <div class="content">
              <h2>Hola ${firmanteNombre},</h2>
              
              <p><strong>${solicitanteNombre}</strong> te ha enviado una solicitud para firmar un documento como parte de una solicitud múltiple.</p>
              
              <div class="highlight">
                <h3>📄 Detalles del Documento:</h3>
                <p><strong>Nombre:</strong> ${documentoNombre}</p>
                <p><strong>Título de la Solicitud:</strong> ${titulo}</p>
                <p><strong>Fecha de Expiración:</strong> ${fechaFormateada}</p>
              </div>
              
              ${mensaje ? `<div class="highlight"><strong>💬 Mensaje del Solicitante:</strong><br>${mensaje}</div>` : ''}
              
              <p>Esta es una <strong>solicitud múltiple</strong>, lo que significa que puedes firmar el documento de forma independiente, sin esperar a otros firmantes.</p>
              
              <a href="${enlace}" class="btn">✍️ Firmar Documento</a>
              
              <p><strong>⚠️ Importante:</strong> Esta solicitud expira el ${fechaFormateada}. Asegúrate de firmar antes de esa fecha.</p>
              
              <p>Si tienes alguna pregunta, contacta a ${solicitanteNombre}.</p>
            </div>
            <div class="footer">
              <p>Este email fue enviado automáticamente por el sistema de firmas digitales.</p>
              <p>No respondas a este email.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const mailOptions = {
        from: `"Sistema de Firmas Digitales" <${process.env.SMTP_USER}>`,
        to: firmanteEmail,
        subject: `✍️ Solicitud de Firma Múltiple: ${titulo}`,
        html: htmlContent
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Email de solicitud múltiple enviado a:', firmanteEmail);
      return info;

    } catch (error) {
      console.error('❌ Error enviando email de solicitud múltiple:', error);
      throw error;
    }
  },

  // Notificar cuando se completa una firma
  enviarNotificacionFirmaCompletada: async ({
    solicitanteEmail,
    solicitanteNombre,
    firmanteNombre,
    documentoNombre,
    solicitudMultiple
  }) => {
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Firma Completada</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f0fdf4; padding: 20px; border-radius: 0 0 8px 8px; }
            .footer { text-align: center; margin-top: 20px; color: #64748b; font-size: 14px; }
            .highlight { background: #d1fae5; padding: 15px; border-radius: 6px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Firma Completada</h1>
            </div>
            <div class="content">
              <h2>Hola ${solicitanteNombre},</h2>
              
              <p>¡Excelente! <strong>${firmanteNombre}</strong> ha firmado exitosamente el documento de tu solicitud múltiple.</p>
              
              <div class="highlight">
                <h3>📋 Detalles:</h3>
                <p><strong>Documento:</strong> ${documentoNombre}</p>
                <p><strong>Solicitud:</strong> ${solicitudMultiple}</p>
                <p><strong>Firmante:</strong> ${firmanteNombre}</p>
                <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-ES')}</p>
              </div>
              
              <p>El proceso de firma múltiple continúa. Recibirás otra notificación cuando se complete completamente.</p>
            </div>
            <div class="footer">
              <p>Este email fue enviado automáticamente por el sistema de firmas digitales.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const mailOptions = {
        from: `"Sistema de Firmas Digitales" <${process.env.SMTP_USER}>`,
        to: solicitanteEmail,
        subject: `✅ Firma Completada: ${documentoNombre}`,
        html: htmlContent
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Email de notificación de firma enviado a:', solicitanteEmail);
      return info;

    } catch (error) {
      console.error('❌ Error enviando notificación de firma:', error);
      throw error;
    }
  },

  // Notificar cuando se cancela una solicitud
  enviarNotificacionSolicitudCancelada: async ({
    firmanteEmail,
    firmanteNombre,
    solicitanteNombre,
    documentoNombre,
    motivo
  }) => {
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Solicitud Cancelada</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #fef2f2; padding: 20px; border-radius: 0 0 8px 8px; }
            .footer { text-align: center; margin-top: 20px; color: #64748b; font-size: 14px; }
            .highlight { background: #fee2e2; padding: 15px; border-radius: 6px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>❌ Solicitud Cancelada</h1>
            </div>
            <div class="content">
              <h2>Hola ${firmanteNombre},</h2>
              
              <p><strong>${solicitanteNombre}</strong> ha cancelado la solicitud de firma múltiple para el siguiente documento:</p>
              
              <div class="highlight">
                <h3>📋 Documento:</h3>
                <p><strong>Nombre:</strong> ${documentoNombre}</p>
                <p><strong>Motivo de Cancelación:</strong> ${motivo}</p>
              </div>
              
              <p>Ya no es necesario que firmes este documento. Si tienes alguna pregunta, contacta directamente a ${solicitanteNombre}.</p>
            </div>
            <div class="footer">
              <p>Este email fue enviado automáticamente por el sistema de firmas digitales.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const mailOptions = {
        from: `"Sistema de Firmas Digitales" <${process.env.SMTP_USER}>`,
        to: firmanteEmail,
        subject: `❌ Solicitud Cancelada: ${documentoNombre}`,
        html: htmlContent
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Email de cancelación enviado a:', firmanteEmail);
      return info;

    } catch (error) {
      console.error('❌ Error enviando email de cancelación:', error);
      throw error;
    }
  },

  // Enviar recordatorio de firma
  enviarRecordatorioFirma: async ({
    firmanteEmail,
    firmanteNombre,
    solicitanteNombre,
    documentoNombre,
    titulo,
    fechaExpiracion,
    enlace
  }) => {
    try {
      const diasRestantes = Math.ceil((new Date(fechaExpiracion) - new Date()) / (1000 * 60 * 60 * 24));

      const htmlContent = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Recordatorio de Firma</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #fffbeb; padding: 20px; border-radius: 0 0 8px 8px; }
            .btn { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #64748b; font-size: 14px; }
            .highlight { background: #fef3c7; padding: 15px; border-radius: 6px; margin: 15px 0; }
            .urgent { background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⏰ Recordatorio de Firma</h1>
            </div>
            <div class="content">
              <h2>Hola ${firmanteNombre},</h2>
              
              <p>Te recordamos que tienes una solicitud de firma múltiple pendiente:</p>
              
              <div class="highlight">
                <h3>📋 Detalles:</h3>
                <p><strong>Documento:</strong> ${documentoNombre}</p>
                <p><strong>Solicitud:</strong> ${titulo}</p>
                <p><strong>Solicitante:</strong> ${solicitanteNombre}</p>
                <p><strong>Días Restantes:</strong> ${diasRestantes} día${diasRestantes !== 1 ? 's' : ''}</p>
              </div>
              
              ${diasRestantes <= 2 ? '<div class="urgent"><strong>🚨 URGENTE:</strong> Esta solicitud expira pronto. Por favor, firma lo antes posible.</div>' : ''}
              
              <a href="${enlace}" class="btn">✍️ Firmar Ahora</a>
              
              <p>Si ya firmaste este documento, puedes ignorar este recordatorio.</p>
            </div>
            <div class="footer">
              <p>Este email fue enviado automáticamente por el sistema de firmas digitales.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const mailOptions = {
        from: `"Sistema de Firmas Digitales" <${process.env.SMTP_USER}>`,
        to: firmanteEmail,
        subject: `⏰ Recordatorio: ${titulo} - ${diasRestantes} día${diasRestantes !== 1 ? 's' : ''} restante${diasRestantes !== 1 ? 's' : ''}`,
        html: htmlContent
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Recordatorio enviado a:', firmanteEmail);
      return info;

    } catch (error) {
      console.error('❌ Error enviando recordatorio:', error);
      throw error;
    }
  }
};

module.exports = emailService; 