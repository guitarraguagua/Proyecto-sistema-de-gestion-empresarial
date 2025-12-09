// src/routes/reportes_routes.js
const express = require("express");
const router = express.Router();

const {
    exportarReporteVentas,
  getReporteVentasConsolidado,
  getProductosSinMovimiento,
} = require("../controllers/reportes_controller");

const authMiddleware = require("../middlewares/auth_middlewares");
const requireRoles = require("../middlewares/roles_middlewares");

// Solo ADMIN (1) puede generar este reporte
//router.use(authMiddleware, requireRoles([1]));

router.get("/ventas-consolidadas", getReporteVentasConsolidado);
router.get("/ventas-exportar", exportarReporteVentas);
router.get("/productos-sin-movimiento", getProductosSinMovimiento);


module.exports = router;
