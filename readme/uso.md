BACKEND - REQUISITOS FUNCIONALES Y JSON DE PRUEBA
==================================================

NOTA IMPORTANTE:
- Todos los endpoints van colgados de /api/... (ej: /api/auth/login, /api/usuarios, etc.)
- Donde dice (TOKEN) significa que debes enviar el JWT en el encabezado Authorization: Bearer <token>
- **CONTRASEÑA POR DEFECTO** para todos los usuarios de prueba: **admin123**
- Los roles usados:
    1 = ADMINISTRACIÓN (acceso total)
    2 = VENTAS (ventas y clientes)
    3 = BODEGA (inventario y stock)

USUARIOS DE PRUEBA:
--------------------------------------------------
| Email                      | Password  | Rol            |
|----------------------------|-----------|----------------|
| c.rojas@sistema.cl         | admin123  | ADMINISTRACIÓN |
| b.morales@sistema.cl       | admin123  | VENTAS         |
| m.gonzalez@sistema.cl      | admin123  | BODEGA         |
| l.munoz@sistema.cl         | admin123  | ADMINISTRACIÓN |
| ariela.perez@sistema.cl    | admin123  | VENTAS         |

--------------------------------------------------
1) LOGIN (Ingreso al sistema)
--------------------------------------------------
RF: El usuario (Admin, Ventas, Bodega) ingresa con email y contraseña.
Solo se permite acceso si el estado = 'ACTIVO'.

ENDPOINT:
  POST /api/auth/login

JSON REQUEST:
{
  "email": "c.rojas@sistema.cl",
  "password": "admin123"
}

RESPUESTA EXITOSA:
{
  "usuario": {
    "id_usuario": 1,
    "email": "c.rojas@sistema.cl",
    "nombres": "Camila",
    "apellidos": "Rojas Fuentes",
    "id_rol": 1,
    "estado": "ACTIVO"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

NOTA: Guarda el token, lo necesitarás para todas las siguientes peticiones.

--------------------------------------------------
2) GESTIÓN DE USUARIOS (Administrador)
--------------------------------------------------
RF: El Administrador crea, consulta, modifica y desactiva usuarios.
Campos: email, nombres, apellidos, rut, id_rol, estado.
La eliminación es lógica (estado = 'INACTIVO').

ROLES PERMITIDOS: [1]

a) Crear usuario
  POST /api/usuarios  (TOKEN)

JSON REQUEST:
{
  "email": "nuevo@empresa.com",
  "password": "clave123",
  "nombres": "Juan",
  "apellidos": "Pérez",
  "rut": "12345678-9",
  "id_rol": 2,
  "estado": "ACTIVO"
}

b) Listar usuarios
  GET /api/usuarios  (TOKEN)

c) Obtener usuario por id
  GET /api/usuarios/1  (TOKEN)

d) Actualizar usuario
  PUT /api/usuarios/1  (TOKEN)

JSON REQUEST:
{
  "email": "nuevo@empresa.com",
  "nombres": "Juan Modificado",
  "apellidos": "Pérez",
  "rut": "12345678-9",
  "id_rol": 3,
  "estado": "ACTIVO"
}

e) Desactivar usuario (eliminación lógica)
  PATCH /api/usuarios/1/desactivar  (TOKEN)

--------------------------------------------------
3) ASIGNACIÓN DE ROLES (Administrador)
--------------------------------------------------
RF: El Administrador asigna rol a un usuario.
Roles posibles: 1=Administración, 2=Ventas, 3=Bodega.

ENDPOINT:
  PATCH /api/usuarios/1/rol  (TOKEN)

JSON REQUEST:
{
  "id_rol": 2
}
--------------------------------------------------
4) GESTIÓN DE PRODUCTOS / CATÁLOGO (Administrador)
--------------------------------------------------
RF: El Administrador gestiona productos.
SKU debe ser único.

a) Crear producto
  POST /api/productos  (TOKEN)

JSON REQUEST:
{
  "sku": "PINT-001",
  "nombre": "Pintura Latex Blanca 5L",
  "descripcion": "Pintura blanca interior",
  "precio_unitario": 12990,
  "categoria": "Pinturas",
  "unidad_medida": "LITRO",
  "estado": "ACTIVO"
}

