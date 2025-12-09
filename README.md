# Sistema de Gestión Empresarial

Sistema completo de gestión de inventario, ventas y reportes desarrollado con Node.js y Oracle Database.

## 📋 Descripción

Sistema backend que permite la administración integral de:
- **Inventario**: Control de stock por sucursal con alertas automáticas
- **Ventas**: Registro de ventas con múltiples métodos de pago
- **Reportes**: Dashboard y exportación de datos en Excel/PDF
- **Usuarios**: Gestión de roles (Administración, Ventas, Bodega)
- **FIFO**: Sistema automático de rotación de inventario

## 🚀 Tecnologías

- **Node.js** + **Express** - Framework del servidor
- **Oracle Database** (XE/Enterprise) - Base de datos
- **JWT** - Autenticación y autorización
- **bcrypt** - Encriptación de contraseñas
- **ExcelJS** - Exportación de reportes a Excel
- **PDFKit** - Generación de reportes PDF

## 📦 Requisitos Previos

- Node.js >= 16.x
- Oracle Database XE 21c o superior
- Oracle Instant Client (para `oracledb`)
- SQL Developer (recomendado para gestión de BD)

## 🔧 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/guitarraguagua/Proyecto-sistema-de-gestion-empresarial.git
cd Proyecto-sistema-de-gestion-empresarial
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crear un archivo `.env` en la raíz del proyecto:

```env
# Base de datos Oracle
DB_USER=system
DB_PASSWORD=tu_password
DB_CONNECT_STRING=localhost:1521/XEPDB1

# Servidor
PORT=3000

# JWT Secret
JWT_SECRET=tu_clave_secreta_muy_segura

# Entorno
NODE_ENV=development
```

### 4. Crear base de datos

Ejecutar los scripts SQL en Oracle (en orden):

1. `sql/crear_tablas.sql` - Crea todas las tablas
2. `sql/insert_tablas.sql` - Inserta datos iniciales

### 5. Iniciar el servidor

```bash
cd src
node app.js
```

El servidor estará disponible en `http://localhost:3000`

## 📚 Documentación de API

La documentación completa de endpoints, roles y ejemplos JSON se encuentra en:

📄 **[readme/uso.md](readme/uso.md)**

### Endpoints principales

```
POST   /api/auth/login              - Inicio de sesión
GET    /api/usuarios                - Listar usuarios
POST   /api/productos               - Crear producto
POST   /api/ventas                  - Registrar venta
GET    /api/stock-sucursal          - Consultar stock
GET    /api/reportes/ventas-consolidadas - Reporte de ventas
```

## 👥 Roles del Sistema

| ID | Rol | Permisos |
|----|-----|----------|
| 1 | **Administración** | Acceso total al sistema |
| 2 | **Ventas** | Gestión de ventas y clientes |
| 3 | **Bodega** | Control de inventario y stock |

## 🗂️ Estructura del Proyecto

```
BACKEND/
├── src/
│   ├── app.js                      # Punto de entrada
│   ├── db.js                       # Configuración Oracle
│   ├── controllers/                # Lógica de negocio
│   ├── routes/                     # Definición de rutas
│   └── middlewares/                # Autenticación y permisos
├── sql/
│   ├── crear_tablas.sql           # DDL de tablas
│   └── insert_tablas.sql          # Datos iniciales
├── readme/
│   └── uso.md                     # Documentación API
└── package.json
```

## 🔐 Autenticación

Todas las rutas protegidas requieren un token JWT en el header:

```
Authorization: Bearer <token>
```

El token se obtiene al hacer login exitosamente.

## 📊 Características Principales

### Control de Inventario
- ✅ Stock en tiempo real por sucursal
- ✅ Alertas automáticas de stock bajo
- ✅ Sistema FIFO para rotación de inventario
- ✅ Registro de entradas, salidas y mermas

### Gestión de Ventas
- ✅ Registro de ventas con múltiples productos
- ✅ Cálculo automático de IVA
- ✅ Métodos de pago: Efectivo, Tarjeta, Transferencia
- ✅ Histórico de ventas con filtros

### Reportes y Dashboard
- ✅ Dashboard con métricas diarias, mensuales y anuales
- ✅ Reportes consolidados por sucursal
- ✅ Exportación a Excel y PDF
- ✅ Análisis de productos sin movimiento

## 🛡️ Seguridad

- Contraseñas encriptadas con bcrypt
- Tokens JWT con expiración
- Validación de roles por endpoint
- Variables sensibles en archivo `.env` (no versionado)

## 👨‍💻 Autores

Ver archivo [integrantes/integrantes.txt](integrantes/integrantes.txt)

## 📝 Licencia

ISC

## 🆘 Soporte

Para reportar problemas o solicitar nuevas funcionalidades, abrir un issue en GitHub.

---

**Desarrollado como proyecto de Sistema de Gestión Empresarial**