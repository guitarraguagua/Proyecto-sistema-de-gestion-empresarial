// src/controllers/ventas_controller.js
const { execQuery } = require("../db");
const oracledb = require("oracledb");
const { registrarSalidasPorVenta } = require("./salidas_stock_controller");

// =======================================
// Helper: obtener tasa de IVA vigente desde parámetros
// =======================================
async function obtenerTasaIvaVigente() {
  const sql = `
    SELECT valor_numerico
    FROM LPMFJCBC_PARAMETROS_SISTEMA
    WHERE nombre = 'IVA'
      AND activo = 1
  `;

  const r = await execQuery(sql);

  // Valor por defecto si no hay fila en la tabla (19%)
  let tasa = 0.19;

  if (r.rows.length > 0 && r.rows[0].VALOR_NUMERICO != null) {
    // Si guardas 0.19 en la tabla, deja esto así:
    tasa = r.rows[0].VALOR_NUMERICO;

    // Si guardas 19 en la tabla, usa:
    // tasa = r.rows[0].VALOR_NUMERICO / 100;
  }

  return tasa;
}

// ================================
// GET - Obtener todas las ventas
// ================================
// ================================
// GET - Histórico de ventas con filtros y restricción por rol
// RF: Admin o Ventas visualizan ventas
//  - Admin ve todas
//  - Ventas solo ve las propias
// Filtros opcionales por rango de fechas e id_cliente
// ================================
async function getVentas(req, res) {
  try {
    // Filtros que llegan por query string: ?fecha_desde=2025-01-01&fecha_hasta=2025-12-31&id_cliente=3
    const { fecha_desde, fecha_hasta, id_cliente } = req.query;

    // Datos del usuario sacados del token (authMiddleware)
    const idRolUsuario = req.user.id_rol;
    const idUsuario    = req.user.id_usuario;

    let where = " WHERE 1 = 1 ";
    const binds = {};

    // Filtro por rango de fechas (opcional)
    if (fecha_desde) {
      where += " AND v.fecha_venta >= TO_DATE(:fecha_desde, 'YYYY-MM-DD') ";
      binds.fecha_desde = fecha_desde;
    }

    if (fecha_hasta) {
      // +1 día para incluir toda la fecha_hasta
      where += " AND v.fecha_venta < TO_DATE(:fecha_hasta, 'YYYY-MM-DD') + 1 ";
      binds.fecha_hasta = fecha_hasta;
    }

    // Filtro por cliente (opcional)
    if (id_cliente) {
      where += " AND v.id_cliente = :id_cliente ";
      binds.id_cliente = Number(id_cliente);
    }

    // Restricción por rol:
    //  - Rol 1 = ADMIN → ve todo
    //  - Rol 2 = VENTAS → solo sus ventas
    if (idRolUsuario === 2) {
      where += " AND v.id_usuario_vendedor = :id_usuario_vendedor ";
      binds.id_usuario_vendedor = idUsuario;
    }

    const sql = `
      SELECT
        v.id_venta,
        v.fecha_venta,
        c.razon_social AS cliente,
        v.total,
        u.nombres || ' ' || u.apellidos AS vendedor,
        v.estado
      FROM LPMFJCBC_VENTAS v
      JOIN LPMFJCBC_CLIENTES c
        ON v.id_cliente = c.id_cliente
      JOIN LPMFJCBC_USUARIOS u
        ON v.id_usuario_vendedor = u.id_usuario
      ${where}
      ORDER BY v.fecha_venta DESC, v.id_venta DESC
    `;

    const result = await execQuery(sql, binds);
    res.json(result.rows);
  } catch (err) {
    console.error("Error getVentas:", err);
    res.status(500).json({ error: "Error al obtener histórico de ventas" });
  }
}


// ================================
// GET - Venta por ID
// ================================
async function getVentaById(req, res) {
  try {
    const { id } = req.params;

    const sql = `
      SELECT
        id_venta,
        fecha_venta,
        id_cliente,
        id_usuario_vendedor,
        id_sucursal_despacho,
        metodo_pago,
        subtotal,
        iva,
        total,
        estado
      FROM LPMFJCBC_VENTAS
      WHERE id_venta = :id
    `;

    const result = await execQuery(sql, { id: Number(id) });

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Venta no encontrada" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error getVentaById:", err);
    res.status(500).json({ error: "Error al obtener venta" });
  }
}

