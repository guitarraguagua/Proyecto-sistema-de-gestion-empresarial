// src/controllers/parametros_controller.js
const { execQuery } = require("../db");
const oracledb = require("oracledb");

// ================================
// GET - Obtener todos los parámetros
// ================================
async function getParametros(req, res) {
  try {
    const sql = `
      SELECT
        id_parametro,
        nombre,
        valor_numerico,
        valor_texto,
        activo
      FROM LPMFJCBC_PARAMETROS_SISTEMA
      ORDER BY id_parametro
    `;

    const result = await execQuery(sql);
    res.json(result.rows);
  } catch (err) {
    console.error("Error getParametros:", err);
    res.status(500).json({ error: "Error al obtener parámetros" });
  }
}

// ================================
// GET - Parámetro por ID
// ================================
async function getParametroById(req, res) {
  try {
    const { id } = req.params;

    const sql = `
      SELECT
        id_parametro,
        nombre,
        valor_numerico,
        valor_texto,
        activo
      FROM LPMFJCBC_PARAMETROS_SISTEMA
      WHERE id_parametro = :id
    `;

    const result = await execQuery(sql, { id: Number(id) });

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Parámetro no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error getParametroById:", err);
    res.status(500).json({ error: "Error al obtener parámetro" });
  }
}

// ================================
// POST - Crear parámetro
// ================================
async function createParametro(req, res) {
  try {
    const {
      nombre,
      valor_numerico,
      valor_texto,
      activo,
    } = req.body;

    const sql = `
      INSERT INTO LPMFJCBC_PARAMETROS_SISTEMA (
        nombre, valor_numerico, valor_texto, activo
      ) VALUES (
        :nombre, :valor_numerico, :valor_texto, :activo
      )
      RETURNING id_parametro INTO :id
    `;

    const binds = {
      nombre,
      valor_numerico,
      valor_texto,
      activo,
      id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
    };

    const result = await execQuery(sql, binds, { autoCommit: true });

    res.status(201).json({
      mensaje: "Parámetro creado con éxito",
      id_parametro: result.outBinds.id[0],
    });
  } catch (err) {
    console.error("Error createParametro:", err);

    // ORA-00001: violación de UNIQUE (duplicado de nombre + activo)
    if (err.errorNum === 1) {
      return res.status(400).json({
        error: "Ya existe un parámetro con ese nombre y estado",
      });
    }

    res.status(500).json({ error: "Error al crear parámetro" });
  }
}

// ================================
// PUT - Actualizar parámetro
// ================================
async function updateParametro(req, res) {
  try {
    const { id } = req.params;
    const {
      nombre,
      valor_numerico,
      valor_texto,
      activo,
    } = req.body;

    const sql = `
      UPDATE LPMFJCBC_PARAMETROS_SISTEMA
      SET
        nombre           = :nombre,
        valor_numerico   = :valor_numerico,
        valor_texto      = :valor_texto,
        activo           = :activo
      WHERE id_parametro = :id
    `;

    const result = await execQuery(
      sql,
      {
        id: Number(id),
        nombre,
        valor_numerico,
        valor_texto,
        activo,
      },
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: "Parámetro no encontrado" });
    }

    res.json({ mensaje: "Parámetro actualizado correctamente" });
  } catch (err) {
    console.error("Error updateParametro:", err);
    res.status(500).json({ error: "Error al actualizar parámetro" });
  }
}

// ================================
// DELETE - Eliminar parámetro
// ================================
async function deleteParametro(req, res) {
  try {
    const { id } = req.params;

    const sql = `
      DELETE FROM LPMFJCBC_PARAMETROS_SISTEMA
      WHERE id_parametro = :id
    `;

    const result = await execQuery(sql, { id: Number(id) }, { autoCommit: true });

    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: "Parámetro no encontrado" });
    }

    res.json({ mensaje: "Parámetro eliminado correctamente" });
  } catch (err) {
    console.error("Error deleteParametro:", err);
    res.status(500).json({ error: "Error al eliminar parámetro" });
  }
}

module.exports = {
  getParametros,
  getParametroById,
  createParametro,
  updateParametro,
  deleteParametro,
};
