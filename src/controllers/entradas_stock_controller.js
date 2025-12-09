// src/controllers/entradas_stock_controller.js
const { execQuery } = require("../db");
const oracledb = require("oracledb");
const { evaluarStockYGenerarAlerta } = require("./alertas_stock_controller");

// ================================
// GET - Obtener todas las entradas de stock
// ================================
async function getEntradasStock(req, res) {
  try {
    const sql = `
      SELECT
        id_entrada,
        id_producto,
        id_sucursal,
        cantidad,
        numero_lote,
        fecha_vencimiento,
        fecha_entrada,
        id_usuario
      FROM LPMFJCBC_ENTRADAS_STOCK
      ORDER BY id_entrada
    `;

    const result = await execQuery(sql);
    res.json(result.rows);
  } catch (err) {
    console.error("Error getEntradasStock:", err);
    res.status(500).json({ error: "Error al obtener entradas de stock" });
  }
}

// ================================
// GET - Entrada de stock por ID
// ================================
async function getEntradaStockById(req, res) {
  try {
    const { id } = req.params;

    const sql = `
      SELECT
        id_entrada,
        id_producto,
        id_sucursal,
        cantidad,
        numero_lote,
        fecha_vencimiento,
        fecha_entrada,
        id_usuario
      FROM LPMFJCBC_ENTRADAS_STOCK
      WHERE id_entrada = :id
    `;

    const result = await execQuery(sql, { id: Number(id) });

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Entrada de stock no encontrada" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error getEntradaStockById:", err);
    res.status(500).json({ error: "Error al obtener entrada de stock" });
  }
}

