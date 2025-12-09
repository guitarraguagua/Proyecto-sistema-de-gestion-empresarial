// src/controllers/mermas_controller.js
const { execQuery } = require("../db");
const oracledb = require("oracledb");
const { evaluarStockYGenerarAlerta } = require("./alertas_stock_controller");

// ================================
// GET - listar todas las mermas
// ================================
async function getMermas(req, res) {
  try {
    const sql = `
      SELECT
        id_merma,
        id_producto,
        id_sucursal,
        cantidad,
        motivo,
        observacion,
        fecha_merma,
        id_usuario
      FROM LPMFJCBC_MERMAS
      ORDER BY fecha_merma DESC
    `;

    const r = await execQuery(sql);
    res.json(r.rows);
  } catch (err) {
    console.error("Error getMermas:", err);
    res.status(500).json({ error: "Error al obtener mermas" });
  }
}

// ================================
// GET - merma por ID
// ================================
async function getMermaById(req, res) {
  try {
    const { id } = req.params;

    const sql = `
      SELECT
        id_merma,
        id_producto,
        id_sucursal,
        cantidad,
        motivo,
        observacion,
        fecha_merma,
        id_usuario
      FROM LPMFJCBC_MERMAS
      WHERE id_merma = :id
    `;

    const r = await execQuery(sql, { id: Number(id) });

    if (r.rows.length === 0) {
      return res.status(404).json({ error: "Merma no encontrada" });
    }

    res.json(r.rows[0]);
  } catch (err) {
    console.error("Error getMermaById:", err);
    res.status(500).json({ error: "Error al obtener merma" });
  }
}

// ================================
// POST - Registrar Merma (RF)
// ================================
async function createMerma(req, res) {
  try {
    let {
      id_producto,
      id_sucursal,
      cantidad,
      motivo,       // 'VENCIDO', 'DANIADO', 'ROBO', 'OTRO'
      observacion,
    } = req.body;

    // Usuario que registra la merma (desde el token)
    const id_usuario = req.user?.id_usuario;

    if (!id_usuario) {
      return res.status(401).json({ error: "No autenticado" });
    }

    // Normalizar tipos
    id_producto = Number(id_producto);
    id_sucursal = Number(id_sucursal);
    cantidad    = Number(cantidad);
    motivo      = (motivo || "").toUpperCase().trim();

    // 1) Validar campos
    if (!id_producto || !id_sucursal || !cantidad || !motivo) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    if (cantidad <= 0) {
      return res.status(400).json({ error: "La cantidad debe ser mayor a 0" });
    }

    const motivosValidos = ["VENCIDO", "DANIADO", "ROBO", "OTRO"];
    if (!motivosValidos.includes(motivo)) {
      return res.status(400).json({ error: "Motivo no válido" });
    }

    // 2) Verificar stock disponible
    const sqlStock = `
      SELECT stock_actual
      FROM LPMFJCBC_STOCK_SUCURSAL
      WHERE id_producto = :id_producto
        AND id_sucursal = :id_sucursal
    `;
    const rStock = await execQuery(sqlStock, { id_producto, id_sucursal });

    if (rStock.rows.length === 0) {
      return res.status(400).json({
        error: "No existe stock para ese producto en esa sucursal",
      });
    }

    const stockActual = rStock.rows[0].STOCK_ACTUAL;

    if (cantidad > stockActual) {
      return res.status(400).json({
        error: `No se puede registrar una merma mayor al stock disponible (${stockActual})`,
      });
    }

    // 3) Insertar merma
    const sqlMerma = `
      INSERT INTO LPMFJCBC_MERMAS (
        id_producto,
        id_sucursal,
        cantidad,
        motivo,
        observacion,
        id_usuario
      ) VALUES (
        :id_producto,
        :id_sucursal,
        :cantidad,
        :motivo,
        :observacion,
        :id_usuario
      )
      RETURNING id_merma INTO :id_merma
    `;

    const rMerma = await execQuery(
      sqlMerma,
      {
        id_producto,
        id_sucursal,
        cantidad,
        motivo,
        observacion,
        id_usuario,
        id_merma: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      },
      { autoCommit: true }
    );

    const id_merma = rMerma.outBinds.id_merma[0];

    // 4) Descontar stock
    const sqlUpdateStock = `
      UPDATE LPMFJCBC_STOCK_SUCURSAL
      SET stock_actual = stock_actual - :cantidad
      WHERE id_producto = :id_producto
        AND id_sucursal = :id_sucursal
    `;
    await execQuery(
      sqlUpdateStock,
      { cantidad, id_producto, id_sucursal },
      { autoCommit: true }
    );

    // 5) Evaluar alerta automática RF-12
    await evaluarStockYGenerarAlerta(id_producto, id_sucursal);

    res.status(201).json({
      mensaje: "Merma registrada con éxito",
      id_merma,
    });
  } catch (err) {
    console.error("Error createMerma:", err);
    return res.status(500).json({
      error: "Errorr al registrar merma",
      detalle: err.message || String(err),
      codigoOracle: err.errorNum || null
    });
  }
}

module.exports = {
  getMermas,
  getMermaById,
  createMerma,
};
