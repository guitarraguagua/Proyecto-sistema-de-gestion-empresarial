--------------------------------------------------------
-- TABLA LPMFJCBC_ROLES
--------------------------------------------------------
CREATE TABLE LPMFJCBC_ROLES (
  id_rol      NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre      VARCHAR2(50) NOT NULL,
  descripcion VARCHAR2(200),
  CONSTRAINT uq_roles_nombre UNIQUE (nombre)
);

--------------------------------------------------------
-- TABLA LPMFJCBC_USUARIOS
--------------------------------------------------------
CREATE TABLE LPMFJCBC_USUARIOS (
  id_usuario     NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email          VARCHAR2(100) NOT NULL,
  password_hash  VARCHAR2(255) NOT NULL,
  nombres        VARCHAR2(80) NOT NULL,
  apellidos      VARCHAR2(80) NOT NULL,
  rut            VARCHAR2(15) NOT NULL,
  id_rol         NUMBER NOT NULL,
  estado         VARCHAR2(10) NOT NULL,
  fecha_creacion DATE DEFAULT SYSDATE NOT NULL,
  CONSTRAINT uq_usuarios_email UNIQUE (email),
  CONSTRAINT uq_usuarios_rut   UNIQUE (rut),
  CONSTRAINT ck_usuarios_estado CHECK (estado IN ('ACTIVO','INACTIVO')),
  CONSTRAINT fk_usuarios_rol FOREIGN KEY (id_rol)
    REFERENCES LPMFJCBC_ROLES(id_rol)
);

--------------------------------------------------------
-- TABLA LPMFJCBC_CLIENTES
--------------------------------------------------------
CREATE TABLE LPMFJCBC_CLIENTES (
  id_cliente         NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  rut                VARCHAR2(15) NOT NULL,
  razon_social       VARCHAR2(120) NOT NULL,
  giro               VARCHAR2(120),
  direccion_despacho VARCHAR2(200),
  telefono           VARCHAR2(20),
  email              VARCHAR2(100) NOT NULL,
  tipo_cliente       VARCHAR2(15) NOT NULL,
  estado             VARCHAR2(10) NOT NULL,
  CONSTRAINT uq_clientes_rut   UNIQUE (rut),
  CONSTRAINT uq_clientes_email UNIQUE (email),
  CONSTRAINT ck_clientes_tipo   CHECK (tipo_cliente IN ('PARTICULAR','EMPRESA')),
  CONSTRAINT ck_clientes_estado CHECK (estado IN ('ACTIVO','INACTIVO'))
);

--------------------------------------------------------
-- TABLA LPMFJCBC_SUCURSALES
--------------------------------------------------------
CREATE TABLE LPMFJCBC_SUCURSALES (
  id_sucursal      NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre           VARCHAR2(80) NOT NULL,
  direccion        VARCHAR2(200) NOT NULL,
  telefono         VARCHAR2(20),
  nombre_encargado VARCHAR2(120),
  estado           VARCHAR2(10) NOT NULL,
  CONSTRAINT uq_sucursales_nombre UNIQUE (nombre),
  CONSTRAINT ck_sucursales_estado CHECK (estado IN ('ACTIVA','INACTIVA'))
);

--------------------------------------------------------
-- TABLA LPMFJCBC_PRODUCTOS
--------------------------------------------------------
CREATE TABLE LPMFJCBC_PRODUCTOS (
  id_producto     NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sku             VARCHAR2(50) NOT NULL,
  nombre          VARCHAR2(120) NOT NULL,
  descripcion     VARCHAR2(300),
  precio_unitario NUMBER(12,2) NOT NULL,
  categoria       VARCHAR2(80),
  unidad_medida   VARCHAR2(30),
  estado          VARCHAR2(10) NOT NULL,
  CONSTRAINT uq_productos_sku UNIQUE (sku),
  CONSTRAINT ck_productos_precio CHECK (precio_unitario >= 0),
  CONSTRAINT ck_productos_estado CHECK (estado IN ('ACTIVO','INACTIVO'))
);

