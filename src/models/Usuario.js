const db = require('../config/db');

const Usuario = {
  async crear(nombre, correo, contrasena) {
    const [result] = await db.query(
      'INSERT INTO usuario (nombre, correo, contrasena) VALUES (?, ?, ?)',
      [nombre, correo, contrasena]
    );
    return { id_usuario: result.insertId, nombre, correo };
  },

  async obtenerTodos() {
    const [rows] = await db.query('SELECT id_usuario, nombre, correo FROM usuario');
    return rows;
  },

  async obtenerPorId(id_usuario) {
    const [rows] = await db.query('SELECT id_usuario, nombre, correo FROM usuario WHERE id_usuario = ?', [id_usuario]);
    return rows[0];
  },

  async obtenerPorCorreo(correo) {
    const [rows] = await db.query('SELECT * FROM usuario WHERE correo = ?', [correo]);
    return rows[0];
  },

  async actualizar(id_usuario, nombre, correo) {
    await db.query(
      'UPDATE usuario SET nombre = ?, correo = ? WHERE id_usuario = ?',
      [nombre, correo, id_usuario]
    );
    return { id_usuario, nombre, correo };
  },

  async eliminar(id_usuario) {
    await db.query('DELETE FROM usuario WHERE id_usuario = ?', [id_usuario]);
    return { mensaje: 'Usuario eliminado' };
  }
};

module.exports = Usuario;
