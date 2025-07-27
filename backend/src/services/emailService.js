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
      from: process.env.EMAIL_USER || 'tu-email@gmail.com',
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

module.exports = {
  enviarCodigoVerificacion,
  validarEmail,
  verificarEmailExiste
}; 