const bcrypt = require("bcryptjs");

async function generarHash() {
  const hash = await bcrypt.hash("admin123", 10); //"cambiar admin123, por contraseña deseada"
  console.log(hash);
}

generarHash();