// ================================
// POST - Crear entrada de stock  (RF-7)
// ================================
async function createEntradaStock(req, res) {
  try {
    const {
      sku,
      cantidad,
      id_sucursal,
      numero_lote,
      fecha_vencimiento,
    } = req.body;

    const sucursalNum = Number(id_sucursal);

    const id_usuario_token = req.user?.id_usuario;
    const id_usuario_body = req.body.id_usuario;
    const id_usuario = id_usuario_token || id_usuario_body;

    if (!sku || !cantidad || !id_sucursal) {
      return res.status(400).json({
        error: "SKU, cantidad e id_sucursal son obligatorios",
      });
    }

    if (cantidad <= 0) {
      return res
        .status(400)
        .json({ error: "La cantidad debe ser un número positivo" });
    }

    if (!id_usuario) {
      return res
        .status(401)
        .json({ error: "No se pudo determinar el usuario que registra la entrada" });
    }

    // 1) Verificar producto por SKU
    const sqlProducto = `
      SELECT id_producto, estado
      FROM LPMFJCBC_PRODUCTOS
      WHERE sku = :sku
    `;
    const resultProd = await execQuery(sqlProducto, { sku });

    if (resultProd.rows.length === 0) {
      return res
        .status(400)
        .json({ error: "No existe un producto con ese SKU (RF-4)" });
    }

    const producto = resultProd.rows[0];
    if (producto.ESTADO === "INACTIVO") {
      return res
        .status(400)
        .json({ error: "El producto está inactivo y no puede recibir stock" });
    }

    const id_producto = producto.ID_PRODUCTO;

    // 2) Verificar sucursal
    const sqlSucursal = `
      SELECT id_sucursal, estado
      FROM LPMFJCBC_SUCURSALES
      WHERE id_sucursal = :id_sucursal
    `;
    const resultSuc = await execQuery(sqlSucursal, {
      id_sucursal: sucursalNum,
    });

    if (resultSuc.rows.length === 0) {
      return res
        .status(400)
        .json({ error: "La sucursal indicada no existe" });
    }

    const suc = resultSuc.rows[0];
    if (suc.ESTADO === "INACTIVA") {
      return res
        .status(400)
        .json({ error: "La sucursal está inactiva y no puede recibir stock" });
    }

    let fechaV = null;
    if (fecha_vencimiento) {
      fechaV = new Date(fecha_vencimiento);
    }

    // 3) Insertar entrada de stock
    const sqlInsert = `
      INSERT INTO LPMFJCBC_ENTRADAS_STOCK (
        id_producto,
        id_sucursal,
        cantidad,
        numero_lote,
        fecha_vencimiento,
        id_usuario
      ) VALUES (
        :id_producto,
        :id_sucursal,
        :cantidad,
        :numero_lote,
        :fecha_vencimiento,
        :id_usuario
      )
      RETURNING id_entrada INTO :id
    `;

    const binds = {
      id_producto,
      id_sucursal: sucursalNum,
      cantidad,
      numero_lote,
      fecha_vencimiento: fechaV,
      id_usuario,
      id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
    };

    const result = await execQuery(sqlInsert, binds, { autoCommit: true });
    const nuevoIdEntrada = result.outBinds.id[0];

    // 4) Actualizar STOCK_SUCURSAL (sumar)
    const sqlUpdateStock = `
      UPDATE LPMFJCBC_STOCK_SUCURSAL
      SET stock_actual = stock_actual + :cantidad
      WHERE id_producto = :id_producto
        AND id_sucursal = :id_sucursal
    `;

    const resultUpdate = await execQuery(
      sqlUpdateStock,
      {
        cantidad,
        id_producto,
        id_sucursal: sucursalNum,
      },
      { autoCommit: true }
    );

    // Si no existía registro de stock, crearlo
    if (resultUpdate.rowsAffected === 0) {
      const sqlInsertStock = `
        INSERT INTO LPMFJCBC_STOCK_SUCURSAL (
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
        sqlInsertStock,
        {
          id_producto,
          id_sucursal: sucursalNum,
          stock_actual: cantidad,
          punto_critico: 0,
        },
        { autoCommit: true }
      );
    }

    // 5) Leer stock actualizado
    const sqlGetStock = `
      SELECT stock_actual
      FROM LPMFJCBC_STOCK_SUCURSAL
      WHERE id_producto = :id_producto
        AND id_sucursal = :id_sucursal
    `;
    const resultStock = await execQuery(sqlGetStock, {
      id_producto,
      id_sucursal: sucursalNum,
    });

    const stockActual = resultStock.rows[0]?.STOCK_ACTUAL;

    // 6) Evaluar RF-12 (puede generar alerta si stock_actual <= punto_critico)
    await evaluarStockYGenerarAlerta(id_producto, id_sucursal);

    res.status(201).json({
      mensaje: "Entrada de stock creada con éxito",
      id_entrada: nuevoIdEntrada,
      id_producto,
      id_sucursal: sucursalNum,
      stock_actual: stockActual,
    });
  } catch (err) {
    console.error("Error createEntradaStock:", err);
    res.status(500).json({ error: "Error al crear entrada de stock" });
  }
}

// ================================
// PUT - Actualizar entrada de stock
// ================================
async function updateEntradaStock(req, res) {
  try {
    const { id } = req.params;
    const { cantidad, numero_lote, fecha_vencimiento } = req.body;

    const sqlGet = `
      SELECT
        id_entrada,
        id_producto,
        id_sucursal,
        cantidad
      FROM LPMFJCBC_ENTRADAS_STOCK
      WHERE id_entrada = :id
    `;
    const resultGet = await execQuery(sqlGet, { id: Number(id) });

    if (resultGet.rows.length === 0) {
      return res.status(404).json({ error: "Entrada de stock no encontrada" });
    }

    const entradaActual = resultGet.rows[0];
    const id_producto = entradaActual.ID_PRODUCTO;
    const id_sucursal = entradaActual.ID_SUCURSAL;
    const cantidadAnterior = entradaActual.CANTIDAD;

    const nuevaCantidad =
      cantidad != null ? Number(cantidad) : cantidadAnterior;

    if (nuevaCantidad <= 0) {
      return res
        .status(400)
        .json({ error: "La cantidad debe ser un número positivo" });
    }

    const delta = nuevaCantidad - cantidadAnterior;

    let fechaV = null;
    if (fecha_vencimiento) {
      fechaV = new Date(fecha_vencimiento);
    }

    const sqlUpdateEntrada = `
      UPDATE LPMFJCBC_ENTRADAS_STOCK
      SET
        cantidad          = :cantidad,
        numero_lote       = :numero_lote,
        fecha_vencimiento = :fecha_vencimiento
      WHERE id_entrada = :id
    `;

    const result = await execQuery(
      sqlUpdateEntrada,
      {
        id: Number(id),
        cantidad: nuevaCantidad,
        numero_lote,
        fecha_vencimiento: fechaV,
      },
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: "Entrada de stock no encontrada" });
    }

    // Ajustar stock según el delta
    if (delta !== 0) {
      const sqlUpdateStock = `
        UPDATE LPMFJCBC_STOCK_SUCURSAL
        SET stock_actual = stock_actual + :delta
        WHERE id_producto = :id_producto
          AND id_sucursal = :id_sucursal
      `;

      await execQuery(
        sqlUpdateStock,
        {
          delta,
          id_producto,
          id_sucursal,
        },
        { autoCommit: true }
      );

      // Evaluar alerta después de ajustar stock
      await evaluarStockYGenerarAlerta(id_producto, id_sucursal);
    }

    res.json({ mensaje: "Entrada de stock actualizada correctamente" });
  } catch (err) {
    console.error("Error updateEntradaStock:", err);
    res.status(500).json({ error: "Error al actualizar entrada de stock" });
  }
}

// ================================
// DELETE - Eliminar entrada de stock
// ================================
async function deleteEntradaStock(req, res) {
  try {
    const { id } = req.params;

    const sqlGet = `
      SELECT
        id_entrada,
        id_producto,
        id_sucursal,
        cantidad
      FROM LPMFJCBC_ENTRADAS_STOCK
      WHERE id_entrada = :id
    `;
    const resultGet = await execQuery(sqlGet, { id: Number(id) });

    if (resultGet.rows.length === 0) {
      return res.status(404).json({ error: "Entrada de stock no encontrada" });
    }

    const entrada = resultGet.rows[0];
    const id_producto = entrada.ID_PRODUCTO;
    const id_sucursal = entrada.ID_SUCURSAL;
    const cantidad = entrada.CANTIDAD;

    const sqlDelete = `
      DELETE FROM LPMFJCBC_ENTRADAS_STOCK
      WHERE id_entrada = :id
    `;

    const result = await execQuery(
      sqlDelete,
      { id: Number(id) },
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: "Entrada de stock no encontrada" });
    }

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
        id_sucursal,
      },
      { autoCommit: true }
    );

    // Evaluar alerta después de restar stock
    await evaluarStockYGenerarAlerta(id_producto, id_sucursal);

    res.json({ mensaje: "Entrada de stock eliminada correctamente" });
  } catch (err) {
    console.error("Error deleteEntradaStock:", err);
    res.status(500).json({ error: "Error al eliminar entrada de stock" });
  }
}

module.exports = {
  getEntradasStock,
  getEntradaStockById,
  createEntradaStock,
  updateEntradaStock,
  deleteEntradaStock,
};
