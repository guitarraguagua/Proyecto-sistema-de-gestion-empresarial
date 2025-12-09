// src/middlewares/auth_middleware.js
const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  // Esperamos el token en el header: Authorization: Bearer <token>
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(401).json({ error: "No hay token, acceso no autorizado" });
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({ error: "Formato de token inválido" });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Guardamos los datos del usuario en req.user para usarlos en las rutas
    req.user = decoded;
    next();
  } catch (err) {
    console.error("Error verificando token:", err);
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
}

module.exports = authMiddleware;
