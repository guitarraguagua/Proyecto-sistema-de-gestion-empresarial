// src/routes/stock_sucursal_routes.js
const express = require("express");
const router = express.Router();

const {
  getStockSucursales,
  getStockSucursalById,
  createStockSucursal,
  updateStockSucursal,
  deleteStockSucursal,
  setPuntoCritico,
} = require("../controllers/stock_sucursal_controller");

//const requireRoles = require("../middlewares/roles_middlewares");

const authMiddleware = require("../middlewares/auth_middlewares");
const requireRoles = require("../middlewares/roles_middlewares");

router.use(authMiddleware, requireRoles([1,2,3]));
router.get("/", getStockSucursales);
router.get("/:id", getStockSucursalById);
router.post("/", createStockSucursal);
router.put("/:id", updateStockSucursal);
router.delete("/:id", deleteStockSucursal);
router.patch("/punto-critico", setPuntoCritico)

module.exports = router;
