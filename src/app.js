// src/app.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { initOracle, closeOracle } = require("./db");
const usuariosRoutes = require("./routes/usuarios_routes"); // 👈 con guion bajo
const sucursalesRoutes = require("./routes/sucursales_routes");
const productosRoutes = require("./routes/productos_routes");
const stockSucursalRoutes = require("./routes/stock_sucursal_routes");
const entradasStockRoutes = require("./routes/entradas_stock_routes");
const mermasRoutes = require("./routes/mermas_routes");
const parametrosRoutes = require("./routes/parametros_routes");
const ventasRoutes = require("./routes/ventas_routes");
const detalleVentasRoutes = require("./routes/detalle_ventas_routes");
const salidasStockRoutes = require("./routes/salidas_stock_routes");
const alertasStockRoutes = require("./routes/alertas_stock_routes");
const rolesRoutes = require("./routes/roles_routes");
const authMiddleware = require("./middlewares/auth_middlewares");
const authRoutes = require("./routes/auth_routes");
const dashboardVentasRoutes = require("./routes/dashboard_ventas_routes");
const reportesRoutes = require("./routes/reportes_routes");
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Ruta base para probar rápido
app.get("/", (req, res) => {
  res.send("Backend funcionando ✅");
});

// Rutas de API
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/clientes", require("./routes/clientes_routes"));
app.use("/api/sucursales", sucursalesRoutes);
app.use("/api/productos", productosRoutes);
app.use("/api/stock-sucursal", stockSucursalRoutes);
app.use("/api/entradas-stock", entradasStockRoutes);
app.use("/api/mermas", mermasRoutes);
app.use("/api/parametros", parametrosRoutes);
app.use("/api/ventas", ventasRoutes);
app.use("/api/detalle-ventas", detalleVentasRoutes);
app.use("/api/salidas-stock", salidasStockRoutes);
app.use("/api/alertas-stock", alertasStockRoutes);
app.use("/api/roles", rolesRoutes); 
app.use("/api/auth", authRoutes);
app.use("/api/dashboard-ventas", dashboardVentasRoutes);
app.use("/api/reportes", reportesRoutes);

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    console.log("Iniciando pool de Oracle...");
    await initOracle(); // 👈 función que viene de db.js
    app.listen(PORT, () => {
      console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ No se pudo iniciar el servidor:", err);
    process.exit(1);
  }
}

// Cerrar pool al apagar
process.on("SIGINT", async () => {
  console.log("Cerrando servidor...");
  await closeOracle();
  process.exit(0);
});

// Iniciar
start();
