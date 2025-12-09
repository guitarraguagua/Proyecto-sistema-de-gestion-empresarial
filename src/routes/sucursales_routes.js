// src/routes/sucursales_routes.js
const express = require("express");
const router = express.Router();

const {
  getSucursales,
  getSucursalById,
  createSucursal,
  updateSucursal,
  desactivarSucursal,
  deleteSucursal,
} = require("../controllers/sucursales_controller");

const authMiddleware = require("../middlewares/auth_middlewares");
const requireRoles = require("../middlewares/roles_middlewares");

router.use(authMiddleware, requireRoles([1]));

router.get("/", getSucursales);
router.get("/:id", getSucursalById);
router.post("/", createSucursal);
router.put("/:id", updateSucursal);
router.patch("/:id/desactivar", desactivarSucursal);

router.delete("/:id", deleteSucursal);

module.exports = router;
