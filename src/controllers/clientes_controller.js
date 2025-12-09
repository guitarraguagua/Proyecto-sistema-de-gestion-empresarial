// src/controllers/clientes_controller.js
const { execQuery } = require("../db");
const oracledb = require("oracledb");

// ================================
// Helper: validar RUT chileno (módulo 11)
// Acepta formatos con puntos y guión, y dv K/k
// ================================
function validarRut(rutCompleto) {
  if (!rutCompleto) return false;

  // quitar puntos y guion
  const clean = rutCompleto.replace(/\./g, "").replace(/-/g, "").toUpperCase();

  if (clean.length < 2) return false;

  const cuerpo = clean.slice(0, -1);
  const dv = clean.slice(-1);

  if (!/^\d+$/.test(cuerpo)) return false;

  let suma = 0;
  let factor = 2;

  // recorre de derecha a izquierda
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i], 10) * factor;
    factor = factor === 7 ? 2 : factor + 1;
  }

  const resto = suma % 11;
  const dvCalcNum = 11 - resto;

  let dvCalc;
  if (dvCalcNum === 11) dvCalc = "0";
  else if (dvCalcNum === 10) dvCalc = "K";
  else dvCalc = dvCalcNum.toString();

  return dv === dvCalc;
}

// ================================
// Helper: validar email (simple)
// ================================
function validarEmail(email) {
  if (!email) return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// ================================
// GET - listar todos los clientes
// ================================
async function getClientes(req, res) {
  try {
    const sql = `
      SELECT
        id_cliente,
        rut,
        razon_social,
        giro,
        direccion_despacho,
        telefono,
        email,
        tipo_cliente,
        estado
      FROM LPMFJCBC_CLIENTES
      ORDER BY id_cliente
    `;

    const result = await execQuery(sql);
    res.json(result.rows);
  } catch (err) {
    console.error("Error getClientes:", err);
    res.status(500).json({ error: "Error al obtener clientes" });
  }
}

// ================================
// GET - cliente por ID
// ================================
async function getClienteById(req, res) {
  try {
    const { id } = req.params;

    const sql = `
      SELECT
        id_cliente,
        rut,
        razon_social,
        giro,
        direccion_despacho,
        telefono,
        email,
        tipo_cliente,
        estado
      FROM LPMFJCBC_CLIENTES
      WHERE id_cliente = :id
    `;

    const result = await execQuery(sql, { id: Number(id) });

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error getClienteById:", err);
    res.status(500).json({ error: "Error al obtener cliente" });
  }
}

// ================================
// POST - crear cliente
// RF: valida RUT módulo 11, email obligatorio y válido,
//     RUT y email no duplicados (constraint)
// ================================
async function createCliente(req, res) {
  try {
    const {
      rut,
      razon_social,
      giro,
      direccion_despacho,
      telefono,
      email,
      tipo_cliente, // 'PARTICULAR' o 'EMPRESA'
      estado,       // 'ACTIVO' o 'INACTIVO'
    } = req.body;

    // Validar campos obligatorios
    if (!rut || !razon_social || !email || !tipo_cliente || !estado) {
      return res.status(400).json({
        error:
          "Rut, razón social, email, tipo_cliente y estado son obligatorios",
      });
    }

    // Validar RUT (módulo 11)
    if (!validarRut(rut)) {
      return res.status(400).json({ error: "RUT inválido (módulo 11)" });
    }

    // Validar email
    if (!validarEmail(email)) {
      return res.status(400).json({ error: "Email inválido" });
    }

    // Validar tipo_cliente
    const tipoUpper = tipo_cliente.toUpperCase();
    if (tipoUpper !== "PARTICULAR" && tipoUpper !== "EMPRESA") {
      return res
        .status(400)
        .json({ error: "tipo_cliente debe ser 'PARTICULAR' o 'EMPRESA'" });
    }

    // Insertar cliente
    const sql = `
      INSERT INTO LPMFJCBC_CLIENTES (
        rut,
        razon_social,
        giro,
        direccion_despacho,
        telefono,
        email,
        tipo_cliente,
        estado
      ) VALUES (
        :rut,
        :razon_social,
        :giro,
        :direccion_despacho,
        :telefono,
        :email,
        :tipo_cliente,
        :estado
      )
      RETURNING id_cliente INTO :id_cliente
    `;

    const binds = {
      rut,
      razon_social,
      giro,
      direccion_despacho,
      telefono,
      email,
      tipo_cliente: tipoUpper,
      estado,
      id_cliente: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
    };

    const result = await execQuery(sql, binds, { autoCommit: true });

    res.status(201).json({
      mensaje: "Cliente creado con éxito",
      id_cliente: result.outBinds.id_cliente[0],
    });
  } catch (err) {
    console.error("Error createCliente:", err);

    // ORA-00001 → violación de UNIQUE (RUT o EMAIL)
    if (err.errorNum === 1) {
      return res
        .status(400)
        .json({ error: "RUT o Email ya existe en el sistema" });
    }

    res.status(500).json({ error: "Error al crear cliente" });
  }
}

// ================================
// PUT - actualizar cliente
// ================================
async function updateCliente(req, res) {
  try {
    const { id } = req.params;
    const {
      rut,
      razon_social,
      giro,
      direccion_despacho,
      telefono,
      email,
      tipo_cliente,
      estado,
    } = req.body;

    if (!rut || !razon_social || !email || !tipo_cliente || !estado) {
      return res.status(400).json({
        error:
          "Rut, razón social, email, tipo_cliente y estado son obligatorios",
      });
    }

    // Validar RUT
    if (!validarRut(rut)) {
      return res.status(400).json({ error: "RUT inválido" });
    }

    // Validar email
    if (!validarEmail(email)) {
      return res.status(400).json({ error: "Email inválido" });
    }

    const tipoUpper = tipo_cliente.toUpperCase();
    if (tipoUpper !== "PARTICULAR" && tipoUpper !== "EMPRESA") {
      return res
        .status(400)
        .json({ error: "tipo_cliente debe ser 'PARTICULAR' o 'EMPRESA'" });
    }

    const sql = `
      UPDATE LPMFJCBC_CLIENTES
      SET
        rut                = :rut,
        razon_social       = :razon_social,
        giro               = :giro,
        direccion_despacho = :direccion_despacho,
        telefono           = :telefono,
        email              = :email,
        tipo_cliente       = :tipo_cliente,
        estado             = :estado
      WHERE id_cliente = :id
    `;

    const result = await execQuery(
      sql,
      {
        id: Number(id),
        rut,
        razon_social,
        giro,
        direccion_despacho,
        telefono,
        email,
        tipo_cliente: tipoUpper,
        estado,
      },
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    res.json({ mensaje: "Cliente actualizado correctamente" });
  } catch (err) {
    console.error("Error updateCliente:", err);

    if (err.errorNum === 1) {
      return res
        .status(400)
        .json({ error: "RUT o Email ya existe en el sistema" });
    }

    res.status(500).json({ error: "Error al actualizar cliente" });
  }
}

// ================================
// PATCH - desactivar cliente (eliminación lógica)
// cambia estado a 'INACTIVO'
// ================================
async function desactivarCliente(req, res) {
  try {
    const { id } = req.params;

    const sql = `
      UPDATE LPMFJCBC_CLIENTES
      SET estado = 'INACTIVO'
      WHERE id_cliente = :id
    `;

    const result = await execQuery(
      sql,
      { id: Number(id) },
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    res.json({ mensaje: "Cliente desactivado (eliminación lógica)" });
  } catch (err) {
    console.error("Error desactivarCliente:", err);
    res.status(500).json({ error: "Error al desactivar cliente" });
  }
}

module.exports = {
  getClientes,
  getClienteById,
  createCliente,
  updateCliente,
  desactivarCliente,
};
