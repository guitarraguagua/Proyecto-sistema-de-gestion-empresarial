// src/routes/auth_routes.js
const express = require("express");
const router = express.Router();
const { login } = require("../controllers/auth_controller");

// Ruta de login
router.post("/login", login);

module.exports = router;
