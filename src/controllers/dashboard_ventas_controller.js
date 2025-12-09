// src/controllers/dashboard_ventas_controller.js
const { execQuery } = require("../db");

// =======================================
// VENTAS DIARIAS (por mes y año)
// GET /api/dashboard-ventas/diarias?anio=2025&mes=12
// =======================================
async function getVentasDiarias(req, res) {
  try {
    const { anio, mes } = req.query;

    if (!anio || !mes) {
      return res
        .status(400)
        .json({ error: "Debe enviar anio y mes en la consulta" });
    }

    const sql = `
      SELECT
        TRUNC(v.fecha_venta) AS fecha,
        SUM(v.total)        AS total_vendido,
        COUNT(*)            AS cantidad_ventas
      FROM LPMFJCBC_VENTAS v
      WHERE v.estado = 'EMITIDA'
        AND v.fecha_venta >= TRUNC(TO_DATE(:anio || '-' || :mes || '-01', 'YYYY-MM-DD'))
        AND v.fecha_venta <  ADD_MONTHS(TRUNC(TO_DATE(:anio || '-' || :mes || '-01', 'YYYY-MM-DD')), 1)
      GROUP BY TRUNC(v.fecha_venta)
      ORDER BY fecha
    `;

    const result = await execQuery(sql, { anio, mes });
    res.json(result.rows);
  } catch (err) {
    console.error("Error getVentasDiarias:", err);
    res.status(500).json({ error: "Error al obtener ventas diarias" });
  }
}

// =======================================
// VENTAS MENSUALES (por año)
// GET /api/dashboard-ventas/mensuales?anio=2025
// =======================================
async function getVentasMensuales(req, res) {
  try {
    const { anio } = req.query;

    if (!anio) {
      return res.status(400).json({ error: "Debe enviar anio en la consulta" });
    }

    const sql = `
      SELECT
        EXTRACT(MONTH FROM v.fecha_venta) AS mes,
        SUM(v.total)                       AS total_vendido,
        COUNT(*)                           AS cantidad_ventas
      FROM LPMFJCBC_VENTAS v
      WHERE v.estado = 'EMITIDA'
        AND EXTRACT(YEAR FROM v.fecha_venta) = :anio
      GROUP BY EXTRACT(MONTH FROM v.fecha_venta)
      ORDER BY mes
    `;

    const result = await execQuery(sql, { anio });
    res.json(result.rows);
  } catch (err) {
    console.error("Error getVentasMensuales:", err);
    res.status(500).json({ error: "Error al obtener ventas mensuales" });
  }
}

// =======================================
// VENTAS ANUALES (histórico)
// GET /api/dashboard-ventas/anuales
// =======================================
async function getVentasAnuales(req, res) {
  try {
    const sql = `
      SELECT
        EXTRACT(YEAR FROM v.fecha_venta) AS anio,
        SUM(v.total)                     AS total_vendido,
        COUNT(*)                         AS cantidad_ventas
      FROM LPMFJCBC_VENTAS v
      WHERE v.estado = 'EMITIDA'
      GROUP BY EXTRACT(YEAR FROM v.fecha_venta)
      ORDER BY anio
    `;

    const result = await execQuery(sql);
    res.json(result.rows);
  } catch (err) {
    console.error("Error getVentasAnuales:", err);
    res.status(500).json({ error: "Error al obtener ventas anuales" });
  }
}

module.exports = {
  getVentasDiarias,
  getVentasMensuales,
  getVentasAnuales,
};
