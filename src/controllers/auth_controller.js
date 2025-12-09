const { execQuery } = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email y contraseña son obligatorios" });
    }

    const sql = `
      SELECT
        id_usuario,
        email,
        password_hash,
        nombres,
        apellidos,
        id_rol,
        estado
      FROM LPMFJCBC_USUARIOS
      WHERE email = :email
    `;

    const result = await execQuery(sql, { email });

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const user = result.rows[0];

    if (user.ESTADO !== "ACTIVO") {
      return res.status(403).json({ error: "Cuenta inactiva" });
    }

    // 👇 COMPARACIÓN CORRECTA
    const ok = await bcrypt.compare(password, user.PASSWORD_HASH);

    if (!ok) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const token = jwt.sign(
      {
        id_usuario: user.ID_USUARIO,
        id_rol: user.ID_ROL,
        email: user.EMAIL
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      mensaje: "Login exitoso",
      usuario: {
        id_usuario: user.ID_USUARIO,
        email: user.EMAIL,
        nombres: user.NOMBRES,
        apellidos: user.APELLIDOS,
        id_rol: user.ID_ROL
      },
      token
    });

  } catch (err) {
    console.error("Error login:", err);
    res.status(500).json({ error: "Error interno en login" });
  }
}

module.exports = { login };
