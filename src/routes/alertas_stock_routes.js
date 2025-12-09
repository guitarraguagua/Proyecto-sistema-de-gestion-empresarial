// src/routes/alertas_stock_routes.js
const express = require("express");
const router = express.Router();

const {
  getAlertasStock,
  getAlertaStockById,
  createAlertaStock,
  updateAlertaStock,
  deleteAlertaStock,
} = require("../controllers/alertas_stock_controller");

const authMiddleware = require("../middlewares/auth_middlewares");
const requireRoles = require("../middlewares/roles_middlewares");

router.use(authMiddleware, requireRoles([1, 3]));

router.get("/", getAlertasStock);
router.get("/:id", getAlertaStockById);
router.post("/", createAlertaStock);
router.put("/:id", updateAlertaStock);
router.delete("/:id", deleteAlertaStock);

module.exports = router;
