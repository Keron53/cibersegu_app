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
  // Utilidad: validar formato básico de email
  validarEmail: (email) => {
    if (!email || typeof email !== 'string') return false;
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  },

  // Enviar código de verificación de cuenta
  enviarCodigoVerificacion: async (email, nombre, codigo) => {
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verificación de Email</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f7fb; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #ffffff; padding: 20px; border-radius: 0 0 8px 8px; }
          .footer { text-align: center; margin-top: 20px; color: #64748b; font-size: 14px; }
          .highlight { background: #f8fafc; border: 1px solid #e5e7eb; padding: 15px; border-radius: 6px; margin: 15px 0; }
          .code-container { text-align: center; margin: 20px 0; }
          .code { font-size: 28px; font-weight: bold; letter-spacing: 4px; background: #eef2ff; border: 1px dashed #93c5fd; color: #1f2937; padding: 12px 16px; border-radius: 8px; display: inline-block; }
          .brand { color: #ffffff; font-size: 24px; font-weight: 700; margin: 0; }
          .subtitle { color: #ffffff; font-size: 14px; margin-top: 4px; opacity: 0.9; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="brand">Digital Sign</div>
            <div class="subtitle">Sistema de Firma Digital</div>
          </div>
          <div class="content">
            <h2>Verificación de Email</h2>
            
            <p>Hola <strong>${nombre}</strong>,</p>
            <p>Gracias por registrarte en Digital Sign. Para completar tu registro, necesitamos verificar tu dirección de email.</p>
            
            <div class="code-container">
              <p><strong>Tu código de verificación es:</strong></p>
              <div class="code">${codigo}</div>
            </div>
            
            <div class="highlight">
              <h3>Instrucciones:</h3>
              <ul>
                <li>Ingresa este código en la página de verificación</li>
                <li>El código expira en 15 minutos</li>
                <li>Si no solicitaste este código, puedes ignorar este email</li>
              </ul>
            </div>
          </div>
          <div class="footer">
            <p>Este es un email automático, por favor no respondas a este mensaje.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"Sistema de Firmas Digitales" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Verifica tu cuenta',
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email de verificación enviado a:', email);
    return info;
  },

  // Enviar email de recuperación de contraseña
  enviarEmailRecuperacion: async (email, nombre, resetUrl) => {
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recuperación de Contraseña</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f7fb; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #ffffff; padding: 20px; border-radius: 0 0 8px 8px; }
          .btn { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #64748b; font-size: 14px; }
          .highlight { background: #f8fafc; border: 1px solid #e5e7eb; padding: 15px; border-radius: 6px; margin: 15px 0; }
          .brand { color: #ffffff; font-size: 24px; font-weight: 700; margin: 0; }
          .subtitle { color: #ffffff; font-size: 14px; margin-top: 4px; opacity: 0.9; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="brand">Digital Sign</div>
            <div class="subtitle">Sistema de Firma Digital</div>
          </div>
          <div class="content">
            <h2>Recuperación de Contraseña</h2>
            
            <p>Hola <strong>${nombre}</strong>,</p>
            <p>Has solicitado restablecer tu contraseña en Digital Sign. Haz clic en el botón de abajo para crear una nueva contraseña.</p>
            
            <p><a href="${resetUrl}" class="btn">Restablecer Contraseña</a></p>
            
            <div class="highlight">
              <h3>Información importante:</h3>
              <ul>
                <li>Este enlace es válido por 1 hora</li>
                <li>Si no solicitaste este cambio, puedes ignorar este email</li>
                <li>Tu contraseña actual seguirá funcionando hasta que la cambies</li>
              </ul>
            </div>
            
            <p>Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
            <p style="word-break: break-all; color: #64748b; font-size: 12px;">${resetUrl}</p>
          </div>
          <div class="footer">
            <p>Este es un email automático, por favor no respondas a este mensaje.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"Sistema de Firmas Digitales" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Recuperación de contraseña',
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email de recuperación enviado a:', email);
    return info;
  },

  // Enviar recuperación de nombre de usuario
  enviarRecuperacionUsuario: async (email, nombre, username) => {
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recuperación de Usuario</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f7fb; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #ffffff; padding: 20px; border-radius: 0 0 8px 8px; }
          .footer { text-align: center; margin-top: 20px; color: #64748b; font-size: 14px; }
          .highlight { background: #f8fafc; border: 1px solid #e5e7eb; padding: 15px; border-radius: 6px; margin: 15px 0; }
          .username-box { background: #eef2ff; border: 1px solid #93c5fd; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; }
          .username { font-size: 20px; font-weight: bold; color: #1f2937; }
          .brand { color: #ffffff; font-size: 24px; font-weight: 700; margin: 0; }
          .subtitle { color: #ffffff; font-size: 14px; margin-top: 4px; opacity: 0.9; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="brand">Digital Sign</div>
            <div class="subtitle">Sistema de Firma Digital</div>
          </div>
          <div class="content">
            <h2>Recuperación de Usuario</h2>
            
            <p>Hola <strong>${nombre}</strong>,</p>
            <p>Has solicitado recuperar tu nombre de usuario. Aquí tienes la información:</p>
            
            <div class="username-box">
              <p><strong>Tu nombre de usuario es:</strong></p>
              <div class="username">${username}</div>
            </div>
            
            <div class="highlight">
              <h3>Información importante:</h3>
              <ul>
                <li>Usa este nombre de usuario para iniciar sesión</li>
                <li>Si no solicitaste esta información, ignora este email</li>
                <li>Tu contraseña no ha sido modificada</li>
                <li>Si también olvidaste tu contraseña, usa la opción "¿Olvidaste tu contraseña?" en el login</li>
              </ul>
            </div>
          </div>
          <div class="footer">
            <p>Este es un email automático, por favor no respondas a este mensaje.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"Sistema de Firmas Digitales" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Recuperación de nombre de usuario',
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email de recuperación de usuario enviado a:', email);
    return info;
  },

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