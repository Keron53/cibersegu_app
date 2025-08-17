const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Usuario = require('../models/Usuario');
const TokenInvalidado = require('../models/TokenInvalidado');
const { enviarCodigoVerificacion, enviarEmailRecuperacion, validarEmail } = require('../services/emailService');
const UltraMsgService = require('../services/ultramsgService');
const ultramsgService = new UltraMsgService();

const SECRET_KEY = 'mi_clave_secreta';

// Validación de cédula ecuatoriana (10 dígitos, algoritmo de módulo 10)
function limpiarCedula(cedula) {
  if (!cedula) return '';
  return String(cedula).replace(/\D/g, '');
}

function validarCedulaEcuador(cedula) {
  const c = limpiarCedula(cedula);
  if (!/^\d{10}$/.test(c)) return false;

  const provincia = parseInt(c.substring(0, 2), 10);
  if (provincia < 1 || (provincia > 24 && provincia !== 30)) return false;

  const tercerDigito = parseInt(c.charAt(2), 10);
  if (tercerDigito >= 6) return false; // Personas naturales

  const coeficientes = [2,1,2,1,2,1,2,1,2];
  let suma = 0;
  for (let i = 0; i < 9; i++) {
    let val = coeficientes[i] * parseInt(c.charAt(i), 10);
    if (val >= 10) val -= 9;
    suma += val;
  }
  const decenaSuperior = Math.ceil(suma / 10) * 10;
  const digitoVerificador = decenaSuperior - suma === 10 ? 0 : decenaSuperior - suma;
  return digitoVerificador === parseInt(c.charAt(9), 10);
}