/**
 * ================================
 * POST - Calcular resumen de venta (SIN grabar)
 * Para mostrar al vendedor: subtotal, IVA, total
 * Body:
 * {
 *   "detalle": [
 *     { "id_producto": 10, "cantidad": 3, "precio_unitario": 1000 },
 *     { "id_producto": 11, "cantidad": 2, "precio_unitario": 2500 }
 *   ]
 * }
 * ================================
 */
async function calcularResumenVenta(req, res) {
  try {
    const { detalle } = req.body;

    if (!detalle || !detalle.length) {
      return res
        .status(400)
        .json({ error: "Debe enviar al menos un ítem en el detalle" });
    }

    // 1) Calcular subtotal desde el detalle
    let subtotal = 0;
    for (const item of detalle) {
      if (!item.id_producto || !item.cantidad || !item.precio_unitario) {
        return res.status(400).json({
          error:
            "Cada ítem debe incluir id_producto, cantidad y precio_unitario",
        });
      }
      subtotal += item.cantidad * item.precio_unitario;
    }

    // 2) Obtener tasa de IVA desde parámetros
    const tasaIva = await obtenerTasaIvaVigente();

    // 3) Calcular IVA y total (no modificables por el vendedor)
    const iva = Math.round(subtotal * tasaIva);
    const total = subtotal + iva;

    return res.json({
      subtotal,
      tasa_iva: tasaIva,
      iva,
      total,
    });
  } catch (err) {
    console.error("Error calcularResumenVenta:", err);
    res.status(500).json({ error: "Error al calcular resumen de venta" });
  }
}

// ================================
// POST - Crear venta (RF-14) + IVA parametrizado
// ================================
async function createVenta(req, res) {
  try {
    const {
      id_cliente,
      id_sucursal_despacho,
      metodo_pago,
      detalle,
    } = req.body;

    // Vendedor desde el token (authMiddleware), o desde body como respaldo
    const id_usuario_vendedor =
      req.user?.id_usuario || req.body.id_usuario_vendedor;

    // Validaciones
    if (!id_cliente || !id_sucursal_despacho || !metodo_pago || !detalle || !detalle.length) {
      return res.status(400).json({
        error:
          "id_cliente, id_sucursal_despacho, metodo_pago y detalle son obligatorios",
      });
    }

    if (!id_usuario_vendedor) {
      return res
        .status(401)
        .json({ error: "No se pudo determinar el usuario vendedor" });
    }

    // 1) Calcular subtotal desde el detalle
    let subtotal = 0;
    for (const item of detalle) {
      if (!item.id_producto || !item.cantidad || !item.precio_unitario) {
        return res.status(400).json({
          error:
            "Cada item del detalle debe tener id_producto, cantidad y precio_unitario",
        });
      }
      subtotal += item.cantidad * item.precio_unitario;
    }

    // 2) Obtener tasa de IVA desde parámetros (no viene del body)
    const tasaIva = await obtenerTasaIvaVigente();
    const iva = Math.round(subtotal * tasaIva);
    const total = subtotal + iva;

    // 3) Insertar VENTA
    const sqlVenta = `
      INSERT INTO LPMFJCBC_VENTAS (
        id_cliente,
        id_usuario_vendedor,
        id_sucursal_despacho,
        metodo_pago,
        subtotal,
        iva,
        total,
        estado
      ) VALUES (
        :id_cliente,
        :id_usuario_vendedor,
        :id_sucursal_despacho,
        :metodo_pago,
        :subtotal,
        :iva,
        :total,
        'EMITIDA'
      )
      RETURNING id_venta INTO :id_venta
    `;

    const bindsVenta = {
      id_cliente,
      id_usuario_vendedor,
      id_sucursal_despacho,
      metodo_pago,
      subtotal,
      iva,
      total,
      id_venta: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
    };

    const resultVenta = await execQuery(sqlVenta, bindsVenta, {
      autoCommit: true,
    });

    const id_venta = resultVenta.outBinds.id_venta[0];

    // 4) Insertar DETALLE_VENTAS
    for (const item of detalle) {
      const sqlDetalle = `
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
      `;

      await execQuery(
        sqlDetalle,
        {
          id_venta,
          id_producto: item.id_producto,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          subtotal_linea: item.cantidad * item.precio_unitario,
        },
        { autoCommit: true }
      );
    }

    // 5) Registrar salidas de stock automáticas
    const itemsSalida = detalle.map((item) => ({
      id_producto: item.id_producto,
      cantidad: item.cantidad,
    }));

    try {
      await registrarSalidasPorVenta({
        id_venta,
        id_sucursal: id_sucursal_despacho,
        items: itemsSalida,
      });
    } catch (errStock) {
      console.error("Error al registrar salidas de stock:", errStock);

      // Anular la venta si falla el stock
      await execQuery(
        `
        UPDATE LPMFJCBC_VENTAS
        SET estado = 'ANULADA'
        WHERE id_venta = :id_venta
      `,
        { id_venta },
        { autoCommit: true }
      );

      return res.status(400).json({
        error:
          errStock.message ||
          "Stock insuficiente para realizar la venta. Venta anulada.",
      });
    }

    res.status(201).json({
      mensaje: "Venta creada con éxito",
      id_venta,
      subtotal,
      tasa_iva: tasaIva,
      iva,
      total,
    });
  } catch (err) {
    console.error("Error createVenta:", err);
    res.status(500).json({ error: "Error al crear venta" });
  }
}

