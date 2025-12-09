// src/controllers/salidas_stock_controller.js
const { execQuery } = require("../db");
const { evaluarStockYGenerarAlerta } = require("./alertas_stock_controller");

// =======================================
// GET - listar salidas de stock
// =======================================
async function getSalidasStock(req, res) {
  try {
    const sql = `
      SELECT
        id_salida,
        id_venta,
        id_producto,
        id_sucursal,
        cantidad,
        fecha_salida
      FROM LPMFJCBC_SALIDAS_STOCK
      ORDER BY id_salida DESC
    `;

    const result = await execQuery(sql);
    res.json(result.rows);
  } catch (err) {
    console.error("Error getSalidasStock:", err);
    res.status(500).json({ error: "Error al obtener salidas de stock" });
  }
}

// =======================================
// GET - salida por ID
// =======================================
async function getSalidaStockById(req, res) {
  try {
    const { id } = req.params;

    const sql = `
      SELECT
        id_salida,
        id_venta,
        id_producto,
        id_sucursal,
        cantidad,
        fecha_salida
      FROM LPMFJCBC_SALIDAS_STOCK
      WHERE id_salida = :id
    `;

    const result = await execQuery(sql, { id: Number(id) });

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Salida de stock no encontrada" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error getSalidaStockById:", err);
    res.status(500).json({ error: "Error al obtener salida de stock" });
  }
}

// FIFO para sugerir lotes (informativo)
async function calcularLotesFIFO(id_producto, id_sucursal, cantidadNecesaria) {
  const sql = `
    SELECT
      id_entrada,
      numero_lote,
      fecha_vencimiento,
      fecha_entrada,
      cantidad
    FROM LPMFJCBC_ENTRADAS_STOCK
    WHERE id_producto = :id_producto
      AND id_sucursal = :id_sucursal
    ORDER BY
      fecha_vencimiento NULLS LAST,
      fecha_entrada
  `;

  const result = await execQuery(sql, {
    id_producto,
    id_sucursal,
  });

  const lotes = result.rows;
  const sugerencias = [];
  let restante = cantidadNecesaria;

  for (const lote of lotes) {
    if (restante <= 0) break;

    const disponibleLote = lote.CANTIDAD;
    if (disponibleLote <= 0) continue;

    const tomar = Math.min(disponibleLote, restante);

    sugerencias.push({
      id_entrada: lote.ID_ENTRADA,
      numero_lote: lote.NUMERO_LOTE,
      fecha_vencimiento: lote.FECHA_VENCIMIENTO,
      fecha_entrada: lote.FECHA_ENTRADA,
      cantidad_tomar: tomar,
    });

    restante -= tomar;
  }

  return sugerencias;
}

/**
 * FUNCIÓN AUTOMÁTICA USADA POR VENTAS (RF-14 + RF-12)
 * Registrar salidas de stock por venta
 */
async function registrarSalidasPorVenta({ id_venta, id_sucursal, items }) {
  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }

  const sucursalNum = Number(id_sucursal);
  const sugerenciasPorProducto = [];

  // 1) Validar stock total por producto
  for (const item of items) {
    const { id_producto, cantidad } = item;

    const sqlStock = `
      SELECT stock_actual
      FROM LPMFJCBC_STOCK_SUCURSAL
      WHERE id_producto = :id_producto
        AND id_sucursal = :id_sucursal
    `;

    const resultStock = await execQuery(sqlStock, {
      id_producto,
      id_sucursal: sucursalNum,
    });

    if (resultStock.rows.length === 0) {
      throw new Error(
        `STOCK_INSUFICIENTE: no existe stock para producto ${id_producto} en sucursal ${sucursalNum}`
      );
    }

    const stockActual = resultStock.rows[0].STOCK_ACTUAL;

    if (stockActual < cantidad) {
      throw new Error(
        `STOCK_INSUFICIENTE: producto ${id_producto} tiene ${stockActual} y se intenta vender ${cantidad}`
      );
    }
  }

  // 2) Registrar salidas + descontar stock + evaluar alerta
  for (const item of items) {
    const { id_producto, cantidad } = item;

    const sqlInsertSalida = `
      INSERT INTO LPMFJCBC_SALIDAS_STOCK (
        id_venta,
        id_producto,
        id_sucursal,
        cantidad
      ) VALUES (
        :id_venta,
        :id_producto,
        :id_sucursal,
        :cantidad
      )
    `;

    await execQuery(
      sqlInsertSalida,
      {
        id_venta,
        id_producto,
        id_sucursal: sucursalNum,
        cantidad,
      },
      { autoCommit: true }
    );

    const sqlUpdateStock = `
      UPDATE LPMFJCBC_STOCK_SUCURSAL
      SET stock_actual = stock_actual - :cantidad
      WHERE id_producto = :id_producto
        AND id_sucursal = :id_sucursal
    `;

    await execQuery(
      sqlUpdateStock,
      {
        cantidad,
        id_producto,
        id_sucursal: sucursalNum,
      },
      { autoCommit: true }
    );

    // RF-12: aquí se aplica la regla stock_actual <= punto_critico
    await evaluarStockYGenerarAlerta(id_producto, id_sucursal);

    const lotesSugeridos = await calcularLotesFIFO(
      id_producto,
      sucursalNum,
      cantidad
    );

    sugerenciasPorProducto.push({
      id_producto,
      cantidad_solicitada: cantidad,
      lotes_sugeridos: lotesSugeridos,
    });
  }

  return sugerenciasPorProducto;
}

module.exports = {
  getSalidasStock,
  getSalidaStockById,
  registrarSalidasPorVenta,
};