const usuarioController = {
  async registrar(req, res) {
    const { nombre, username, email, password, cedula } = req.body;
    
    try {
      // Validaciones
      if (!nombre || !username || !email || !password || !cedula) {
        return res.status(400).json({ 
          mensaje: 'Todos los campos son requeridos: nombre, username, email, password, cedula' 
        });
      }

      // Validar formato de email
      if (!validarEmail(email)) {
        return res.status(400).json({ 
          mensaje: 'Formato de email inválido' 
        });
      }

      // Validar cédula
      const cedulaLimpia = limpiarCedula(cedula);
      if (!validarCedulaEcuador(cedulaLimpia)) {
        return res.status(400).json({ 
          mensaje: 'Cédula inválida' 
        });
      }

      // Validar política de contraseñas
      if (password.length < 8) {
        return res.status(400).json({ 
          mensaje: 'La contraseña debe tener al menos 8 caracteres' 
        });
      }
      
      // Verificar que tenga al menos una mayúscula
      if (!/[A-Z]/.test(password)) {
        return res.status(400).json({ 
          mensaje: 'La contraseña debe contener al menos una letra mayúscula' 
        });
      }
      
      // Verificar que tenga al menos una minúscula
      if (!/[a-z]/.test(password)) {
        return res.status(400).json({ 
          mensaje: 'La contraseña debe contener al menos una letra minúscula' 
        });
      }
      
      // Verificar que tenga al menos un número
      if (!/\d/.test(password)) {
        return res.status(400).json({ 
          mensaje: 'La contraseña debe contener al menos un número' 
        });
      }

      // Verificar si el username ya existe
      const usuarioExistente = await Usuario.findOne({ username: username.toLowerCase() });
      if (usuarioExistente) {
        return res.status(400).json({ 
          mensaje: 'El nombre de usuario ya está registrado' 
        });
      }

      // Verificar si el email ya existe
      const emailExistente = await Usuario.findOne({ email: email.toLowerCase() });
      if (emailExistente) {
        return res.status(400).json({ 
          mensaje: 'El email ya está registrado' 
        });
      }

      // Verificar si la cédula ya existe
      const cedulaExistente = await Usuario.findOne({ cedula: cedulaLimpia });
      if (cedulaExistente) {
        return res.status(400).json({ 
          mensaje: 'La cédula ya está registrada' 
        });
      }

      // Crear nuevo usuario
      const nuevoUsuario = new Usuario({
        nombre,
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        cedula: cedulaLimpia,
        password
      });

      // Generar código de verificación
      const codigo = nuevoUsuario.generarCodigoVerificacion();
      
      // Guardar usuario
      await nuevoUsuario.save();

      // Enviar email de verificación
      try {
        await enviarCodigoVerificacion(email, nombre, codigo);
        console.log('✅ Email de verificación enviado a:', email);
      } catch (emailError) {
        console.error('❌ Error enviando email:', emailError);
        // No fallar el registro si el email falla, pero informar al usuario
        return res.status(201).json({
          mensaje: 'Usuario registrado exitosamente, pero hubo un problema enviando el email de verificación. Contacta al administrador.',
          usuario: {
            id: nuevoUsuario._id,
            nombre: nuevoUsuario.nombre,
            username: nuevoUsuario.username,
            email: nuevoUsuario.email,
            emailVerificado: nuevoUsuario.emailVerificado
          }
        });
      }

      // Respuesta exitosa
      const { password: _pw, ...userData } = nuevoUsuario.toObject();
      res.status(201).json({
        mensaje: 'Usuario registrado exitosamente. Revisa tu email para verificar tu cuenta.',
        usuario: userData
      });

    } catch (err) {
      console.error('Error al registrar usuario:', err);
      res.status(500).json({ error: 'Error al registrar usuario' });
    }
  },

  async verificarEmail(req, res) {
    const { email, codigo } = req.body;
    
    try {
      if (!email || !codigo) {
        return res.status(400).json({ 
          mensaje: 'Email y código son requeridos' 
        });
      }

      const usuario = await Usuario.findOne({ email: email.toLowerCase() });
      if (!usuario) {
        return res.status(404).json({ 
          mensaje: 'Usuario no encontrado' 
        });
      }

      if (usuario.emailVerificado) {
        return res.status(400).json({ 
          mensaje: 'El email ya está verificado' 
        });
      }

      // Verificar código
      try {
        usuario.verificarCodigo(codigo);
        await usuario.save();
        
        res.json({ 
          mensaje: 'Email verificado exitosamente',
          usuario: {
            id: usuario._id,
            nombre: usuario.nombre,
            username: usuario.username,
            email: usuario.email,
            emailVerificado: usuario.emailVerificado
          }
        });
      } catch (verificacionError) {
        res.status(400).json({ 
          mensaje: verificacionError.message 
        });
      }

    } catch (err) {
      console.error('Error al verificar email:', err);
      res.status(500).json({ error: 'Error al verificar email' });
    }
  },

  async reenviarCodigo(req, res) {
    const { email } = req.body;
    
    try {
      if (!email) {
        return res.status(400).json({ 
          mensaje: 'Email es requerido' 
        });
      }

      const usuario = await Usuario.findOne({ email: email.toLowerCase() });
      if (!usuario) {
        return res.status(404).json({ 
          mensaje: 'Usuario no encontrado' 
        });
      }

      if (usuario.emailVerificado) {
        return res.status(400).json({ 
          mensaje: 'El email ya está verificado' 
        });
      }

      // Generar nuevo código
      const codigo = usuario.generarCodigoVerificacion();
      await usuario.save();

      // Enviar nuevo email
      try {
        await enviarCodigoVerificacion(email, usuario.nombre, codigo);
        res.json({ 
          mensaje: 'Nuevo código de verificación enviado' 
        });
      } catch (emailError) {
        console.error('❌ Error enviando email:', emailError);
        res.status(500).json({ 
          error: 'Error al enviar el código de verificación' 
        });
      }

    } catch (err) {
      console.error('Error al reenviar código:', err);
      res.status(500).json({ error: 'Error al reenviar código' });
    }
  },

  async login(req, res) {
    const { username, password } = req.body;
    try {
      const usuario = await Usuario.findOne({ username: username.toLowerCase() });
      if (!usuario) return res.status(401).json({ mensaje: 'Credenciales inválidas' });

      const match = await bcrypt.compare(password, usuario.password);
      if (!match) return res.status(401).json({ mensaje: 'Credenciales inválidas' });

      // Verificar si el email o teléfono está verificado
      if (usuario.email && !usuario.emailVerificado) {
        return res.status(401).json({ 
          mensaje: 'Debes verificar tu email antes de iniciar sesión',
          requiereVerificacion: true,
          email: usuario.email
        });
      }
      
      if (usuario.telefono && !usuario.telefonoVerificado) {
        return res.status(401).json({ 
          mensaje: 'Debes verificar tu teléfono antes de iniciar sesión',
          requiereVerificacion: true,
          telefono: usuario.telefono
        });
      }

      const token = jwt.sign({ 
        id: usuario._id, 
        username: usuario.username,
        nombre: usuario.nombre,
        email: usuario.email
      }, SECRET_KEY, { expiresIn: '1h' });
      
      res.json({ 
        token,
        usuario: {
          id: usuario._id,
          nombre: usuario.nombre,
          username: usuario.username,
          email: usuario.email,
          emailVerificado: usuario.emailVerificado
        }
      });
    } catch (err) {
      res.status(500).json({ error: 'Error al iniciar sesión' });
    }
  },

  async logout(req, res) {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      if (!token) return res.status(400).json({ mensaje: 'No se proporcionó token' });

      const decoded = jwt.verify(token, SECRET_KEY);
      const fechaExpiracion = new Date(decoded.exp * 1000);

      const tokenInvalidado = new TokenInvalidado({ token, fechaExpiracion });
      await tokenInvalidado.save();

      res.json({ mensaje: 'Sesión cerrada exitosamente' });
    } catch (err) {
      res.status(500).json({ error: 'Error al cerrar sesión' });
    }
  },

  async listarUsuarios(req, res) {
    try {
      // Solo usuarios con email verificado
      const usuarios = await Usuario.find(
        { 
          email: { $exists: true, $ne: null, $ne: '' },
          emailVerificado: true 
        }, 
        { 
          password: 0, 
          codigoVerificacion: 0, 
          codigoExpiracion: 0,
          codigoWhatsApp: 0,
          codigoWhatsAppExpiracion: 0,
          tokenRecuperacion: 0,
          tokenRecuperacionExpiracion: 0,
          intentosVerificacion: 0
        }
      );
      
      console.log(`📋 Usuarios encontrados: ${usuarios.length}`);
      usuarios.forEach(u => {
        console.log(`👤 Usuario: ${u.nombre} (${u.email}) - Verificado: ${u.emailVerificado}`);
      });
      
    res.json(usuarios);
    } catch (error) {
      console.error('❌ Error listando usuarios:', error);
      res.status(500).json({ error: 'Error al listar usuarios' });
    }
  },

  async obtenerPerfil(req, res) {
    try {
      const usuario = await Usuario.findById(req.usuario.id, { 
        password: 0, 
        codigoVerificacion: 0, 
        codigoExpiracion: 0,
        intentosVerificacion: 0
      });
      
      if (!usuario) {
        return res.status(404).json({ mensaje: 'Usuario no encontrado' });
      }

      res.json(usuario);
    } catch (err) {
      res.status(500).json({ error: 'Error al obtener perfil' });
    }
  },

  async actualizarPerfil(req, res) {
    try {
      const { nombre, email } = req.body;
      const usuario = await Usuario.findById(req.usuario.id);
      
      if (!usuario) {
        return res.status(404).json({ mensaje: 'Usuario no encontrado' });
      }

      // Validar email si se está cambiando
      if (email && email !== usuario.email) {
        if (!validarEmail(email)) {
          return res.status(400).json({ mensaje: 'Formato de email inválido' });
        }

        const emailExistente = await Usuario.findOne({ 
          email: email.toLowerCase(),
          _id: { $ne: usuario._id }
        });
        
        if (emailExistente) {
          return res.status(400).json({ mensaje: 'El email ya está en uso' });
        }

        usuario.email = email.toLowerCase();
        usuario.emailVerificado = false; // Requiere nueva verificación
      }

      if (nombre) {
        usuario.nombre = nombre;
      }

      await usuario.save();

      const { password: _pw, ...userData } = usuario.toObject();
      res.json({
        mensaje: 'Perfil actualizado exitosamente',
        usuario: userData
      });
    } catch (err) {
      console.error('Error al actualizar perfil:', err);
      res.status(500).json({ error: 'Error al actualizar perfil' });
    }
  },

  // Función para cambiar contraseña (desde perfil)
  async cambiarContrasena(req, res) {
    try {
      const { contrasenaActual, nuevaContrasena } = req.body;
      
      if (!contrasenaActual || !nuevaContrasena) {
        return res.status(400).json({ 
          mensaje: 'La contraseña actual y la nueva contraseña son requeridas' 
        });
      }

      const usuario = await Usuario.findById(req.usuario.id);
      if (!usuario) {
        return res.status(404).json({ mensaje: 'Usuario no encontrado' });
      }

      // Verificar contraseña actual
      const contrasenaValida = await bcrypt.compare(contrasenaActual, usuario.password);
      if (!contrasenaValida) {
        return res.status(400).json({ mensaje: 'La contraseña actual es incorrecta' });
      }

      // Validar nueva contraseña
      if (nuevaContrasena.length < 8) {
        return res.status(400).json({ 
          mensaje: 'La nueva contraseña debe tener al menos 8 caracteres' 
        });
      }
      
      if (!/[A-Z]/.test(nuevaContrasena)) {
        return res.status(400).json({ 
          mensaje: 'La nueva contraseña debe contener al menos una letra mayúscula' 
        });
      }
      
      if (!/[a-z]/.test(nuevaContrasena)) {
        return res.status(400).json({ 
          mensaje: 'La nueva contraseña debe contener al menos una letra minúscula' 
        });
      }
      
      if (!/\d/.test(nuevaContrasena)) {
        return res.status(400).json({ 
          mensaje: 'La nueva contraseña debe contener al menos un número' 
        });
      }

      // Verificar que la nueva contraseña sea diferente
      const nuevaContrasenaValida = await bcrypt.compare(nuevaContrasena, usuario.password);
      if (nuevaContrasenaValida) {
        return res.status(400).json({ 
          mensaje: 'La nueva contraseña debe ser diferente a la actual' 
        });
      }

      // Actualizar contraseña
      usuario.password = nuevaContrasena;
      await usuario.save();

      res.json({ mensaje: 'Contraseña cambiada exitosamente' });
    } catch (err) {
      console.error('Error al cambiar contraseña:', err);
      res.status(500).json({ error: 'Error al cambiar contraseña' });
    }
  },

  // Función para solicitar recuperación de contraseña
  async solicitarRecuperacionContrasena(req, res) {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ mensaje: 'El email es requerido' });
      }

      if (!validarEmail(email)) {
        return res.status(400).json({ mensaje: 'Formato de email inválido' });
      }

      const usuario = await Usuario.findOne({ email: email.toLowerCase() });
      if (!usuario) {
        // Por seguridad, no revelar si el email existe o no
        return res.json({ 
          mensaje: 'Si el email está registrado, recibirás un enlace de recuperación' 
        });
      }

      // Generar token de recuperación (válido por 1 hora)
      const tokenRecuperacion = jwt.sign(
        { id: usuario._id, tipo: 'recuperacion' },
        SECRET_KEY,
        { expiresIn: '1h' }
      );

      // Guardar token en el usuario
      usuario.tokenRecuperacion = tokenRecuperacion;
      usuario.tokenRecuperacionExpiracion = new Date(Date.now() + 60 * 60 * 1000); // 1 hora
      await usuario.save();

      // Enviar email con enlace de recuperación
      try {
        const resetUrl = `http://localhost:5173/recuperar-contrasena?token=${tokenRecuperacion}`;
        await enviarEmailRecuperacion(email, usuario.nombre, resetUrl);
        
        res.json({ 
          mensaje: 'Si el email está registrado, recibirás un enlace de recuperación' 
        });
      } catch (emailError) {
        console.error('Error enviando email de recuperación:', emailError);
        res.status(500).json({ 
          error: 'Error al enviar el email de recuperación' 
        });
      }
    } catch (err) {
      console.error('Error al solicitar recuperación:', err);
      res.status(500).json({ error: 'Error al procesar la solicitud' });
    }
  },

  // Función para restablecer contraseña con token
  async restablecerContrasena(req, res) {
    try {
      const { token, nuevaContrasena } = req.body;
      
      if (!token || !nuevaContrasena) {
        return res.status(400).json({ 
          mensaje: 'El token y la nueva contraseña son requeridos' 
        });
      }

      // Verificar token
      let decoded;
      try {
        decoded = jwt.verify(token, SECRET_KEY);
        if (decoded.tipo !== 'recuperacion') {
          throw new Error('Token inválido');
        }
      } catch (tokenError) {
        return res.status(400).json({ mensaje: 'Token de recuperación inválido o expirado' });
      }

      const usuario = await Usuario.findById(decoded.id);
      if (!usuario) {
        return res.status(404).json({ mensaje: 'Usuario no encontrado' });
      }

      // Verificar que el token coincida y no haya expirado
      if (usuario.tokenRecuperacion !== token || 
          usuario.tokenRecuperacionExpiracion < new Date()) {
        return res.status(400).json({ mensaje: 'Token de recuperación inválido o expirado' });
      }

      // Validar nueva contraseña
      if (nuevaContrasena.length < 8) {
        return res.status(400).json({ 
          mensaje: 'La nueva contraseña debe tener al menos 8 caracteres' 
        });
      }
      
      if (!/[A-Z]/.test(nuevaContrasena)) {
        return res.status(400).json({ 
          mensaje: 'La nueva contraseña debe contener al menos una letra mayúscula' 
        });
      }
      
      if (!/[a-z]/.test(nuevaContrasena)) {
        return res.status(400).json({ 
          mensaje: 'La nueva contraseña debe contener al menos una letra minúscula' 
        });
      }
      
      if (!/\d/.test(nuevaContrasena)) {
        return res.status(400).json({ 
          mensaje: 'La nueva contraseña debe contener al menos un número' 
        });
      }

      // Actualizar contraseña y limpiar token
      usuario.password = nuevaContrasena;
      usuario.tokenRecuperacion = undefined;
      usuario.tokenRecuperacionExpiracion = undefined;
      await usuario.save();

      res.json({ mensaje: 'Contraseña restablecida exitosamente' });
    } catch (err) {
      console.error('Error al restablecer contraseña:', err);
      res.status(500).json({ error: 'Error al restablecer contraseña' });
    }
  },

  // Nuevas funciones para WhatsApp
  async registrarConWhatsApp(req, res) {
    const { nombre, username, telefono, password, cedula } = req.body;
    
    try {
      // Validaciones
      if (!nombre || !username || !telefono || !password || !cedula) {
        return res.status(400).json({ 
          mensaje: 'Todos los campos son requeridos: nombre, username, telefono, password, cedula' 
        });
      }

      // Validar formato de teléfono
      try {
        ultramsgService.validarTelefono(telefono);
      } catch (error) {
        return res.status(400).json({ 
          mensaje: error.message || 'Formato de número de teléfono inválido' 
        });
      }

      // Validar cédula
      const cedulaLimpia = limpiarCedula(cedula);
      if (!validarCedulaEcuador(cedulaLimpia)) {
        return res.status(400).json({ 
          mensaje: 'Cédula inválida' 
        });
      }

      // Validar política de contraseñas
      if (password.length < 8) {
        return res.status(400).json({ 
          mensaje: 'La contraseña debe tener al menos 8 caracteres' 
        });
      }
      
      if (!/[A-Z]/.test(password)) {
        return res.status(400).json({ 
          mensaje: 'La contraseña debe contener al menos una letra mayúscula' 
        });
      }
      
      if (!/[a-z]/.test(password)) {
        return res.status(400).json({ 
          mensaje: 'La contraseña debe contener al menos una letra minúscula' 
        });
      }
      
      if (!/\d/.test(password)) {
        return res.status(400).json({ 
          mensaje: 'La contraseña debe contener al menos un número' 
        });
      }

      // Verificar si el username ya existe
      const usuarioExistente = await Usuario.findOne({ username: username.toLowerCase() });
      if (usuarioExistente) {
        return res.status(400).json({ 
          mensaje: 'El nombre de usuario ya está registrado' 
        });
      }

      // Verificar si el teléfono ya existe
      const telefonoFormateado = ultramsgService.formatearTelefono(telefono);
      const telefonoExistente = await Usuario.findOne({ telefono: telefonoFormateado });
      if (telefonoExistente) {
        return res.status(400).json({ 
          mensaje: 'El número de teléfono ya está registrado' 
        });
      }

      // Verificar si la cédula ya existe
      const cedulaExistente = await Usuario.findOne({ cedula: cedulaLimpia });
      if (cedulaExistente) {
        return res.status(400).json({ 
          mensaje: 'La cédula ya está registrada' 
        });
      }

      // Crear nuevo usuario
      const nuevoUsuario = new Usuario({
        nombre,
        username: username.toLowerCase(),
        telefono: telefonoFormateado,
        cedula: cedulaLimpia,
        password
      });

      // Generar código de verificación WhatsApp
      const codigo = nuevoUsuario.generarCodigoWhatsApp();
      
      // Guardar usuario
      await nuevoUsuario.save();

      // Enviar código por WhatsApp
      try {
        await ultramsgService.enviarCodigoVerificacion(telefonoFormateado, codigo);
        console.log('✅ Código WhatsApp enviado a:', telefonoFormateado);
        
        res.status(201).json({
          mensaje: 'Usuario registrado exitosamente. Se ha enviado un código de verificación por WhatsApp.',
          usuario: {
            id: nuevoUsuario._id,
            nombre: nuevoUsuario.nombre,
            username: nuevoUsuario.username,
            telefono: nuevoUsuario.telefono,
            telefonoVerificado: nuevoUsuario.telefonoVerificado
          }
        });
      } catch (whatsappError) {
        console.error('❌ Error enviando WhatsApp:', whatsappError);
        return res.status(201).json({
          mensaje: 'Usuario registrado exitosamente, pero hubo un problema enviando el código por WhatsApp. Contacta al administrador.',
          usuario: {
            id: nuevoUsuario._id,
            nombre: nuevoUsuario.nombre,
            username: nuevoUsuario.username,
            telefono: nuevoUsuario.telefono,
            telefonoVerificado: nuevoUsuario.telefonoVerificado
          }
        });
      }

    } catch (error) {
      console.error('Error registrando usuario con WhatsApp:', error);
      res.status(500).json({ 
        mensaje: 'Error al registrar el usuario' 
      });
    }
  },

  async verificarWhatsApp(req, res) {
    const { username, codigo } = req.body;
    
    try {
      console.log('🔍 Verificando WhatsApp para:', username, 'con código:', codigo);
      
      if (!username || !codigo) {
        return res.status(400).json({ 
          mensaje: 'Username y código son requeridos' 
        });
      }

      // Buscar usuario
      const usuario = await Usuario.findOne({ username: username.toLowerCase() });
      console.log('🔍 Usuario encontrado:', usuario ? 'Sí' : 'No');
      if (usuario) {
        console.log('👤 Usuario:', usuario.username, 'Teléfono:', usuario.telefono);
      }
      
      if (!usuario) {
        return res.status(400).json({ 
          mensaje: 'Usuario no encontrado' 
        });
      }

      // Verificar código
      try {
        console.log('🔍 Código recibido:', codigo);
        console.log('🔍 Código almacenado:', usuario.codigoWhatsApp);
        console.log('🔍 Expiración:', usuario.codigoWhatsAppExpiracion);
        console.log('🔍 Intentos:', usuario.intentosVerificacion);
        
        usuario.verificarCodigoWhatsApp(codigo);
        await usuario.save();

        console.log('✅ Verificación exitosa');
        res.json({ 
          mensaje: 'Teléfono verificado exitosamente' 
        });
      } catch (verificationError) {
        console.log('❌ Error en verificación:', verificationError.message);
        res.status(400).json({ 
          mensaje: verificationError.message 
        });
      }

    } catch (error) {
      console.error('Error verificando WhatsApp:', error);
      res.status(500).json({ 
        mensaje: 'Error al verificar el código' 
      });
    }
  },

  async reenviarCodigoWhatsApp(req, res) {
    const { username } = req.body;
    
    try {
      if (!username) {
        return res.status(400).json({ 
          mensaje: 'Username es requerido' 
        });
      }

      // Buscar usuario
      const usuario = await Usuario.findOne({ username: username.toLowerCase() });
      if (!usuario) {
        return res.status(400).json({ 
          mensaje: 'Usuario no encontrado' 
        });
      }

      if (usuario.telefonoVerificado) {
        return res.status(400).json({ 
          mensaje: 'El teléfono ya está verificado' 
        });
      }

      // Generar nuevo código
      const codigo = usuario.generarCodigoWhatsApp();
      await usuario.save();

      // Enviar nuevo código por WhatsApp
      try {
        await ultramsgService.enviarCodigoVerificacion(usuario.telefono, codigo);
        console.log('✅ Nuevo código WhatsApp enviado a:', usuario.telefono);
        
        res.json({ 
          mensaje: 'Nuevo código enviado por WhatsApp' 
        });
      } catch (whatsappError) {
        console.error('❌ Error enviando WhatsApp:', whatsappError);
        res.status(500).json({ 
          mensaje: 'Error al enviar el código por WhatsApp' 
        });
      }

    } catch (error) {
      console.error('Error reenviando código WhatsApp:', error);
      res.status(500).json({ 
        mensaje: 'Error al reenviar el código' 
      });
    }
  },

  async checkUsernameAvailability(req, res) {
    const { username } = req.body;
    
    try {
      if (!username) {
        return res.status(400).json({ 
          mensaje: 'Username es requerido' 
        });
      }

      // Buscar usuario
      const usuario = await Usuario.findOne({ username: username.toLowerCase() });
      
      res.json({ 
        available: !usuario,
        username: username.toLowerCase()
      });
      
    } catch (error) {
      console.error('Error verificando disponibilidad de usuario:', error);
      res.status(500).json({ 
        mensaje: 'Error al verificar disponibilidad' 
      });
    }
  },

  async checkEmailAvailability(req, res) {
    const { email } = req.body;
    
    try {
      if (!email) {
        return res.status(400).json({ 
          mensaje: 'Email es requerido' 
        });
      }

      // Validar formato de email
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ 
          mensaje: 'Formato de email inválido' 
        });
      }

      // Buscar usuario
      const usuario = await Usuario.findOne({ email: email.toLowerCase() });
      
      res.json({ 
        available: !usuario,
        email: email.toLowerCase()
      });
      
    } catch (error) {
      console.error('Error verificando disponibilidad de email:', error);
      res.status(500).json({ 
        mensaje: 'Error al verificar disponibilidad' 
      });
    }
  },

  async checkTelefonoAvailability(req, res) {
    const { telefono } = req.body;
    
    try {
      if (!telefono) {
        return res.status(400).json({ 
          mensaje: 'Teléfono es requerido' 
        });
      }

      // Limpiar el teléfono (remover espacios, guiones, paréntesis)
      const telefonoLimpio = telefono.replace(/[\s\-\(\)]/g, '');
      
      // Validar formato básico de teléfono
      if (telefonoLimpio.length < 10) {
        return res.status(400).json({ 
          mensaje: 'El teléfono debe tener al menos 10 dígitos' 
        });
      }

      // Buscar usuario por teléfono
      const usuario = await Usuario.findOne({ telefono: telefonoLimpio });
      
      res.json({ 
        available: !usuario,
        telefono: telefonoLimpio
      });
      
    } catch (error) {
      console.error('Error verificando disponibilidad de teléfono:', error);
      res.status(500).json({ 
        mensaje: 'Error al verificar disponibilidad' 
      });
    }
  },

  // Función para recuperar nombre de usuario por email o cédula
  async recuperarNombreUsuario(req, res) {
    try {
      const { emailOCedula } = req.body;
      
      if (!emailOCedula) {
        return res.status(400).json({ 
          mensaje: 'Email o cédula son requeridos' 
        });
      }

      let usuario = null;
      const input = emailOCedula.trim();
      
      // Determinar si es email o cédula
      if (input.includes('@')) {
        // Es un email
        if (!validarEmail(input)) {
          return res.status(400).json({ 
            mensaje: 'Formato de email inválido' 
          });
        }
        usuario = await Usuario.findOne({ email: input.toLowerCase() });
      } else {
        // Es una cédula
        const cedulaLimpia = limpiarCedula(input);
        if (!validarCedulaEcuador(cedulaLimpia)) {
          return res.status(400).json({ 
            mensaje: 'Formato de cédula inválido' 
          });
        }
        usuario = await Usuario.findOne({ cedula: cedulaLimpia });
      }

      // Por seguridad, siempre responder lo mismo
      const mensajeGenerico = 'Si los datos son correctos, recibirás la información en tu email o WhatsApp registrado';
      
      if (!usuario) {
        return res.json({ mensaje: mensajeGenerico });
      }

      // Enviar información por email si tiene email verificado
      if (usuario.email && usuario.emailVerificado) {
        try {
          const { enviarRecuperacionUsuario } = require('../services/emailService');
          await enviarRecuperacionUsuario(usuario.email, usuario.nombre, usuario.username);
          console.log('✅ Email de recuperación de usuario enviado a:', usuario.email);
        } catch (emailError) {
          console.error('❌ Error enviando email de recuperación de usuario:', emailError);
        }
      }

      // Enviar información por WhatsApp si tiene teléfono verificado
      if (usuario.telefono && usuario.telefonoVerificado) {
        try {
          const mensaje = `Hola ${usuario.nombre}, tu nombre de usuario es: ${usuario.username}`;
          await ultramsgService.enviarMensaje(usuario.telefono, mensaje);
          console.log('✅ WhatsApp de recuperación de usuario enviado a:', usuario.telefono);
        } catch (whatsappError) {
          console.error('❌ Error enviando WhatsApp de recuperación de usuario:', whatsappError);
        }
      }

      res.json({ mensaje: mensajeGenerico });
      
    } catch (error) {
      console.error('Error recuperando nombre de usuario:', error);
      res.status(500).json({ 
        mensaje: 'Error al procesar la solicitud' 
      });
    }
  }
};

module.exports = usuarioController;

