// src/controllers/reportes_controller.js
const { execQuery } = require("../db");
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");

// =======================================
// RF-18: Reporte consolidado de ventas
// Admin genera reporte filtrado por fecha
// - Total de ventas ($)
// - Cantidad de unidades vendidas
// - Ticket promedio
// - Desglose por sucursal
// Restricción:
//  - fecha_desde <= fecha_hasta
//  - solo lecturas (no bloquea a otros usuarios)
// =======================================

async function obtenerDatosReporteVentas(fecha_desde, fecha_hasta) {
  // Total de ventas y cantidad de ventas
  const sqlGlobal = `
    SELECT
      SUM(v.total) AS total_ventas,
      COUNT(*)     AS cantidad_ventas
    FROM LPMFJCBC_VENTAS v
    WHERE v.estado = 'EMITIDA'
      AND v.fecha_venta >= TO_DATE(:fecha_desde, 'YYYY-MM-DD')
      AND v.fecha_venta <  TO_DATE(:fecha_hasta, 'YYYY-MM-DD') + 1
  `;
  const rGlobal = await execQuery(sqlGlobal, { fecha_desde, fecha_hasta });

  const totalVentas    = rGlobal.rows[0]?.TOTAL_VENTAS    || 0;
  const cantidadVentas = rGlobal.rows[0]?.CANTIDAD_VENTAS || 0;

  // Unidades vendidas
  const sqlUnidades = `
    SELECT NVL(SUM(d.cantidad), 0) AS unidades_vendidas
    FROM LPMFJCBC_VENTAS v
    JOIN LPMFJCBC_DETALLE_VENTAS d ON d.id_venta = v.id_venta
    WHERE v.estado = 'EMITIDA'
      AND v.fecha_venta >= TO_DATE(:fecha_desde, 'YYYY-MM-DD')
      AND v.fecha_venta <  TO_DATE(:fecha_hasta, 'YYYY-MM-DD') + 1
  `;
  const rUnidades = await execQuery(sqlUnidades, { fecha_desde, fecha_hasta });
  const unidadesVendidas = rUnidades.rows[0]?.UNIDADES_VENDIDAS || 0;

  const ticketPromedio =
    cantidadVentas > 0 ? totalVentas / cantidadVentas : 0;

  // Desglose por sucursal
  const sqlSucursales = `
    SELECT
      s.id_sucursal,
      s.nombre                   AS nombre_sucursal,
      SUM(v.total)               AS total_ventas,
      COUNT(DISTINCT v.id_venta) AS cantidad_ventas,
      (
        SELECT NVL(SUM(d.cantidad), 0)
        FROM LPMFJCBC_DETALLE_VENTAS d
        WHERE d.id_venta IN (
          SELECT v2.id_venta
          FROM LPMFJCBC_VENTAS v2
          WHERE v2.id_sucursal_despacho = s.id_sucursal
            AND v2.estado = 'EMITIDA'
            AND v2.fecha_venta >= TO_DATE(:fecha_desde, 'YYYY-MM-DD')
            AND v2.fecha_venta <  TO_DATE(:fecha_hasta, 'YYYY-MM-DD') + 1
        )
      ) AS unidades_vendidas
    FROM LPMFJCBC_VENTAS v
    JOIN LPMFJCBC_SUCURSALES s
      ON v.id_sucursal_despacho = s.id_sucursal
    WHERE v.estado = 'EMITIDA'
      AND v.fecha_venta >= TO_DATE(:fecha_desde, 'YYYY-MM-DD')
      AND v.fecha_venta <  TO_DATE(:fecha_hasta, 'YYYY-MM-DD') + 1
    GROUP BY s.id_sucursal, s.nombre
    ORDER BY s.nombre
  `;
  const rSucursales = await execQuery(sqlSucursales, { fecha_desde, fecha_hasta });

  return {
    rango: { fecha_desde, fecha_hasta },
    global: {
      total_ventas: totalVentas,
      cantidad_ventas: cantidadVentas,
      unidades_vendidas: unidadesVendidas,
      ticket_promedio: ticketPromedio,
    },
    por_sucursal: rSucursales.rows,
  };
}

