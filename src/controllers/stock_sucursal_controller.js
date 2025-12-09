// src/controllers/stock_sucursal_controller.js
const { execQuery } = require("../db");
const oracledb = require("oracledb");

// =======================================
// GET - Todo el stock por sucursal
// =======================================
async function getStockSucursales(req, res) {
  try {
    const sql = `
      SELECT
        id_stock,
        id_producto,
        id_sucursal,
        stock_actual,
        punto_critico
      FROM LPMFJCBC_STOCK_SUCURSAL
      ORDER BY id_stock
    `;

    const result = await execQuery(sql);
    res.json(result.rows);
  } catch (err) {
    console.error("Error getStockSucursales:", err);
    res.status(500).json({ error: "Error al obtener stock por sucursal" });
  }
}

// =======================================
// GET - Stock por ID
// =======================================
async function getStockSucursalById(req, res) {
  try {
    const { id } = req.params;

    const sql = `
      SELECT
        id_stock,
        id_producto,
        id_sucursal,
        stock_actual,
        punto_critico
      FROM LPMFJCBC_STOCK_SUCURSAL
      WHERE id_stock = :id
    `;

    const result = await execQuery(sql, { id: Number(id) });

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Registro de stock no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error getStockSucursalById:", err);
    res.status(500).json({ error: "Error al obtener registro de stock" });
  }
}

// =======================================
// POST - Crear registro de stock
// =======================================
async function createStockSucursal(req, res) {
  try {
    const {
      id_producto,
      id_sucursal,
      stock_actual,
      punto_critico,
    } = req.body;

    const sql = `
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
      RETURNING id_stock INTO :id
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
      mensaje: "Registro de stock creado con éxito",
      id_stock: result.outBinds.id[0],
    });
  } catch (err) {
    console.error("Error createStockSucursal:", err);

    // ORA-00001: violación de UNIQUE (id_producto, id_sucursal)
    if (err.errorNum === 1) {
      return res.status(400).json({
        error: "Ya existe un registro de stock para ese producto en esa sucursal",
      });
    }

    // ORA-02291: violación de integridad referencial (FK)
    if (err.errorNum === 2291) {
      return res.status(400).json({
        error: "id_producto o id_sucursal no existen",
      });
    }

    res.status(500).json({ error: "Error al crear registro de stock" });
  }
}

async function setPuntoCritico(req, res) {
  try {
    const { id_producto, id_sucursal, punto_critico } = req.body;

    // Validaciones básicas
    if (!id_producto || !id_sucursal) {
      return res
        .status(400)
        .json({ error: "id_producto e id_sucursal son obligatorios" });
    }

    // Validar que sea número entero y >= 0
    if (
      punto_critico === undefined ||
      punto_critico === null ||
      isNaN(punto_critico) ||
      !Number.isInteger(Number(punto_critico)) ||
      Number(punto_critico) < 0
    ) {
      return res.status(400).json({
        error:
          "punto_critico debe ser un número entero mayor o igual a 0",
      });
    }

    const sql = `
      UPDATE LPMFJCBC_STOCK_SUCURSAL
      SET punto_critico = :punto_critico
      WHERE id_producto = :id_producto
        AND id_sucursal = :id_sucursal
    `;

    const result = await execQuery(
      sql,
      {
        id_producto: Number(id_producto),
        id_sucursal: Number(id_sucursal),
        punto_critico: Number(punto_critico),
      },
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({
        error:
          "No se encontró registro de stock para ese producto y sucursal",
      });
    }

    res.json({
      mensaje: "Punto crítico actualizado correctamente",
      id_producto: Number(id_producto),
      id_sucursal: Number(id_sucursal),
      punto_critico: Number(punto_critico),
    });
  } catch (err) {
    console.error("Error setPuntoCritico:", err);
    res.status(500).json({ error: "Error al actualizar punto crítico" });
  }
}


// =======================================
// PUT - Actualizar registro de stock
// =======================================
async function updateStockSucursal(req, res) {
  try {
    const { id } = req.params;
    const {
      id_producto,
      id_sucursal,
      stock_actual,
      punto_critico,
    } = req.body;

    const sql = `
      UPDATE LPMFJCBC_STOCK_SUCURSAL
      SET
        id_producto   = :id_producto,
        id_sucursal   = :id_sucursal,
        stock_actual  = :stock_actual,
        punto_critico = :punto_critico
      WHERE id_stock = :id
    `;

    const result = await execQuery(
      sql,
      {
        id: Number(id),
        id_producto,
        id_sucursal,
        stock_actual,
        punto_critico,
      },
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: "Registro de stock no encontrado" });
    }

    res.json({ mensaje: "Registro de stock actualizado correctamente" });
  } catch (err) {
    console.error("Error updateStockSucursal:", err);

    if (err.errorNum === 1) {
      return res.status(400).json({
        error: "Ya existe un registro de stock para ese producto en esa sucursal",
      });
    }

    if (err.errorNum === 2291) {
      return res.status(400).json({
        error: "id_producto o id_sucursal no existen",
      });
    }

    res.status(500).json({ error: "Error al actualizar registro de stock" });
  }
}

// =======================================
// DELETE - Eliminar registro de stock
// =======================================
async function deleteStockSucursal(req, res) {
  try {
    const { id } = req.params;

    const sql = `
      DELETE FROM LPMFJCBC_STOCK_SUCURSAL
      WHERE id_stock = :id
    `;

    const result = await execQuery(sql, { id: Number(id) }, { autoCommit: true });

    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: "Registro de stock no encontrado" });
    }

    res.json({ mensaje: "Registro de stock eliminado correctamente" });
  } catch (err) {
    console.error("Error deleteStockSucursal:", err);
    res.status(500).json({ error: "Error al eliminar registro de stock" });
  }
}

module.exports = {
  getStockSucursales,
  getStockSucursalById,
  createStockSucursal,
  updateStockSucursal,
  deleteStockSucursal,
  setPuntoCritico
};
