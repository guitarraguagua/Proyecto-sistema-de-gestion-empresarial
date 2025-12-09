// src/db.js
const oracledb = require("oracledb");
require("dotenv").config();

// Devolver filas como objetos { COLUMNA: valor }
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

const dbConfig = {
  user: process.env.DB_USER || "system",
  password: process.env.DB_PASSWORD || "martin0603",
  connectString: process.env.DB_CONNECT_STRING || "localhost:1521/XEPDB1",
};

// Crear pool de conexiones
async function initOracle() {
  try {
    await oracledb.createPool({
      user: dbConfig.user,
      password: dbConfig.password,
      connectString: dbConfig.connectString,
      poolMin: 1,
      poolMax: 5,
      poolIncrement: 1,
    });
    console.log("✅ Pool de conexiones Oracle creado");
  } catch (err) {
    console.error("❌ Error creando el pool de Oracle:", err);
    throw err;
  }
}

// Cerrar pool
async function closeOracle() {
  try {
    await oracledb.getPool().close(10);
    console.log("✅ Pool de Oracle cerrado");
  } catch (err) {
    console.error("❌ Error cerrando el pool de Oracle:", err);
  }
}

// Ejecutar consulta
async function execQuery(sql, binds = {}, options = {}) {
  let connection;
  try {
    connection = await oracledb.getConnection();
    const result = await connection.execute(sql, binds, options);
    return result;
  } catch (err) {
    console.error("❌ Error en execQuery:", err);
    throw err;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Error cerrando conexión:", err);
      }
    }
  }
}

module.exports = {
  initOracle,
  closeOracle,
  execQuery,
};
