const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Usuario = require('../models/Usuario');
const TokenInvalidado = require('../models/TokenInvalidado');
const { enviarCodigoVerificacion, validarEmail } = require('../services/emailService');

const SECRET_KEY = 'mi_clave_secreta';

const usuarioController = {
  async registrar(req, res) {
    const { nombre, username, email, password } = req.body;
    
    try {
      // Validaciones
      if (!nombre || !username || !email || !password) {
        return res.status(400).json({ 
          mensaje: 'Todos los campos son requeridos: nombre, username, email, password' 
        });
      }

      // Validar formato de email
      if (!validarEmail(email)) {
        return res.status(400).json({ 
          mensaje: 'Formato de email inválido' 
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

      // Crear nuevo usuario
      const nuevoUsuario = new Usuario({
        nombre,
        username: username.toLowerCase(),
        email: email.toLowerCase(),
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

      // Verificar si el email está verificado
      if (!usuario.emailVerificado) {
        return res.status(401).json({ 
          mensaje: 'Debes verificar tu email antes de iniciar sesión',
          requiereVerificacion: true,
          email: usuario.email
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
    const usuarios = await Usuario.find({}, { password: 0, codigoVerificacion: 0, codigoExpiracion: 0 });
    res.json(usuarios);
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
  }
};

module.exports = usuarioController;

