const express = require("express");
const {
  getRoles,
  getRolById,
  createRol,
  updateRol,
  deleteRol,
} = require("../controllers/roles_controller");

const router = express.Router();

const authMiddleware = require("../middlewares/auth_middlewares");
const requireRoles = require("../middlewares/roles_middlewares");

router.use(authMiddleware, requireRoles([1]));

router.get("/", getRoles);
router.get("/:id", getRolById);
router.post("/", createRol);
router.put("/:id", updateRol);
router.delete("/:id", deleteRol);

module.exports = router;
