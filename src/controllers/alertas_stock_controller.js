// src/controllers/alertas_stock_controller.js
const { execQuery } = require("../db");
const oracledb = require("oracledb");

// ================================
// GET - Obtener todas las alertas de stock
// ================================
async function getAlertasStock(req, res) {
  try {
    const sql = `
      SELECT
        id_alerta,
        id_producto,
        id_sucursal,
        stock_actual,
        punto_critico,
        fecha_alerta,
        atendida
      FROM LPMFJCBC_ALERTAS_STOCK
      ORDER BY fecha_alerta DESC
    `;

    const result = await execQuery(sql);
    res.json(result.rows);
  } catch (err) {
    console.error("Error getAlertasStock:", err);
    res.status(500).json({ error: "Error al obtener alertas de stock" });
  }
}

// ================================
// GET - Alerta de stock por ID
// ================================
async function getAlertaStockById(req, res) {
  try {
    const { id } = req.params;

    const sql = `
      SELECT
        id_alerta,
        id_producto,
        id_sucursal,
        stock_actual,
        punto_critico,
        fecha_alerta,
        atendida
      FROM LPMFJCBC_ALERTAS_STOCK
      WHERE id_alerta = :id
    `;

    const result = await execQuery(sql, { id: Number(id) });

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Alerta de stock no encontrada" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error getAlertaStockById:", err);
    res.status(500).json({ error: "Error al obtener alerta de stock" });
  }
}

// ================================
// POST - Crear alerta de stock (uso manual / pruebas)
// ================================
async function createAlertaStock(req, res) {
  try {
    const { id_producto, id_sucursal, stock_actual, punto_critico } = req.body;

    const sql = `
      INSERT INTO LPMFJCBC_ALERTAS_STOCK (
        id_producto,
        id_sucursal,
        stock_actual,
        punto_critico
      ) VALUES (
        :id_producto,
        :id_sucursal,
        :stock_actual,
        :punto_critico
      )
      RETURNING id_alerta INTO :id
    `;

    const binds = {
      id_producto,
      id_sucursal,
      stock_actual,
      punto_critico,
      id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
    };

    const result = await execQuery(sql, binds, { autoCommit: true });

    res.status(201).json({
      mensaje: "Alerta de stock creada con éxito",
      id_alerta: result.outBinds.id[0],
    });
  } catch (err) {
    console.error("Error createAlertaStock:", err);
    res.status(500).json({ error: "Error al crear alerta de stock" });
  }
}

// ================================
// PUT - Actualizar alerta de stock (marcar atendida, etc.)
// ================================
async function updateAlertaStock(req, res) {
  try {
    const { id } = req.params;
    const { stock_actual, punto_critico, atendida } = req.body;

    const sql = `
      UPDATE LPMFJCBC_ALERTAS_STOCK
      SET
        stock_actual  = :stock_actual,
        punto_critico = :punto_critico,
        atendida      = :atendida
      WHERE id_alerta = :id
    `;

    const result = await execQuery(
      sql,
      { id: Number(id), stock_actual, punto_critico, atendida },
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: "Alerta de stock no encontrada" });
    }

    res.json({ mensaje: "Alerta de stock actualizada correctamente" });
  } catch (err) {
    console.error("Error updateAlertaStock:", err);
    res.status(500).json({ error: "Error al actualizar alerta de stock" });
  }
}

// ================================
// DELETE - Eliminar alerta de stock
// ================================
async function deleteAlertaStock(req, res) {
  try {
    const { id } = req.params;

    const sql = `
      DELETE FROM LPMFJCBC_ALERTAS_STOCK
      WHERE id_alerta = :id
    `;

    const result = await execQuery(
      sql,
      { id: Number(id) },
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: "Alerta de stock no encontrada" });
    }

    res.json({ mensaje: "Alerta de stock eliminada correctamente" });
  } catch (err) {
    console.error("Error deleteAlertaStock:", err);
    res.status(500).json({ error: "Error al eliminar alerta de stock" });
  }
}

// ================================
// RF-12: Generar alerta automática de stock bajo
// Se llama desde ENTRADAS, SALIDAS, MERMAS, etc.
// Regla: si stock_actual <= punto_critico → inserta alerta
// ================================
async function evaluarStockYGenerarAlerta(id_producto, id_sucursal) {
  // 1) Leer stock_actual y punto_critico
  const sqlStock = `
    SELECT stock_actual, punto_critico
    FROM LPMFJCBC_STOCK_SUCURSAL
    WHERE id_producto = :id_producto
      AND id_sucursal = :id_sucursal
  `;

  const rStock = await execQuery(sqlStock, {
    id_producto,
    id_sucursal,
  });

  if (rStock.rows.length === 0) return;

  const { STOCK_ACTUAL, PUNTO_CRITICO } = rStock.rows[0];

  // Si no hay punto crítico definido, no se genera alerta
  if (PUNTO_CRITICO === null || PUNTO_CRITICO === undefined) return;

  // RF: genera alerta cuando stock_actual <= punto_critico
  if (STOCK_ACTUAL > PUNTO_CRITICO) {
    return; // todavía sobre el punto crítico, no crea alerta
  }

  // 2) Evitar duplicar alertas no atendidas para el mismo producto/sucursal
  const sqlExiste = `
    SELECT id_alerta
    FROM LPMFJCBC_ALERTAS_STOCK
    WHERE id_producto = :id_producto
      AND id_sucursal = :id_sucursal
      AND atendida = 0
  `;
  const rExiste = await execQuery(sqlExiste, { id_producto, id_sucursal });

  if (rExiste.rows.length > 0) {
    // Ya hay una alerta pendiente; no creamos otra
    return;
  }

  // 3) Insertar alerta nueva
  const sqlInsert = `
    INSERT INTO LPMFJCBC_ALERTAS_STOCK (
      id_producto,
      id_sucursal,
      stock_actual,
      punto_critico
    ) VALUES (
      :id_producto,
      :id_sucursal,
      :stock_actual,
      :punto_critico
    )
  `;

  await execQuery(
    sqlInsert,
    {
      id_producto,
      id_sucursal,
      stock_actual: STOCK_ACTUAL,
      punto_critico: PUNTO_CRITICO,
    },
    { autoCommit: true }
  );
}

module.exports = {
  getAlertasStock,
  getAlertaStockById,
  createAlertaStock,
  updateAlertaStock,
  deleteAlertaStock,
  evaluarStockYGenerarAlerta,
};
