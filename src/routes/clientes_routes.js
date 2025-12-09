const express = require("express");
const router = express.Router();

const {
  getClientes,
  getClienteById,
  createCliente,
  updateCliente,
  desactivarCliente,
} = require("../controllers/clientes_controller");

const authMiddleware = require("../middlewares/auth_middlewares");
const requireRoles = require("../middlewares/roles_middlewares");

// RF: "Ventas" (3) o "Administrador" (1) gestionan clientes
router.use(authMiddleware, requireRoles([1, 3]));

router.get("/", getClientes);
router.get("/:id", getClienteById);
router.post("/", createCliente);
router.put("/:id", updateCliente);
router.patch("/:id/desactivar", desactivarCliente);

module.exports = router;
