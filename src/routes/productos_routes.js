// src/routes/productos_routes.js
const express = require("express");
const router = express.Router();

const {
  getProductos,
  getProductoById,
  createProducto,
  updateProducto,
  desactivarProducto,
} = require("../controllers/productos_controller");

const authMiddleware = require("../middlewares/auth_middlewares");
const requireRoles = require("../middlewares/roles_middlewares");


router.use(authMiddleware, requireRoles([1]));

router.get("/", getProductos);
router.get("/:id", getProductoById);
router.post("/", createProducto);
router.put("/:id", updateProducto);
router.patch("/:id/desactivar", desactivarProducto);

module.exports = router;
