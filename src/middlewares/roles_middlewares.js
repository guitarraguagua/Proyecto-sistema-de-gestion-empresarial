// src/middlewares/roles_middleware.js

// allowedRoles: arreglo de id_rol que pueden entrar
function requireRoles(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "No autenticado" });
    }

    const rolUsuario = req.user.id_rol;

    if (!allowedRoles.includes(rolUsuario)) {
      return res.status(403).json({ error: "Acceso denegado para este rol" });
    }

    next();
  };
}

module.exports = requireRoles;
