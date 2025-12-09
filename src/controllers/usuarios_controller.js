// src/controllers/usuarios_controller.js
const { execQuery } = require("../db");
const oracledb = require("oracledb");
const bcrypt = require("bcrypt");

// ================================
// GET - listar todos los usuarios
// ================================
async function getUsuarios(req, res) {
  try {
    const sql = `
      SELECT
        id_usuario,
        email,
        nombres,
        apellidos,
        rut,
        id_rol,
        estado,
        fecha_creacion
      FROM LPMFJCBC_USUARIOS
      ORDER BY id_usuario
    `;

    const result = await execQuery(sql);
    res.json(result.rows);
  } catch (err) {
    console.error("Error getUsuarios:", err);
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
}

// ================================
// GET - usuario por ID
// ================================
async function getUsuarioById(req, res) {
  try {
    const { id } = req.params;

    const sql = `
      SELECT
        id_usuario,
        email,
        nombres,
        apellidos,
        rut,
        id_rol,
        estado,
        fecha_creacion
      FROM LPMFJCBC_USUARIOS
      WHERE id_usuario = :id
    `;

    const result = await execQuery(sql, { id: Number(id) });

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error getUsuarioById:", err);
    res.status(500).json({ error: "Error al obtener usuario" });
  }
}

// ================================
// POST - crear usuario
// ================================
async function createUsuario(req, res) {
  try {
    const {
      email,
      password,   // contraseña EN TEXTO PLANO desde frontend
      nombres,
      apellidos,
      rut,
      id_rol,
      estado
    } = req.body;

    // Validar mínimos
    if (!email || !password || !nombres || !apellidos || !rut || !id_rol || !estado) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    // 1️⃣ Generar hash bcrypt
    const password_hash = await bcrypt.hash(password, 10);

    // 2️⃣ Insertar en la BD EL HASH (no la contraseña normal)
    const sql = `
      INSERT INTO LPMFJCBC_USUARIOS (
        email,
        password_hash,
        nombres,
        apellidos,
        rut,
        id_rol,
        estado
      ) VALUES (
        :email,
        :password_hash,
        :nombres,
        :apellidos,
        :rut,
        :id_rol,
        :estado
      )
      RETURNING id_usuario INTO :id
    `;

    const binds = {
      email,
      password_hash,   // GUARDAMOS EL HASH AQUÍ
      nombres,
      apellidos,
      rut,
      id_rol,
      estado,
      id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
    };

    const result = await execQuery(sql, binds, { autoCommit: true });

    res.status(201).json({
      mensaje: "Usuario creado con éxito",
      id_usuario: result.outBinds.id[0]
    });

  } catch (err) { 
    console.error("Error createUsuario:", err);

    if (err.errorNum === 1) {
      return res.status(400).json({ error: "Email o RUT ya existe" });
    }

    res.status(500).json({ error: "Error al crear usuario" });
  }
}
  
// ================================
// PUT - actualizar usuario
// Admin puede modificar: email, nombres, apellidos, rut, id_rol, estado
// ================================
async function updateUsuario(req, res) {
  try {
    const { id } = req.params;
    const {
      email,
      nombres,
      apellidos,
      rut,
      id_rol,
      estado,
    } = req.body;

    const sql = `
      UPDATE LPMFJCBC_USUARIOS
      SET
        email     = :email,
        nombres   = :nombres,
        apellidos = :apellidos,
        rut       = :rut,
        id_rol    = :id_rol,
        estado    = :estado
      WHERE id_usuario = :id
    `;

    const result = await execQuery(
      sql,
      {
        id: Number(id),
        email,
        nombres,
        apellidos,
        rut,
        id_rol,
        estado,
      },
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({ mensaje: "Usuario actualizado correctamente" });
  } catch (err) {
    console.error("Error updateUsuario:", err);

    if (err.errorNum === 1) {
      return res
        .status(400)
        .json({ error: "Email o RUT ya existe en el sistema" });
    }

    res.status(500).json({ error: "Error al actualizar usuario" });
  }
}

// ================================
// PATCH - desactivar usuario (eliminación lógica)
// Cambia estado a 'INACTIVO'
// ================================
async function desactivarUsuario(req, res) {
  try {
    const { id } = req.params;

    const sql = `
      UPDATE LPMFJCBC_USUARIOS
      SET estado = 'INACTIVO'
      WHERE id_usuario = :id
    `;

    const result = await execQuery(
      sql,
      { id: Number(id) },
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({ mensaje: "Usuario desactivado (eliminación lógica)" });
  } catch (err) {
    console.error("Error desactivarUsuario:", err);
    res.status(500).json({ error: "Error al desactivar usuario" });
  }
}

// ================================
// PATCH - asignar / cambiar rol de un usuario
// Admin indica id_rol en el body
// ================================
async function asignarRolUsuario(req, res) {
  try {
    const { id } = req.params;      // id_usuario
    const { id_rol } = req.body;    // nuevo rol

    if (!id_rol) {
      return res.status(400).json({ error: "Debe indicar id_rol" });
    }

    // 1) Verificar que el rol exista
    const sqlRol = `
      SELECT id_rol, nombre
      FROM LPMFJCBC_ROLES
      WHERE id_rol = :id_rol
    `;
    const resultRol = await execQuery(sqlRol, { id_rol });

    if (resultRol.rows.length === 0) {
      return res.status(400).json({ error: "El rol indicado no existe" });
    }

    // 2) Actualizar el usuario con ese rol
    const sqlUpdate = `
      UPDATE LPMFJCBC_USUARIOS
      SET id_rol = :id_rol
      WHERE id_usuario = :id_usuario
    `;

    const resultUpdate = await execQuery(
      sqlUpdate,
      { id_rol, id_usuario: Number(id) },
      { autoCommit: true }
    );

    if (resultUpdate.rowsAffected === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const rolNombre = resultRol.rows[0].NOMBRE;

    res.json({
      mensaje: "Rol asignado correctamente",
      id_usuario: Number(id),
      id_rol,
      rol: rolNombre,
    });
  } catch (err) {
    console.error("Error asignarRolUsuario:", err);
    res.status(500).json({ error: "Error al asignar rol" });
  }
}

module.exports = {
  getUsuarios,
  getUsuarioById,
  createUsuario,
  updateUsuario,
  desactivarUsuario,
  asignarRolUsuario,
};