--------------------------------------------------------
-- TABLA LPMFJCBC_STOCK_SUCURSAL
--------------------------------------------------------
CREATE TABLE LPMFJCBC_STOCK_SUCURSAL (
  id_stock      NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_producto   NUMBER NOT NULL,
  id_sucursal   NUMBER NOT NULL,
  stock_actual  NUMBER NOT NULL,
  punto_critico NUMBER NOT NULL,
  CONSTRAINT uq_stock_prod_suc UNIQUE (id_producto, id_sucursal),
  CONSTRAINT ck_stock_actual CHECK (stock_actual >= 0),
  CONSTRAINT ck_punto_critico CHECK (punto_critico >= 0),
  CONSTRAINT fk_stock_producto FOREIGN KEY (id_producto)
    REFERENCES LPMFJCBC_PRODUCTOS(id_producto),
  CONSTRAINT fk_stock_sucursal FOREIGN KEY (id_sucursal)
    REFERENCES LPMFJCBC_SUCURSALES(id_sucursal)
);

--------------------------------------------------------
-- TABLA LPMFJCBC_ENTRADAS_STOCK
--------------------------------------------------------
CREATE TABLE LPMFJCBC_ENTRADAS_STOCK (
  id_entrada       NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_producto      NUMBER NOT NULL,
  id_sucursal      NUMBER NOT NULL,
  cantidad         NUMBER NOT NULL,
  numero_lote      VARCHAR2(50),
  fecha_vencimiento DATE,
  fecha_entrada    DATE DEFAULT SYSDATE NOT NULL,
  id_usuario       NUMBER NOT NULL,
  CONSTRAINT ck_entradas_cantidad CHECK (cantidad > 0),
  CONSTRAINT fk_entradas_producto FOREIGN KEY (id_producto)
    REFERENCES LPMFJCBC_PRODUCTOS(id_producto),
  CONSTRAINT fk_entradas_sucursal FOREIGN KEY (id_sucursal)
    REFERENCES LPMFJCBC_SUCURSALES(id_sucursal),
  CONSTRAINT fk_entradas_usuario FOREIGN KEY (id_usuario)
    REFERENCES LPMFJCBC_USUARIOS(id_usuario)
);

--------------------------------------------------------
-- TABLA LPMFJCBC_MERMAS
--------------------------------------------------------
CREATE TABLE LPMFJCBC_MERMAS (
  id_merma     NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_producto  NUMBER NOT NULL,
  id_sucursal  NUMBER NOT NULL,
  cantidad     NUMBER NOT NULL,
  motivo       VARCHAR2(20) NOT NULL,
  observacion  VARCHAR2(200),
  fecha_merma  DATE DEFAULT SYSDATE NOT NULL,
  id_usuario   NUMBER NOT NULL,
  CONSTRAINT ck_mermas_cantidad CHECK (cantidad > 0),
  CONSTRAINT ck_mermas_motivo CHECK (motivo IN ('VENCIDO','DANIADO','ROBO','OTRO')),
  CONSTRAINT fk_mermas_producto FOREIGN KEY (id_producto)
    REFERENCES LPMFJCBC_PRODUCTOS(id_producto),
  CONSTRAINT fk_mermas_sucursal FOREIGN KEY (id_sucursal)
    REFERENCES LPMFJCBC_SUCURSALES(id_sucursal),
  CONSTRAINT fk_mermas_usuario FOREIGN KEY (id_usuario)
    REFERENCES LPMFJCBC_USUARIOS(id_usuario)
);

--------------------------------------------------------
-- TABLA LPMFJCBC_PARAMETROS_SISTEMA
--------------------------------------------------------
CREATE TABLE LPMFJCBC_PARAMETROS_SISTEMA (
  id_parametro   NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre         VARCHAR2(50) NOT NULL,
  valor_numerico NUMBER(10,4),
  valor_texto    VARCHAR2(200),
  activo         NUMBER(1) DEFAULT 1 NOT NULL,
  CONSTRAINT uq_parametros_nombre_activo UNIQUE (nombre, activo),
  CONSTRAINT ck_parametros_activo CHECK (activo IN (0,1))
);

