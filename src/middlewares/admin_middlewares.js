// src/middlewares/admin_middleware.js

const ADMIN_ROLE_ID = 1;
const VENTAS_ROLE_ID = 2;
const BODEGA_ROLE_ID = 3;

function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "No autenticado" });
  }

  if (req.user.id_rol !== ADMIN_ROLE_ID) {
    return res.status(403).json({ error: "Acceso solo para Administrador" });
  }

  next();
}

function requireVentas(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "No autenticado" });
  }

  if (req.user.id_rol !== VENTAS_ROLE_ID) {
    return res.status(403).json({ error: "Acceso solo para Ventas" });
  }

  next();
}

function requireBodega(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "No autenticado" });
  }

  if (req.user.id_rol !== BODEGA_ROLE_ID) {
    return res.status(403).json({ error: "Acceso solo para Bodega" });
  }

  next();
}

module.exports = requireAdmin;
module.exports =  requireVentas;
module.exports =  requireBodega;


