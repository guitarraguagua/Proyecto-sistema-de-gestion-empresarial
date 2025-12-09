// src/routes/entradas_stock_routes.js
const express = require("express");
const router = express.Router();

const {
  getEntradasStock,
  getEntradaStockById,
  createEntradaStock,
  updateEntradaStock,
  deleteEntradaStock,
} = require("../controllers/entradas_stock_controller");

const authMiddleware = require("../middlewares/auth_middlewares");
const requireRoles = require("../middlewares/roles_middlewares");

// Primero autenticamos
router.use(authMiddleware);

// Permitimos ADMIN (1) y BODEGA (3)
router.use(requireRoles([1, 3]));

router.get("/", getEntradasStock);
router.get("/:id", getEntradaStockById);
router.post("/", createEntradaStock);
router.put("/:id", updateEntradaStock);
router.delete("/:id", deleteEntradaStock);

module.exports = router;
