// src/routes/parametros_routes.js
const express = require("express");
const router = express.Router();

const {
  getParametros,
  getParametroById,
  createParametro,
  updateParametro,
  deleteParametro,
} = require("../controllers/parametros_controller");

const authMiddleware = require("../middlewares/auth_middlewares");
const requireRoles = require("../middlewares/roles_middlewares");

router.use(authMiddleware, requireRoles([1]));

router.get("/", getParametros);
router.get("/:id", getParametroById);
router.post("/", createParametro);
router.put("/:id", updateParametro);
router.delete("/:id", deleteParametro);

module.exports = router;