--------------------------------------------------
5) GESTIÓN DE CLIENTES (Admin / Ventas)
--------------------------------------------------
RF: El usuario de Ventas o Admin gestiona clientes.
Campos: rut, razon_social/nombre, giro, direccion_despacho, telefono, email, tipo_cliente.

ROLES PERMITIDOS: [1,2]

a) Crear cliente
  POST /api/clientes  (TOKEN)

JSON REQUEST:
{
  "rut": "11111111-1",
  "razon_social": "Cliente Prueba",
  "giro": "Comercio",
  "direccion_despacho": "Av. Siempre Viva 123",
  "telefono": "+56912345678",
  "email": "cliente@correo.com",
  "tipo_cliente": "PARTICULAR",
  "estado": "ACTIVO"
}

b) Listar / actualizar / etc. similar a usuarios.


-------------------------------------------------
6) GESTIÓN DE SUCURSALES (Administrador)
--------------------------------------------------
RF: El Administrador agrega/modifica sucursales.
No se puede eliminar una sucursal con stock_actual > 0.

a) Crear sucursal
  POST /api/sucursales  (TOKEN)

JSON REQUEST:
{
  "nombre": "Talca",
  "direccion": "Av. Central 100",
  "telefono": "712345678",
  "nombre_encargado": "Pedro Encargado",
  "estado": "ACTIVA"
}

--------------------------------------------------
7) REGISTRAR ENTRADA DE STOCK (Bodega/Admin)  [RF-7]
--------------------------------------------------
RF: El usuario de Bodega/Admin registra una entrada de stock.

ENDPOINT:
  POST /api/entradas-stock  (TOKEN)

JSON REQUEST:
{
  "id_producto": 1,
  "id_sucursal": 1,
  "cantidad": 50,
  "numero_lote": "L-2025-001",
  "fecha_vencimiento": "2026-12-31",
  "id_usuario": 64
}


--------------------------------------------------
8) ACTUALIZACIÓN DE STOCK EN LÍNEA 
--------------------------------------------------
RF: Al registrar entrada o venta, el sistema actualiza LPMFJCBC_STOCK_SUCURSAL.

- En entrada de stock:
  stock_actual = stock_actual + cantidad

- En venta/salida:
  stock_actual = stock_actual - cantidad

(No requiere JSON extra; se hace dentro de los controllers de entradas y ventas/salidas).

--------------------------------------------------
9) CONSULTAR STOCK EN LINEA
--------------------------------------------------
RF: El usuario (Ventas, Administración, Bodega) consulta el stock en línea de los productos en todas las sucursales

ENDPOINT:
  GET /api/stock-sucursal  (TOKEN)

--------------------------------------------------
10) FIFO / SUGERIR LOTE (Sistema)
--------------------------------------------------
RF: El sistema sugiere el lote a usar (más antiguo / más próximo a vencer).

Esto se hace consultando:
  LPMFJCBC_ENTRADAS_STOCK
ordenando por:
  fecha_vencimiento ASC, fecha_entrada ASC

No requiere JSON adicional; se usa internamente al registrar la venta.

--------------------------------------------------
11) DEFINIR PUNTO CRÍTICO (Administrador)  [RF-11]
--------------------------------------------------
RF: Admin define el punto crítico de reposición.

ENDPOINT:
  PATCH /api/stock-sucursal/punto-critico  (TOKEN)

JSON REQUEST:
{
  "id_producto": "1",
  "id_sucursal": "1",
  "punto_critico": "20"
}

--------------------------------------------------
12) ALERTA DE STOCK BAJO (Sistema)  [RF-12]
--------------------------------------------------
RF: El sistema genera alerta cuando stock_actual <= punto_critico.
Se crea registro en LPMFJCBC_ALERTAS_STOCK.

Esto ocurre automáticamente desde:
- entradas_stock_controller
- salidas_stock_controller
- mermas_controller

EJEMPLO DE ALERTA GENERADA:
{
  "id_alerta": 1,
  "id_producto": 1,
  "id_sucursal": 1,
  "stock_actual": 10,
  "punto_critico": 20,
  "atendida": 0
}

--------------------------------------------------
13) REGISTRAR MERMA (Bodega/Admin)
--------------------------------------------------
RF: Registrar merma, verificando que la cantidad no supere el stock.

ENDPOINT:
  POST /api/mermas  (TOKEN)

