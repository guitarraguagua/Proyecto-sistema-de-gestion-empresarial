// src/routes/detalle_ventas_routes.js
const express = require("express");
const router = express.Router();

const {
  getDetallesVentas,
  getDetalleVentaById,
  createDetalleVenta,
  updateDetalleVenta,
  deleteDetalleVenta,
} = require("../controllers/detalle_ventas_controller");

const authMiddleware = require("../middlewares/auth_middlewares");
const requireRoles = require("../middlewares/roles_middlewares");

router.use(authMiddleware, requireRoles([1, 2]));

router.get("/", getDetallesVentas);
router.get("/:id", getDetalleVentaById);
router.post("/", createDetalleVenta);
router.put("/:id", updateDetalleVenta);
router.delete("/:id", deleteDetalleVenta);

module.exports = router;