// ================================
// PUT - Actualizar venta (recalcula IVA automáticamente)
// ================================
async function updateVenta(req, res) {
  try {
    const { id } = req.params;
    const {
      id_cliente,
      id_usuario_vendedor,
      id_sucursal_despacho,
      metodo_pago,
      subtotal,
      estado, // 'EMITIDA' o 'ANULADA'
    } = req.body;

    if (!subtotal) {
      return res
        .status(400)
        .json({ error: "Debe enviar el subtotal para recalcular IVA y total" });
    }

    const tasaIva = await obtenerTasaIvaVigente();
    const iva = Math.round(subtotal * tasaIva);
    const total = subtotal + iva;

    const sql = `
      UPDATE LPMFJCBC_VENTAS
      SET
        id_cliente           = :id_cliente,
        id_usuario_vendedor  = :id_usuario_vendedor,
        id_sucursal_despacho = :id_sucursal_despacho,
        metodo_pago          = :metodo_pago,
        subtotal             = :subtotal,
        iva                  = :iva,
        total                = :total,
        estado               = :estado
      WHERE id_venta = :id
    `;

    const result = await execQuery(
      sql,
      {
        id: Number(id),
        id_cliente,
        id_usuario_vendedor,
        id_sucursal_despacho,
        metodo_pago,
        subtotal,
        iva,
        total,
        estado,
      },
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: "Venta no encontrada" });
    }

    res.json({ mensaje: "Venta actualizada correctamente" });
  } catch (err) {
    console.error("Error updateVenta:", err);
    res.status(500).json({ error: "Error al actualizar venta" });
  }
}

// ================================
// DELETE - Eliminar venta
// ================================
async function deleteVenta(req, res) {
  try {
    const { id } = req.params;

    const sql = `
      DELETE FROM LPMFJCBC_VENTAS
      WHERE id_venta = :id
    `;

    const result = await execQuery(
      sql,
      { id: Number(id) },
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: "Venta no encontrada" });
    }

    res.json({ mensaje: "Venta eliminada correctamente" });
  } catch (err) {
    console.error("Error deleteVenta:", err);
    res.status(500).json({ error: "Error al eliminar venta" });
  }
}

module.exports = {
  getVentas,
  getVentaById,
  calcularResumenVenta,
  createVenta,
  updateVenta,
  deleteVenta,
};
