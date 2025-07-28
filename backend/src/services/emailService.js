const nodemailer = require('nodemailer');
const emailConfig = require('../../config/email');

// Configuración del transportador de correo
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: emailConfig.gmail.user,
    pass: emailConfig.gmail.pass
  }
});

// Función para validar formato de email
const validarEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Función para enviar código de verificación
const enviarCodigoVerificacion = async (email, nombre, codigo) => {
  try {
    // Validar formato de email
    if (!validarEmail(email)) {
      throw new Error('Formato de email inválido');
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verificación de Email - Digital Sign',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0; font-size: 28px;">Digital Sign</h1>
              <p style="color: #6b7280; margin: 10px 0 0 0;">Sistema de Firma Digital</p>
            </div>
            
            <div style="margin-bottom: 30px;">
              <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Verificación de Email</h2>
              <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">
                Hola <strong>${nombre}</strong>,
              </p>
              <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">
                Gracias por registrarte en Digital Sign. Para completar tu registro, 
                necesitamos verificar tu dirección de email.
              </p>
            </div>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 30px;">
              <p style="color: #374151; margin: 0 0 10px 0; font-weight: bold;">Tu código de verificación es:</p>
              <div style="background-color: #ffffff; padding: 15px; border-radius: 6px; border: 2px dashed #d1d5db;">
                <span style="font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 5px;">${codigo}</span>
              </div>
            </div>
            
            <div style="margin-bottom: 30px;">
              <p style="color: #374151; line-height: 1.6; margin: 0 0 15px 0;">
                <strong>Instrucciones:</strong>
              </p>
              <ul style="color: #374151; line-height: 1.6; margin: 0; padding-left: 20px;">
                <li>Ingresa este código en la página de verificación</li>
                <li>El código expira en 15 minutos</li>
                <li>Si no solicitaste este código, puedes ignorar este email</li>
              </ul>
            </div>
            
            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                Este es un email automático, por favor no respondas a este mensaje.
              </p>
            </div>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email enviado:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Error enviando email:', error);
    throw new Error('Error al enviar el email de verificación');
  }
};

// Función para verificar si un email existe (validación básica)
const verificarEmailExiste = async (email) => {
  try {
    // Aquí podrías implementar una validación más robusta
    // Por ahora solo validamos el formato
    return validarEmail(email);
  } catch (error) {
    console.error('Error verificando email:', error);
    return false;
  }
};

// Función para enviar email de recuperación de contraseña
const enviarEmailRecuperacion = async (email, nombre, resetUrl) => {
  try {
    if (!validarEmail(email)) {
      throw new Error('Formato de email inválido');
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Recuperación de Contraseña - Digital Sign',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0; font-size: 28px;">Digital Sign</h1>
              <p style="color: #6b7280; margin: 10px 0 0 0;">Sistema de Firma Digital</p>
            </div>
            
            <div style="margin-bottom: 30px;">
              <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Recuperación de Contraseña</h2>
              <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">
                Hola <strong>${nombre}</strong>,
              </p>
              <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">
                Has solicitado restablecer tu contraseña en Digital Sign. 
                Haz clic en el botón de abajo para crear una nueva contraseña.
              </p>
            </div>
            
            <div style="text-align: center; margin-bottom: 30px;">
              <a href="${resetUrl}" 
                 style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                Restablecer Contraseña
              </a>
            </div>
            
            <div style="margin-bottom: 30px;">
              <p style="color: #374151; line-height: 1.6; margin: 0 0 15px 0;">
                <strong>Información importante:</strong>
              </p>
              <ul style="color: #374151; line-height: 1.6; margin: 0; padding-left: 20px;">
                <li>Este enlace es válido por 1 hora</li>
                <li>Si no solicitaste este cambio, puedes ignorar este email</li>
                <li>Tu contraseña actual seguirá funcionando hasta que la cambies</li>
              </ul>
            </div>
            
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin-bottom: 30px;">
              <p style="color: #6b7280; font-size: 14px; margin: 0; text-align: center;">
                Si el botón no funciona, copia y pega este enlace en tu navegador:
              </p>
              <p style="color: #2563eb; font-size: 12px; margin: 10px 0 0 0; text-align: center; word-break: break-all;">
                ${resetUrl}
              </p>
            </div>
            
            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                Este es un email automático, por favor no respondas a este mensaje.
              </p>
            </div>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email de recuperación enviado:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Error enviando email de recuperación:', error);
    throw new Error('Error al enviar el email de recuperación');
  }
};

// NUEVO: Función para enviar solicitud de firma
const enviarSolicitudFirma = async ({ firmanteEmail, firmanteNombre, solicitanteNombre, documentoNombre, mensaje, linkFirma }) => {
  try {
    if (!validarEmail(firmanteEmail)) {
      throw new Error('Formato de email inválido');
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: firmanteEmail,
      subject: `Solicitud de Firma - ${documentoNombre}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0; font-size: 28px;">Digital Sign</h1>
              <p style="color: #6b7280; margin: 10px 0 0 0;">Sistema de Firma Digital</p>
            </div>
            
            <div style="margin-bottom: 30px;">
              <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Solicitud de Firma</h2>
              <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">
                Hola <strong>${firmanteNombre}</strong>,
              </p>
              <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">
                <strong>${solicitanteNombre}</strong> te ha solicitado que firmes el documento:
              </p>
              <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
                <h3 style="color: #2563eb; margin: 0; font-size: 18px;">📄 ${documentoNombre}</h3>
              </div>
              ${mensaje ? `<p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;"><strong>Mensaje:</strong> ${mensaje}</p>` : ''}
            </div>
            
            <div style="text-align: center; margin-bottom: 30px;">
              <a href="${linkFirma}" 
                 style="display: inline-block; background-color: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                📝 Firmar Documento
              </a>
            </div>
            
            <div style="margin-bottom: 30px;">
              <p style="color: #374151; line-height: 1.6; margin: 0 0 15px 0;">
                <strong>Información importante:</strong>
              </p>
              <ul style="color: #374151; line-height: 1.6; margin: 0; padding-left: 20px;">
                <li>Este enlace expira en 7 días</li>
                <li>Necesitarás tu certificado digital para firmar</li>
                <li>La firma será posicionada automáticamente</li>
                <li>El documento se actualizará automáticamente</li>
              </ul>
            </div>
            
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin-bottom: 30px;">
              <p style="color: #6b7280; font-size: 14px; margin: 0; text-align: center;">
                Si el botón no funciona, copia y pega este enlace en tu navegador:
              </p>
              <p style="color: #2563eb; font-size: 12px; margin: 10px 0 0 0; text-align: center; word-break: break-all;">
                ${linkFirma}
              </p>
            </div>
            
            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                Este es un email automático, por favor no respondas a este mensaje.
              </p>
            </div>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email de solicitud de firma enviado:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Error enviando email de solicitud de firma:', error);
    throw new Error('Error al enviar el email de solicitud de firma');
  }
};

// NUEVO: Función para enviar notificación de firma completada
const enviarNotificacionFirmaCompletada = async ({ solicitanteEmail, solicitanteNombre, firmanteNombre, documentoNombre }) => {
  try {
    if (!validarEmail(solicitanteEmail)) {
      throw new Error('Formato de email inválido');
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: solicitanteEmail,
      subject: `Firma Completada - ${documentoNombre}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0; font-size: 28px;">Digital Sign</h1>
              <p style="color: #6b7280; margin: 10px 0 0 0;">Sistema de Firma Digital</p>
            </div>
            
            <div style="margin-bottom: 30px;">
              <h2 style="color: #10b981; margin: 0 0 20px 0; font-size: 24px;">✅ Firma Completada</h2>
              <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">
                Hola <strong>${solicitanteNombre}</strong>,
              </p>
              <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">
                <strong>${firmanteNombre}</strong> ha firmado exitosamente el documento:
              </p>
              <div style="background-color: #f0fdf4; padding: 15px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid #10b981;">
                <h3 style="color: #059669; margin: 0; font-size: 18px;">📄 ${documentoNombre}</h3>
              </div>
            </div>
            
            <div style="margin-bottom: 30px;">
              <p style="color: #374151; line-height: 1.6; margin: 0 0 15px 0;">
                <strong>Información de la firma:</strong>
              </p>
              <ul style="color: #374151; line-height: 1.6; margin: 0; padding-left: 20px;">
                <li>Firmante: ${firmanteNombre}</li>
                <li>Fecha de firma: ${new Date().toLocaleDateString('es-ES')}</li>
                <li>Estado: Completada</li>
                <li>El documento ha sido actualizado automáticamente</li>
              </ul>
            </div>
            
            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                Este es un email automático, por favor no respondas a este mensaje.
              </p>
            </div>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email de notificación de firma completada enviado:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Error enviando email de notificación de firma completada:', error);
    throw new Error('Error al enviar el email de notificación de firma completada');
  }
};

// NUEVO: Función para enviar notificación de firma rechazada
const enviarNotificacionFirmaRechazada = async ({ solicitanteEmail, solicitanteNombre, firmanteNombre, documentoNombre, motivo }) => {
  try {
    if (!validarEmail(solicitanteEmail)) {
      throw new Error('Formato de email inválido');
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: solicitanteEmail,
      subject: `Firma Rechazada - ${documentoNombre}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0; font-size: 28px;">Digital Sign</h1>
              <p style="color: #6b7280; margin: 10px 0 0 0;">Sistema de Firma Digital</p>
            </div>
            
            <div style="margin-bottom: 30px;">
              <h2 style="color: #dc2626; margin: 0 0 20px 0; font-size: 24px;">❌ Firma Rechazada</h2>
              <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">
                Hola <strong>${solicitanteNombre}</strong>,
              </p>
              <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">
                <strong>${firmanteNombre}</strong> ha rechazado firmar el documento:
              </p>
              <div style="background-color: #fef2f2; padding: 15px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid #dc2626;">
                <h3 style="color: #dc2626; margin: 0; font-size: 18px;">📄 ${documentoNombre}</h3>
              </div>
              ${motivo ? `<p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;"><strong>Motivo:</strong> ${motivo}</p>` : ''}
            </div>
            
            <div style="margin-bottom: 30px;">
              <p style="color: #374151; line-height: 1.6; margin: 0 0 15px 0;">
                <strong>Opciones disponibles:</strong>
              </p>
              <ul style="color: #374151; line-height: 1.6; margin: 0; padding-left: 20px;">
                <li>Contactar al firmante para aclarar la situación</li>
                <li>Solicitar firma a otro usuario</li>
                <li>Modificar el documento si es necesario</li>
                <li>Crear una nueva solicitud de firma</li>
              </ul>
            </div>
            
            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                Este es un email automático, por favor no respondas a este mensaje.
              </p>
            </div>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email de notificación de firma rechazada enviado:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Error enviando email de notificación de firma rechazada:', error);
    throw new Error('Error al enviar el email de notificación de firma rechazada');
  }
};

module.exports = {
  enviarCodigoVerificacion,
  enviarEmailRecuperacion,
  validarEmail,
  verificarEmailExiste,
  enviarSolicitudFirma,
  enviarNotificacionFirmaCompletada,
  enviarNotificacionFirmaRechazada
}; 