--------------------------------------------------------
-- TABLA LPMFJCBC_VENTAS
--------------------------------------------------------
CREATE TABLE LPMFJCBC_VENTAS (
  id_venta             NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  fecha_venta          DATE DEFAULT SYSDATE NOT NULL,
  id_cliente           NUMBER NOT NULL,
  id_usuario_vendedor  NUMBER NOT NULL,
  id_sucursal_despacho NUMBER NOT NULL,
  metodo_pago          VARCHAR2(20) NOT NULL,
  subtotal             NUMBER(14,2) NOT NULL,
  iva                  NUMBER(14,2) NOT NULL,
  total                NUMBER(14,2) NOT NULL,
  estado               VARCHAR2(10) NOT NULL,
  CONSTRAINT ck_ventas_subtotal CHECK (subtotal >= 0),
  CONSTRAINT ck_ventas_iva      CHECK (iva >= 0),
  CONSTRAINT ck_ventas_total    CHECK (total >= 0),
  CONSTRAINT ck_ventas_estado CHECK (estado IN ('EMITIDA','ANULADA')),
  CONSTRAINT ck_ventas_metodo CHECK (metodo_pago IN ('EFECTIVO','TRANSFERENCIA','TARJETA_CREDITO','TARJETA_DEBITO')),
  CONSTRAINT fk_ventas_cliente FOREIGN KEY (id_cliente)
    REFERENCES LPMFJCBC_CLIENTES(id_cliente),
  CONSTRAINT fk_ventas_usuario FOREIGN KEY (id_usuario_vendedor)
    REFERENCES LPMFJCBC_USUARIOS(id_usuario),
  CONSTRAINT fk_ventas_sucursal FOREIGN KEY (id_sucursal_despacho)
    REFERENCES LPMFJCBC_SUCURSALES(id_sucursal)
);

--------------------------------------------------------
-- TABLA LPMFJCBC_DETALLE_VENTAS
--------------------------------------------------------
CREATE TABLE LPMFJCBC_DETALLE_VENTAS (
  id_detalle      NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_venta        NUMBER NOT NULL,
  id_producto     NUMBER NOT NULL,
  cantidad        NUMBER NOT NULL,
  precio_unitario NUMBER(12,2) NOT NULL,
  subtotal_linea  NUMBER(14,2) NOT NULL,
  CONSTRAINT ck_detalle_cantidad CHECK (cantidad > 0),
  CONSTRAINT ck_detalle_pu CHECK (precio_unitario >= 0),
  CONSTRAINT ck_detalle_subtotal CHECK (subtotal_linea >= 0),
  CONSTRAINT fk_detalle_venta FOREIGN KEY (id_venta)
    REFERENCES LPMFJCBC_VENTAS(id_venta),
  CONSTRAINT fk_detalle_producto FOREIGN KEY (id_producto)
    REFERENCES LPMFJCBC_PRODUCTOS(id_producto)
);

--------------------------------------------------------
-- TABLA LPMFJCBC_SALIDAS_STOCK
--------------------------------------------------------
CREATE TABLE LPMFJCBC_SALIDAS_STOCK (
  id_salida    NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_venta     NUMBER NOT NULL,
  id_producto  NUMBER NOT NULL,
  id_sucursal  NUMBER NOT NULL,
  cantidad     NUMBER NOT NULL,
  fecha_salida DATE DEFAULT SYSDATE NOT NULL,
  CONSTRAINT ck_salidas_cantidad CHECK (cantidad > 0),
  CONSTRAINT fk_salidas_venta FOREIGN KEY (id_venta)
    REFERENCES LPMFJCBC_VENTAS(id_venta),
  CONSTRAINT fk_salidas_producto FOREIGN KEY (id_producto)
    REFERENCES LPMFJCBC_PRODUCTOS(id_producto),
  CONSTRAINT fk_salidas_sucursal FOREIGN KEY (id_sucursal)
    REFERENCES LPMFJCBC_SUCURSALES(id_sucursal)
);

--------------------------------------------------------
-- TABLA LPMFJCBC_ALERTAS_STOCK
--------------------------------------------------------
CREATE TABLE LPMFJCBC_ALERTAS_STOCK (
  id_alerta     NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_producto   NUMBER NOT NULL,
  id_sucursal   NUMBER NOT NULL,
  stock_actual  NUMBER NOT NULL,
  punto_critico NUMBER NOT NULL,
  fecha_alerta  DATE DEFAULT SYSDATE NOT NULL,
  atendida      NUMBER(1) DEFAULT 0 NOT NULL,
  CONSTRAINT ck_alertas_stock CHECK (stock_actual >= 0),
  CONSTRAINT ck_alertas_pc CHECK (punto_critico >= 0),
  CONSTRAINT ck_alertas_atendida CHECK (atendida IN (0,1)),
  CONSTRAINT fk_alertas_producto FOREIGN KEY (id_producto)
    REFERENCES LPMFJCBC_PRODUCTOS(id_producto),
  CONSTRAINT fk_alertas_sucursal FOREIGN KEY (id_sucursal)
    REFERENCES LPMFJCBC_SUCURSALES(id_sucursal)
);
