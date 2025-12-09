// src/controllers/productos_controller.js
const { execQuery } = require("../db");
const oracledb = require("oracledb");

// =======================================
// GET - Obtener todos los productos
// =======================================
async function getProductos(req, res) {
  try {
    const sql = `
      SELECT
        id_producto,
        sku,
        nombre,
        descripcion,
        precio_unitario,
        categoria,
        unidad_medida,
        estado
      FROM LPMFJCBC_PRODUCTOS
      ORDER BY id_producto
    `;

    const result = await execQuery(sql);
    res.json(result.rows);
  } catch (err) {
    console.error("Error getProductos:", err);
    res.status(500).json({ error: "Error al obtener productos" });
  }
}

// =======================================
// GET - Obtener producto por ID
// =======================================
async function getProductoById(req, res) {
  try {
    const { id } = req.params;

    const sql = `
      SELECT
        id_producto,
        sku,
        nombre,
        descripcion,
        precio_unitario,
        categoria,
        unidad_medida,
        estado
      FROM LPMFJCBC_PRODUCTOS
      WHERE id_producto = :id
    `;

    const result = await execQuery(sql, { id: Number(id) });

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error getProductoById:", err);
    res.status(500).json({ error: "Error al obtener producto" });
  }
}

// =======================================
// POST - Crear producto
// Restricción: SKU único y stock inicial = 0 por sucursal
// =======================================
async function createProducto(req, res) {
  try {
    const {
      sku,
      nombre,
      descripcion,
      precio_unitario,
      categoria,
      unidad_medida,
      estado, // 'ACTIVO' o 'INACTIVO'
    } = req.body;

    // Validaciones mínimas
    if (!sku || !nombre || precio_unitario == null || !estado) {
      return res
        .status(400)
        .json({
          error: "SKU, nombre, precio_unitario y estado son obligatorios",
        });
    }

    // 1) Insertar producto
    const sqlProducto = `
      INSERT INTO LPMFJCBC_PRODUCTOS (
        sku,
        nombre,
        descripcion,
        precio_unitario,
        categoria,
        unidad_medida,
        estado
      ) VALUES (
        :sku,
        :nombre,
        :descripcion,
        :precio_unitario,
        :categoria,
        :unidad_medida,
        :estado
      )
      RETURNING id_producto INTO :id
    `;

    const bindsProducto = {
      sku,
      nombre,
      descripcion,
      precio_unitario,
      categoria,
      unidad_medida,
      estado,
      id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
    };

    const resultProd = await execQuery(sqlProducto, bindsProducto, {
      autoCommit: true,
    });

    const nuevoIdProducto = resultProd.outBinds.id[0];

    // 2) Crear stock 0 para TODAS las sucursales
    //    (stock_actual = 0, punto_critico = 0 de inicio)
    const sqlStockInicial = `
      INSERT INTO LPMFJCBC_STOCK_SUCURSAL (
        id_producto,
        id_sucursal,
        stock_actual,
        punto_critico
      )
      SELECT
        :id_producto,
        s.id_sucursal,
        0 AS stock_actual,
        0 AS punto_critico
      FROM LPMFJCBC_SUCURSALES s
    `;

    await execQuery(
      sqlStockInicial,
      { id_producto: nuevoIdProducto },
      { autoCommit: true }
    );

    res.status(201).json({
      mensaje: "Producto creado con éxito",
      id_producto: nuevoIdProducto,
    });
  } catch (err) {
    console.error("Error createProducto:", err);
    if (err.errorNum === 1) {
      return res
        .status(400)
        .json({ error: "Ya existe un producto con ese SKU" });
    }

    res.status(500).json({ error: "Error al crear producto" });
  }
}


// =======================================
// PUT - Actualizar producto
// =======================================
async function updateProducto(req, res) {
  try {
    const { id } = req.params;
    const {
      sku,
      nombre,
      descripcion,
      precio_unitario,
      categoria,
      unidad_medida,
      estado,
    } = req.body;

    const sql = `
      UPDATE LPMFJCBC_PRODUCTOS
      SET
        sku             = :sku,
        nombre          = :nombre,
        descripcion     = :descripcion,
        precio_unitario = :precio_unitario,
        categoria       = :categoria,
        unidad_medida   = :unidad_medida,
        estado          = :estado
      WHERE id_producto = :id
    `;

    const result = await execQuery(
      sql,
      {
        id: Number(id),
        sku,
        nombre,
        descripcion,
        precio_unitario,
        categoria,
        unidad_medida,
        estado,
      },
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json({ mensaje: "Producto actualizado correctamente" });
  } catch (err) {
    console.error("Error updateProducto:", err);

    if (err.errorNum === 1) {
      return res
        .status(400)
        .json({ error: "Ya existe un producto con ese SKU" });
    }

    res.status(500).json({ error: "Error al actualizar producto" });
  }
}

// =======================================
// PATCH - Desactivar producto (eliminación lógica)
// Cambia estado a 'INACTIVO'
// =======================================
async function desactivarProducto(req, res) {
  try {
    const { id } = req.params;

    const sql = `
      UPDATE LPMFJCBC_PRODUCTOS
      SET estado = 'INACTIVO'
      WHERE id_producto = :id
    `;

    const result = await execQuery(
      sql,
      { id: Number(id) },
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json({ mensaje: "Producto desactivado (eliminación lógica)" });
  } catch (err) {
    console.error("Error desactivarProducto:", err);
    res.status(500).json({ error: "Error al desactivar producto" });
  }
}

module.exports = {
  getProductos,
  getProductoById,
  createProducto,
  updateProducto,
  desactivarProducto,
};