JSON REQUEST:
{
  "id_producto": 1,
  "id_sucursal": 1,
  "cantidad": 5,
  "motivo": "DANIADO",
  "observacion": "Se dañaron en transporte"
}

--------------------------------------------------
14 y 15) REGISTRAR VENTA + DETALLE + IVA (Vendedor/Admin)  [RF-14, RF-15]
--------------------------------------------------
RF: Registrar una venta con detalle, cálculo automático de IVA y total.

ENDPOINT:
  POST /api/ventas  (TOKEN)

JSON REQUEST:
{
  "id_cliente": 1,
  "id_sucursal_despacho": 1,
  "metodo_pago": "EFECTIVO",
  "detalle": [
    { "id_producto": 1, "cantidad": 2, "precio_unitario": 12990 },
    { "id_producto": 2, "cantidad": 1, "precio_unitario": 9990 }
  ]
}

El backend:
- calcula subtotal = sum(cantidad * precio_unitario)
- calcula iva usando la tasa parametrizada (ej: 19%)
- calcula total = subtotal + iva
- no permite modificar el IVA manualmente.

--------------------------------------------------
13) SALIDAS DE STOCK AUTOMÁTICAS POR VENTA (Sistema)
--------------------------------------------------
RF: Al registrar venta, el sistema descuenta stock y crea registros en LPMFJCBC_SALIDAS_STOCK.

Se ejecuta desde:
  registrarSalidasPorVenta({ id_venta, id_sucursal, items })

No requiere JSON extra (usa el detalle de la venta).


--------------------------------------------------
16) HISTÓRICO DE VENTAS CON FILTRO Y ROLES  [RF-16] 
--------------------------------------------------
RF: Admin ve todas las ventas; Vendedor solo las propias.

ROLES PERMITIDOS: [1,2]

ENDPOINT:
  GET /api/ventas  (TOKEN)

QUERY PARAMS (opcionales):
  ?fecha_desde=2025-01-01
  &fecha_hasta=2025-12-31
  &id_cliente=1
  &metodo_pago=EFECTIVO

RESPUESTA:
{
  "ventas": [
    {
      "id_venta": 1,
      "fecha_venta": "2025-12-01",
      "cliente": "Rodrigo Paredes Muñoz",
      "sucursal": "Sucursal Talca Centro",
      "metodo_pago": "EFECTIVO",
      "total": 18421.20,
      "estado": "EMITIDA"
    }
  ]
}

--------------------------------------------------
17) DASHBOARD DE VENTAS (Administrador)  [RF-17]
--------------------------------------------------
RF: Admin ve ventas diarias, mensuales y anuales consolidadas.

ENDPOINT:
  GET http://localhost:3000/api/dashboard-ventas/diarias?anio=2025&mes=12

  GET http://localhost:3000/api/dashboard-ventas/mensuales?anio=2025

  GET http://localhost:3000/api/dashboard-ventas/anuales


--------------------------------------------------
18) REPORTE CONSOLIDADO RF-18 (Admin)  [RF-18]
--------------------------------------------------
RF: Admin genera reporte consolidado por rango de fechas:
- Total ventas
- Unidades vendidas
- Ticket promedio
- Desglose por sucursal

ENDPOINT:
  http://localhost:3000/api/reportes/ventas-consolidadas?fecha_desde=2025-01-01&fecha_hasta=2025-12-31

--------------------------------------------------
19) EXPORTAR REPORTE (PDF / EXCEL)  [RF-19]
--------------------------------------------------
RF: El Admin exporta el reporte consolidado en PDF o Excel.
Se debe haber generado un reporte válido antes (mismo rango de fechas).

ENDPOINT:
  GET http://localhost:3000/api/reportes/ventas-exportar?fecha_desde=2025-01-01&fecha_hasta=2025-12-31&formato=excel  (TOKEN)


--------------------------------------------------
20) PRODUCTOS SIN MOVIMIENTO (Administrador)
--------------------------------------------------
RF: Admin obtiene informe de productos sin movimiento:
- stock_actual > 0
- días sin movimiento > umbral_dias (por defecto 90)

ENDPOINT:
  GET http://localhost:3000/api/reportes/productos-sin-movimiento?umbral_dias=90  (TOKEN)

--------------------------------------------------
21) ALERTAS DE STOCK
--------------------------------------------------
RF: Consultar y gestionar alertas de stock bajo.

a) Listar alertas pendientes
  GET /api/alertas-stock  (TOKEN)

