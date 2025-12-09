// src/controllers/sucursales_controller.js
const { execQuery } = require("../db");
const oracledb = require("oracledb");

// Helper: verificar si una sucursal tiene stock > 0
async function sucursalTieneStock(id_sucursal) {
  const sql = `
    SELECT
      NVL(SUM(stock_actual), 0) AS total_stock
    FROM LPMFJCBC_STOCK_SUCURSAL
    WHERE id_sucursal = :id_sucursal
  `;
  const result = await execQuery(sql, { id_sucursal: Number(id_sucursal) });
  if (result.rows.length === 0) return false;

  const total = result.rows[0].TOTAL_STOCK;
  return total > 0;
}

// ================================
// GET - listar todas las sucursales
// ================================
async function getSucursales(req, res) {
  try {
    const sql = `
      SELECT
        id_sucursal,
        nombre,
        direccion,
        telefono,
        nombre_encargado,
        estado
      FROM LPMFJCBC_SUCURSALES
      ORDER BY id_sucursal
    `;

    const result = await execQuery(sql);
    res.json(result.rows);
  } catch (err) {
    console.error("Error getSucursales:", err);
    res.status(500).json({ error: "Error al obtener sucursales" });
  }
}

// ================================
// GET - sucursal por ID
// ================================
async function getSucursalById(req, res) {
  try {
    const { id } = req.params;

    const sql = `
      SELECT
        id_sucursal,
        nombre,
        direccion,
        telefono,
        nombre_encargado,
        estado
      FROM LPMFJCBC_SUCURSALES
      WHERE id_sucursal = :id
    `;

    const result = await execQuery(sql, { id: Number(id) });

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Sucursal no encontrada" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error getSucursalById:", err);
    res.status(500).json({ error: "Error al obtener sucursal" });
  }
}

// ================================
// POST - crear sucursal
// Usuario: ADMINISTRADOR
// Restricción: nombre único
// ================================
async function createSucursal(req, res) {
  try {
    const { nombre, direccion, telefono, nombre_encargado, estado } = req.body;

    // Validaciones básicas
    if (!nombre || !direccion || !estado) {
      return res.status(400).json({
        error: "Nombre, dirección y estado son obligatorios",
      });
    }

    const sql = `
      INSERT INTO LPMFJCBC_SUCURSALES (
        nombre,
        direccion,
        telefono,
        nombre_encargado,
        estado
      ) VALUES (
        :nombre,
        :direccion,
        :telefono,
        :nombre_encargado,
        :estado
      )
      RETURNING id_sucursal INTO :id_sucursal
    `;

    const binds = {
      nombre,
      direccion,
      telefono,
      nombre_encargado,
      estado, // 'ACTIVA' o 'INACTIVA'
      id_sucursal: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
    };

    const result = await execQuery(sql, binds, { autoCommit: true });

    res.status(201).json({
      mensaje: "Sucursal creada con éxito",
      id_sucursal: result.outBinds.id_sucursal[0],
    });
  } catch (err) {
    console.error("Error createSucursal:", err);

    // ORA-00001: violación de UNIQUE (nombre)
    if (err.errorNum === 1) {
      return res
        .status(400)
        .json({ error: "Ya existe una sucursal con ese nombre" });
    }

    res.status(500).json({ error: "Error al crear sucursal" });
  }
}

// ================================
// PUT - actualizar sucursal
// Admin puede modificar: nombre, dirección, teléfono, encargado, estado
// Restricción: nombre único
// ================================
async function updateSucursal(req, res) {
  try {
    const { id } = req.params;
    const { nombre, direccion, telefono, nombre_encargado, estado } = req.body;

    if (!nombre || !direccion || !estado) {
      return res.status(400).json({
        error: "Nombre, dirección y estado son obligatorios",
      });
    }

    const sql = `
      UPDATE LPMFJCBC_SUCURSALES
      SET
        nombre           = :nombre,
        direccion        = :direccion,
        telefono         = :telefono,
        nombre_encargado = :nombre_encargado,
        estado           = :estado
      WHERE id_sucursal = :id
    `;

    const result = await execQuery(
      sql,
      {
        id: Number(id),
        nombre,
        direccion,
        telefono,
        nombre_encargado,
        estado,
      },
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: "Sucursal no encontrada" });
    }

    res.json({ mensaje: "Sucursal actualizada correctamente" });
  } catch (err) {
    console.error("Error updateSucursal:", err);

    if (err.errorNum === 1) {
      return res
        .status(400)
        .json({ error: "Ya existe una sucursal con ese nombre" });
    }

    res.status(500).json({ error: "Error al actualizar sucursal" });
  }
}

// ================================
// PATCH - desactivar sucursal (eliminación lógica)
// Restricción: NO se puede desactivar si tiene stock > 0
// ================================
async function desactivarSucursal(req, res) {
  try {
    const { id } = req.params;

    // Verificar si tiene stock > 0
    const tieneStock = await sucursalTieneStock(id);
    if (tieneStock) {
      return res.status(400).json({
        error:
          "No se puede desactivar la sucursal porque tiene stock asociado mayor a 0",
      });
    }

    const sql = `
      UPDATE LPMFJCBC_SUCURSALES
      SET estado = 'INACTIVA'
      WHERE id_sucursal = :id
    `;

    const result = await execQuery(
      sql,
      { id: Number(id) },
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: "Sucursal no encontrada" });
    }

    res.json({ mensaje: "Sucursal desactivada correctamente" });
  } catch (err) {
    console.error("Error desactivarSucursal:", err);
    res.status(500).json({ error: "Error al desactivar sucursal" });
  }
}

// (Opcional) DELETE físico, pero respetando la misma restricción
// Si no quieres eliminación física, puedes NO usar esta función ni su ruta.
async function deleteSucursal(req, res) {
  try {
    const { id } = req.params;

    // Verificar si tiene stock > 0
    const tieneStock = await sucursalTieneStock(id);
    if (tieneStock) {
      return res.status(400).json({
        error:
          "No se puede eliminar la sucursal porque tiene stock asociado mayor a 0",
      });
    }

    const sql = `
      DELETE FROM LPMFJCBC_SUCURSALES
      WHERE id_sucursal = :id
    `;

    const result = await execQuery(
      sql,
      { id: Number(id) },
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: "Sucursal no encontrada" });
    }

    res.json({ mensaje: "Sucursal eliminada correctamente" });
  } catch (err) {
    console.error("Error deleteSucursal:", err);
    res.status(500).json({ error: "Error al eliminar sucursal" });
  }
}

module.exports = {
  getSucursales,
  getSucursalById,
  createSucursal,
  updateSucursal,
  desactivarSucursal,
  deleteSucursal, // opcional usarlo
};
