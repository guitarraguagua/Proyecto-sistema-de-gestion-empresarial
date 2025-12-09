const express = require("express");
const router = express.Router();

const {
  getVentas,
  getVentaById,
  calcularResumenVenta,
  createVenta,
  updateVenta,
  deleteVenta,
} = require("../controllers/ventas_controller");

const authMiddleware = require("../middlewares/auth_middlewares");
const requireRoles = require("../middlewares/roles_middlewares");

// Admin (1) y Ventas (2) pueden ver/crear ventas
router.use(authMiddleware, requireRoles([1, 2]));

router.get("/", getVentas);           // 👈 aquí aplica el requisito que hicimos
router.get("/:id", getVentaById);
router.post("/resumen", calcularResumenVenta);
router.post("/", createVenta);
router.put("/:id", updateVenta);
router.delete("/:id", deleteVenta);

module.exports = router;