b) Marcar alerta como atendida
  PATCH /api/alertas-stock/1/atender  (TOKEN)


==================================================
TIPS PARA POSTMAN / THUNDER CLIENT
==================================================

1. CONFIGURAR VARIABLES DE ENTORNO
--------------------------------------------------
Crea estas variables para facilitar las pruebas:

- base_url: http://localhost:3000/api
- token: (se llenará automáticamente después del login)

Uso: {{base_url}}/usuarios en lugar de http://localhost:3000/api/usuarios


2. GUARDAR TOKEN AUTOMÁTICAMENTE
--------------------------------------------------
En la petición de LOGIN, agrega este script en la pestaña "Tests" o "Post-response":

// Para Postman
pm.environment.set("token", pm.response.json().token);

// Ahora puedes usar {{token}} en el header Authorization


3. HEADERS COMUNES
--------------------------------------------------
Para todas las peticiones protegidas, agrega estos headers:

Authorization: Bearer {{token}}
Content-Type: application/json


4. COLECCIONES ORGANIZADAS
--------------------------------------------------
Organiza tus peticiones en carpetas:

📁 Autenticación
  - POST Login

📁 Usuarios (Admin)
  - GET Listar usuarios
  - POST Crear usuario
  - PUT Actualizar usuario
  - PATCH Desactivar usuario

📁 Productos (Admin)
  - GET Listar productos
  - POST Crear producto
  - PUT Actualizar producto

📁 Clientes (Admin/Ventas)
  - GET Listar clientes
  - POST Crear cliente

📁 Sucursales (Admin)
  - GET Listar sucursales
  - POST Crear sucursal

📁 Inventario (Bodega/Admin)
  - GET Consultar stock
  - POST Entrada de stock
  - POST Registrar merma
  - PATCH Definir punto crítico

📁 Ventas (Ventas/Admin)
  - GET Listar ventas
  - POST Registrar venta
  - GET Detalle de venta

📁 Dashboard (Admin)
  - GET Ventas diarias
  - GET Ventas mensuales
  - GET Ventas anuales

📁 Reportes (Admin)
  - GET Reporte consolidado
  - GET Exportar Excel
  - GET Exportar PDF
  - GET Productos sin movimiento

📁 Alertas (Todos)
  - GET Alertas pendientes
  - PATCH Atender alerta


5. EJEMPLOS RÁPIDOS DE PRUEBA
--------------------------------------------------

FLUJO COMPLETO DE PRUEBA:

1. Login con usuario admin
   POST {{base_url}}/auth/login

2. Crear un producto
   POST {{base_url}}/productos

3. Crear una sucursal (si no existe)
   POST {{base_url}}/sucursales

4. Registrar entrada de stock
   POST {{base_url}}/entradas-stock

5. Crear un cliente
   POST {{base_url}}/clientes

6. Registrar una venta
   POST {{base_url}}/ventas

7. Ver el dashboard
   GET {{base_url}}/dashboard-ventas/diarias?anio=2025&mes=12

8. Generar reporte
   GET {{base_url}}/reportes/ventas-consolidadas?fecha_desde=2025-12-01&fecha_hasta=2025-12-31

9. Exportar a Excel
   GET {{base_url}}/reportes/ventas-exportar?fecha_desde=2025-12-01&fecha_hasta=2025-12-31&formato=excel


==================================================
SOLUCIÓN DE PROBLEMAS COMUNES
==================================================

ERROR: "Token no proporcionado" o 401 Unauthorized
- Verifica que el header Authorization esté presente
- Formato correcto: Authorization: Bearer TU_TOKEN
- El token debe ser válido y no haber expirado

ERROR: "Acceso denegado. Rol no autorizado" o 403 Forbidden
- Verifica que el usuario tenga el rol correcto para ese endpoint
- Admin [1]: Acceso total
- Ventas [2]: Ventas, clientes
- Bodega [3]: Inventario, stock

ERROR: "Stock insuficiente"
- Verifica que haya stock disponible antes de hacer una venta
- Registra entrada de stock primero

ERROR: "SKU duplicado"
- El SKU del producto debe ser único
- Usa un SKU diferente

ERROR: "No se puede eliminar sucursal con stock"
- Las sucursales con stock > 0 no se pueden eliminar
- Primero debes vaciar el stock o transferirlo
