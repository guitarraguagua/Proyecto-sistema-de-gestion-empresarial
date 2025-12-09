// src/controllers/roles.controller.js
const { execQuery } = require("../db");
const oracledb = require("oracledb");

// GET /api/roles
async function getRoles(req, res) {
  try {
    const sql = `
      SELECT id_rol, nombre, descripcion
      FROM LPMFJCBC_ROLES
      ORDER BY id_rol
    `;
    const result = await execQuery(sql);
    res.json(result.rows);
  } catch (err) {
    console.error("Error getRoles:", err);
    res.status(500).json({ error: "Error al obtener roles" });
  }
}

// GET /api/roles/:id
async function getRolById(req, res) {
  try {
    const { id } = req.params;
    const sql = `
      SELECT id_rol, nombre, descripcion
      FROM LPMFJCBC_ROLES
      WHERE id_rol = :id
    `;
    const result = await execQuery(sql, { id: Number(id) });
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Rol no encontrado" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error getRolById:", err);
    res.status(500).json({ error: "Error al obtener rol" });
  }
}

// POST /api/roles
async function createRol(req, res) {
  try {
    const { nombre, descripcion } = req.body;
    const sql = `
      INSERT INTO LPMFJCBC_ROLES (nombre, descripcion)
      VALUES (:nombre, :descripcion)
      RETURNING id_rol INTO :id
    `;
    const binds = {
      nombre,
      descripcion,
      id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
    };

    const result = await execQuery(sql, binds, { autoCommit: true });
    const newId = result.outBinds.id[0];

    res.status(201).json({ mensaje: "Rol creado", id_rol: newId });
  } catch (err) {
    console.error("Error createRol:", err);
    res.status(500).json({ error: "Error al crear rol" });
  }
}

// PUT /api/roles/:id
async function updateRol(req, res) {
  try {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;

    const sql = `
      UPDATE LPMFJCBC_ROLES
      SET nombre = :nombre,
          descripcion = :descripcion
      WHERE id_rol = :id
    `;
    const result = await execQuery(
      sql,
      { id: Number(id), nombre, descripcion },
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: "Rol no encontrado" });
    }

    res.json({ mensaje: "Rol actualizado" });
  } catch (err) {
    console.error("Error updateRol:", err);
    res.status(500).json({ error: "Error al actualizar rol" });
  }
}

// DELETE /api/roles/:id
async function deleteRol(req, res) {
  try {
    const { id } = req.params;
    const sql = "DELETE FROM LPMFJCBC_ROLES WHERE id_rol = :id";
    const result = await execQuery(
      sql,
      { id: Number(id) },
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: "Rol no encontrado" });
    }

    res.json({ mensaje: "Rol eliminado" });
  } catch (err) {
    console.error("Error deleteRol:", err);
    res.status(500).json({ error: "Error al eliminar rol" });
  }
}

module.exports = {
  getRoles,
  getRolById,
  createRol,
  updateRol,
  deleteRol,
};
