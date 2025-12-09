// src/routes/salidas_stock_routes.js
const express = require("express");
const router = express.Router();

const {
  getSalidasStock,
  getSalidaStockById,
  createSalidaStock,
  updateSalidaStock,
  deleteSalidaStock,
} = require("../controllers/salidas_stock_controller");


const authMiddleware = require("../middlewares/auth_middlewares");
const requireRoles = require("../middlewares/roles_middlewares");

router.use(authMiddleware, requireRoles([1, 3]));
router.get("/", getSalidasStock);
router.get("/:id", getSalidaStockById);
//router.post("/", createSalidaStock);
//router.put("/:id", updateSalidaStock);
//router.delete("/:id", deleteSalidaStock);

module.exports = router;