async function exportarReporteVentas(req, res) {
  try {
    const { fecha_desde, fecha_hasta, formato } = req.query; // formato = 'pdf' | 'excel'

    // Validar formato
    if (!formato || !["pdf", "excel"].includes(formato.toLowerCase())) {
      return res.status(400).json({
        error: "Debe indicar un formato válido: 'pdf' o 'excel'",
      });
    }

    // Validar fechas (similar al RF-18)
    if (!fecha_desde || !fecha_hasta) {
      return res.status(400).json({
        error: "Debe enviar 'fecha_desde' y 'fecha_hasta' (YYYY-MM-DD)",
      });
    }

    const inicio = new Date(fecha_desde);
    const fin    = new Date(fecha_hasta);

    if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
      return res.status(400).json({
        error: "Formato de fecha inválido. Use YYYY-MM-DD",
      });
    }

    if (inicio > fin) {
      return res.status(400).json({
        error: "La fecha de inicio no puede ser posterior a la fecha de término",
      });
    }

    // Reutilizar el cálculo del reporte (RF-18)
    const data = await obtenerDatosReporteVentas(fecha_desde, fecha_hasta);

    // ⚠ Aquí asumimos que el frontend solo habilita el botón de exportar
    // si ya mostró antes el reporte en pantalla (requisito funcional).
    // Del lado backend, el reporte es "válido" si pasa las validaciones de arriba.

    if (formato.toLowerCase() === "excel") {
      // ====== EXPORTAR EXCEL ======
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Reporte Ventas");

      // Encabezado global
      sheet.addRow([
        "Fecha desde",
        data.rango.fecha_desde,
        "Fecha hasta",
        data.rango.fecha_hasta,
      ]);
      sheet.addRow([]);
      sheet.addRow(["Total ventas", data.global.total_ventas]);
      sheet.addRow(["Cant. ventas", data.global.cantidad_ventas]);
      sheet.addRow(["Unidades vendidas", data.global.unidades_vendidas]);
      sheet.addRow(["Ticket promedio", data.global.ticket_promedio]);
      sheet.addRow([]);
      sheet.addRow(["ID Sucursal", "Sucursal", "Total ventas", "Cant. ventas", "Unidades"]);

      // Detalle por sucursal
      data.por_sucursal.forEach((s) => {
        sheet.addRow([
          s.ID_SUCURSAL,
          s.NOMBRE_SUCURSAL,
          s.TOTAL_VENTAS,
          s.CANTIDAD_VENTAS,
          s.UNIDADES_VENDIDAS,
        ]);
      });

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="reporte_ventas.xlsx"'
      );

      await workbook.xlsx.write(res);
      return res.end();
    } else {
      // ====== EXPORTAR PDF ======
      const doc = new PDFDocument({ margin: 40 });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="reporte_ventas.pdf"'
      );

      doc.pipe(res);

      doc.fontSize(16).text("Reporte consolidado de ventas", { underline: true });
      doc.moveDown();
      doc.fontSize(10).text(`Rango: ${data.rango.fecha_desde} a ${data.rango.fecha_hasta}`);
      doc.moveDown();

      doc.text(`Total ventas:        ${data.global.total_ventas}`);
      doc.text(`Cantidad de ventas:  ${data.global.cantidad_ventas}`);
      doc.text(`Unidades vendidas:   ${data.global.unidades_vendidas}`);
      doc.text(`Ticket promedio:     ${data.global.ticket_promedio.toFixed(2)}`);
      doc.moveDown();

      doc.fontSize(12).text("Desglose por sucursal:");
      doc.moveDown(0.5);
      doc.fontSize(10);

      data.por_sucursal.forEach((s) => {
        doc.text(
          `- ${s.NOMBRE_SUCURSAL}: $${s.TOTAL_VENTAS} | ventas: ${s.CANTIDAD_VENTAS} | unidades: ${s.UNIDADES_VENDIDAS}`
        );
      });

      doc.end(); // Finaliza y envía el PDF
    }
  } catch (err) {
    console.error("Error exportarReporteVentas:", err);
    return res.status(500).json({ error: "Error al exportar reporte" });
  }
}


