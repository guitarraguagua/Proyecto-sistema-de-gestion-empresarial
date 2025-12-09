// src/controllers/detalle_ventas_controller.js
const { execQuery } = require("../db");
const oracledb = require("oracledb");

// ================================
// GET - Obtener todos los detalles de ventas
// ================================
async function getDetallesVentas(req, res) {
  try {
    const sql = `
      SELECT
        id_detalle,
        id_venta,
        id_producto,
        cantidad,
        precio_unitario,
        subtotal_linea
      FROM LPMFJCBC_DETALLE_VENTAS
      ORDER BY id_detalle
    `;

    const result = await execQuery(sql);
    res.json(result.rows);
  } catch (err) {
    console.error("Error getDetallesVentas:", err);
    res.status(500).json({ error: "Error al obtener detalles de ventas" });
  }
}

// ================================
// GET - Detalle de venta por ID
// ================================
async function getDetalleVentaById(req, res) {
  try {
    const { id } = req.params;

    const sql = `
      SELECT
        id_detalle,
        id_venta,
        id_producto,
        cantidad,
        precio_unitario,
        subtotal_linea
      FROM LPMFJCBC_DETALLE_VENTAS
      WHERE id_detalle = :id
    `;

    const result = await execQuery(sql, { id: Number(id) });

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Detalle de venta no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error getDetalleVentaById:", err);
    res.status(500).json({ error: "Error al obtener detalle de venta" });
  }
}

// ================================
// POST - Crear detalle de venta
// ================================
async function createDetalleVenta(req, res) {
  try {
    const {
      id_venta,
      id_producto,
      cantidad,
      precio_unitario,
      subtotal_linea,
    } = req.body;

    const sql = `
      INSERT INTO LPMFJCBC_DETALLE_VENTAS (
        id_venta,
        id_producto,
        cantidad,
        precio_unitario,
        subtotal_linea
      ) VALUES (
        :id_venta,
        :id_producto,
        :cantidad,
        :precio_unitario,
        :subtotal_linea
      )
      RETURNING id_detalle INTO :id
    `;

    const binds = {
      id_venta,
      id_producto,
      cantidad,
      precio_unitario,
      subtotal_linea,
      id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
    };

    const result = await execQuery(sql, binds, { autoCommit: true });

    res.status(201).json({
      mensaje: "Detalle de venta creado con éxito",
      id_detalle: result.outBinds.id[0],
    });
  } catch (err) {
    console.error("Error createDetalleVenta:", err);

    // ORA-00001: violación de UNIQUE (duplicado)
    if (err.errorNum === 1) {
      return res.status(400).json({
        error: "Ya existe un detalle de venta con esos datos",
      });
    }

    res.status(500).json({ error: "Error al crear detalle de venta" });
  }
}

// ================================
// PUT - Actualizar detalle de venta
// ================================
async function updateDetalleVenta(req, res) {
  try {
    const { id } = req.params;
    const {
      id_venta,
      id_producto,
      cantidad,
      precio_unitario,
      subtotal_linea,
    } = req.body;

    const sql = `
      UPDATE LPMFJCBC_DETALLE_VENTAS
      SET
        id_venta        = :id_venta,
        id_producto     = :id_producto,
        cantidad        = :cantidad,
        precio_unitario = :precio_unitario,
        subtotal_linea  = :subtotal_linea
      WHERE id_detalle = :id
    `;

    const result = await execQuery(
      sql,
      {
        id: Number(id),
        id_venta,
        id_producto,
        cantidad,
        precio_unitario,
        subtotal_linea,
      },
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: "Detalle de venta no encontrado" });
    }

    res.json({ mensaje: "Detalle de venta actualizado correctamente" });
  } catch (err) {
    console.error("Error updateDetalleVenta:", err);
    res.status(500).json({ error: "Error al actualizar detalle de venta" });
  }
}

// ================================
// DELETE - Eliminar detalle de venta
// ================================
async function deleteDetalleVenta(req, res) {
  try {
    const { id } = req.params;

    const sql = `
      DELETE FROM LPMFJCBC_DETALLE_VENTAS
      WHERE id_detalle = :id
    `;

    const result = await execQuery(sql, { id: Number(id) }, { autoCommit: true });

    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: "Detalle de venta no encontrado" });
    }

    res.json({ mensaje: "Detalle de venta eliminado correctamente" });
  } catch (err) {
    console.error("Error deleteDetalleVenta:", err);
    res.status(500).json({ error: "Error al eliminar detalle de venta" });
  }
}

module.exports = {
  getDetallesVentas,
  getDetalleVentaById,
  createDetalleVenta,
  updateDetalleVenta,
  deleteDetalleVenta,
};
