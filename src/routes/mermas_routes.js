// src/routes/mermas_routes.js
const express = require("express");
const router = express.Router();

const {
  getMermas,
  getMermaById,
  createMerma,
} = require("../controllers/mermas_controller");

const authMiddleware = require("../middlewares/auth_middlewares");
const requireRoles = require("../middlewares/roles_middlewares");

router.use(authMiddleware)
router.use(requireRoles([1, 3]));

router.get("/", getMermas);
router.get("/:id", getMermaById);
router.post("/", createMerma);

module.exports = router;