async function getReporteVentasConsolidado(req, res) {
  try {
    const { fecha_desde, fecha_hasta } = req.query; // formato esperado: YYYY-MM-DD

    // 1) Validar que vengan ambas fechas
    if (!fecha_desde || !fecha_hasta) {
      return res.status(400).json({
        error: "Debe enviar 'fecha_desde' y 'fecha_hasta' en el query string (YYYY-MM-DD)",
      });
    }

    // 2) Validar que fecha_desde <= fecha_hasta (en JS)
    const inicio = new Date(fecha_desde);
    const fin    = new Date(fecha_hasta);

    if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
      return res.status(400).json({
        error: "Formato de fecha inválido. Use YYYY-MM-DD",
      });
    }

    if (inicio > fin) {
      return res.status(400).json({
        error: "La fecha de inicio no puede ser posterior a la fecha de término",
      });
    }

    // 3) Consulta GLOBAL (total de ventas y cantidad de ventas)
    const sqlGlobal = `
      SELECT
        SUM(v.total) AS total_ventas,
        COUNT(*)     AS cantidad_ventas
      FROM LPMFJCBC_VENTAS v
      WHERE v.estado = 'EMITIDA'
        AND v.fecha_venta >= TO_DATE(:fecha_desde, 'YYYY-MM-DD')
        AND v.fecha_venta <  TO_DATE(:fecha_hasta, 'YYYY-MM-DD') + 1
    `;

    const rGlobal = await execQuery(sqlGlobal, { fecha_desde, fecha_hasta });
    const rowGlobal = rGlobal.rows[0] || {};

    const totalVentas    = rowGlobal.TOTAL_VENTAS    || 0;
    const cantidadVentas = rowGlobal.CANTIDAD_VENTAS || 0;

    // 4) Consulta de UNIDADES vendidas (sumando detalle de ventas)
    const sqlUnidades = `
      SELECT
        NVL(SUM(d.cantidad), 0) AS unidades_vendidas
      FROM LPMFJCBC_VENTAS v
      JOIN LPMFJCBC_DETALLE_VENTAS d
        ON d.id_venta = v.id_venta
      WHERE v.estado = 'EMITIDA'
        AND v.fecha_venta >= TO_DATE(:fecha_desde, 'YYYY-MM-DD')
        AND v.fecha_venta <  TO_DATE(:fecha_hasta, 'YYYY-MM-DD') + 1
    `;

    const rUnidades = await execQuery(sqlUnidades, { fecha_desde, fecha_hasta });
    const unidadesVendidas = rUnidades.rows[0]?.UNIDADES_VENDIDAS || 0;

    // 5) Ticket promedio = total_ventas / cantidad_ventas
    const ticketPromedio =
      cantidadVentas > 0 ? totalVentas / cantidadVentas : 0;

    // 6) Desglose por sucursal
    const sqlSucursales = `
      SELECT
        s.id_sucursal,
        s.nombre          AS nombre_sucursal,
        SUM(v.total)      AS total_ventas,
        COUNT(DISTINCT v.id_venta) AS cantidad_ventas,
        (
          SELECT NVL(SUM(d.cantidad), 0)
          FROM LPMFJCBC_DETALLE_VENTAS d
          WHERE d.id_venta IN (
            SELECT v2.id_venta
            FROM LPMFJCBC_VENTAS v2
            WHERE v2.id_sucursal_despacho = s.id_sucursal
              AND v2.estado = 'EMITIDA'
              AND v2.fecha_venta >= TO_DATE(:fecha_desde, 'YYYY-MM-DD')
              AND v2.fecha_venta <  TO_DATE(:fecha_hasta, 'YYYY-MM-DD') + 1
          )
        ) AS unidades_vendidas
      FROM LPMFJCBC_VENTAS v
      JOIN LPMFJCBC_SUCURSALES s
        ON v.id_sucursal_despacho = s.id_sucursal
      WHERE v.estado = 'EMITIDA'
        AND v.fecha_venta >= TO_DATE(:fecha_desde, 'YYYY-MM-DD')
        AND v.fecha_venta <  TO_DATE(:fecha_hasta, 'YYYY-MM-DD') + 1
      GROUP BY
        s.id_sucursal,
        s.nombre
      ORDER BY s.nombre
    `;

    const rSucursales = await execQuery(sqlSucursales, {
      fecha_desde,
      fecha_hasta,
    });

    // 7) Respuesta final
    return res.json({
      rango: {
        fecha_desde,
        fecha_hasta,
      },
      global: {
        total_ventas: totalVentas,
        cantidad_ventas: cantidadVentas,
        unidades_vendidas: unidadesVendidas,
        ticket_promedio: ticketPromedio,
      },
      por_sucursal: rSucursales.rows,
    });
  } catch (err) {
    console.error("Error getReporteVentasConsolidado:", err);
    return res.status(500).json({ error: "Error al generar reporte de ventas" });
  }
}
async function getProductosSinMovimiento(req, res) {
  try {
    // umbral de días sin movimiento (query param, ej: ?umbral_dias=90)
    const umbral_dias = Number(req.query.umbral_dias || 90);

    if (isNaN(umbral_dias) || umbral_dias < 0) {
      return res.status(400).json({
        error: "umbral_dias debe ser un número mayor o igual a 0",
      });
    }

    const sql = `
      SELECT
        p.id_producto,
        p.sku,
        p.nombre                AS nombre_producto,
        s.id_sucursal,
        s.nombre                AS nombre_sucursal,
        st.stock_actual,
        MAX(sa.fecha_salida)    AS fecha_ultima_salida,
        MIN(en.fecha_entrada)   AS fecha_primer_ingreso,
        TRUNC(
          SYSDATE -
          COALESCE(
            MAX(sa.fecha_salida),
            MIN(en.fecha_entrada)
          )
        ) AS dias_sin_movimiento
      FROM LPMFJCBC_STOCK_SUCURSAL st
      JOIN LPMFJCBC_PRODUCTOS p
        ON p.id_producto = st.id_producto
      JOIN LPMFJCBC_SUCURSALES s
        ON s.id_sucursal = st.id_sucursal
      LEFT JOIN LPMFJCBC_SALIDAS_STOCK sa
        ON sa.id_producto = st.id_producto
       AND sa.id_sucursal = st.id_sucursal
      LEFT JOIN LPMFJCBC_ENTRADAS_STOCK en
        ON en.id_producto = st.id_producto
       AND en.id_sucursal = st.id_sucursal
      WHERE st.stock_actual > 0
      GROUP BY
        p.id_producto,
        p.sku,
        p.nombre,
        s.id_sucursal,
        s.nombre,
        st.stock_actual
      HAVING TRUNC(
        SYSDATE -
        COALESCE(
          MAX(sa.fecha_salida),
          MIN(en.fecha_entrada)
        )
      ) > :umbral_dias
      ORDER BY dias_sin_movimiento DESC
    `;

    const result = await execQuery(sql, { umbral_dias });

    // Respuesta: lista de productos sin movimiento
    res.json({
      umbral_dias,
      fecha_actual: new Date(), // para mostrar en el front
      productos_sin_movimiento: result.rows,
    });
  } catch (err) {
    console.error("Error getProductosSinMovimiento:", err);
    res
      .status(500)
      .json({ error: "Error al obtener productos sin movimiento" });
  }
}

module.exports = {
  getReporteVentasConsolidado,
  obtenerDatosReporteVentas,
  exportarReporteVentas,
  getProductosSinMovimiento,
};
