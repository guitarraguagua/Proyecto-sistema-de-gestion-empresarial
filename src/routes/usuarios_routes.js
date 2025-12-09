// src/routes/usuarios_routes.js

const express = require("express");
const router = express.Router();

const {
  getUsuarios,
  getUsuarioById,
  createUsuario,
  updateUsuario,
  desactivarUsuario,
  asignarRolUsuario,
} = require("../controllers/usuarios_controller");

const authMiddleware = require("../middlewares/auth_middlewares");
const requireRoles = require("../middlewares/roles_middlewares");

router.use(authMiddleware, requireRoles([1]));
router.get("/", getUsuarios);
router.get("/:id", getUsuarioById);
router.post("/", createUsuario);
router.put("/:id", updateUsuario);
router.patch("/:id/desactivar", desactivarUsuario);
router.patch("/:id/rol", asignarRolUsuario);

module.exports = router;

