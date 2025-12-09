// src/routes/dashboard_ventas_routes.js
const express = require("express");
const router = express.Router();

const {
  getVentasDiarias,
  getVentasMensuales,
  getVentasAnuales,
} = require("../controllers/dashboard_ventas_controller");

const authMiddleware = require("../middlewares/auth_middlewares");
const requireRoles = require("../middlewares/roles_middlewares");

// Solo ADMIN (1) puede ver el dashboard de ventas
router.use(authMiddleware, requireRoles([1]));

router.get("/diarias", getVentasDiarias);     // ?anio=2025&mes=12
router.get("/mensuales", getVentasMensuales); // ?anio=2025
router.get("/anuales", getVentasAnuales);     // sin parámetros

module.exports = router;
