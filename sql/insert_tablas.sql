-- INSERT PARA CALCULAR IVA AUTMATICAMENTE --
INSERT INTO LPMFJCBC_PARAMETROS_SISTEMA (nombre, valor_numerico, activo)
VALUES ('IVA', 0.19, 1);

-- INSERT DE LOS ROLES --
INSERT INTO LPMFJCBC_ROLES (nombre, descripcion)
VALUES ('ADMINISTRACION', 'Acceso total al sistema');

INSERT INTO LPMFJCBC_ROLES (nombre, descripcion)
VALUES ('VENTAS', 'Gestión de clientes y ventas');

INSERT INTO LPMFJCBC_ROLES (nombre, descripcion)
VALUES ('BODEGA', 'Gestión de stock, entradas y mermas');

-- INSERT DE USUARIOS --  --IMPORTANTE ANTES DE INGRESAR EL USUARIO, SE DEBE GENERAR LA CONTRASEÑA CON EL SCRIPT generarHASH.JS--
INSERT INTO LPMFJCBC_USUARIOS (email, password_hash, nombres, apellidos, rut, id_rol, estado)
    VALUES ('c.rojas@sistema.cl','$2b$10$Tabps8yd2OtRci7azYAl1O2HXsd3JdHNpU9RApuvVlno3XOkfFAPy', 'Camila','Rojas Fuentes','17654321-6',1,'ACTIVO');

INSERT INTO LPMFJCBC_USUARIOS (email, password_hash, nombres, apellidos, rut, id_rol, estado) 
    VALUES ('b.morales@sistema.cl','$2b$10$Tabps8yd2OtRci7azYAl1O2HXsd3JdHNpU9RApuvVlno3XOkfFAPy', 'Benjamín','Morales Yáñez','20456789-3',2,'ACTIVO');

INSERT INTO LPMFJCBC_USUARIOS (email, password_hash, nombres, apellidos, rut, id_rol, estado) 
    VALUES ('m.gonzalez@sistema.cl','$2b$10$Tabps8yd2OtRci7azYAl1O2HXsd3JdHNpU9RApuvVlno3XOkfFAPy', 'Marcela','González Torres','15234567-K',3,'ACTIVO');

INSERT INTO LPMFJCBC_USUARIOS (email, password_hash, nombres, apellidos, rut, id_rol, estado) 
    VALUES ('l.munoz@sistema.cl','$2b$10$Tabps8yd2OtRci7azYAl1O2HXsd3JdHNpU9RApuvVlno3XOkfFAPy', 'Lucas','Muñoz Salazar','18987654-2',1,'ACTIVO');

INSERT INTO LPMFJCBC_USUARIOS (email, password_hash, nombres, apellidos, rut, id_rol, estado) 
    VALUES ('ariela.perez@sistema.cl','$2b$10$Tabps8yd2OtRci7azYAl1O2HXsd3JdHNpU9RApuvVlno3XOkfFAPy', 'Ariela','Pérez Andrade','23123456-4',2,'ACTIVO');

--INSERT CLIENTES--
INSERT INTO LPMFJCBC_CLIENTES (rut, razon_social, giro, direccion_despacho, telefono, email, tipo_cliente, estado)
VALUES ('9012345-9','Rodrigo Paredes Muñoz',NULL,'Pasaje Los Copihues 123, Talca','+56 9 8123 4501','rodrigo.paredes@cliente.cl','PARTICULAR','ACTIVO');

INSERT INTO LPMFJCBC_CLIENTES (rut, razon_social, giro, direccion_despacho, telefono, email, tipo_cliente, estado)
VALUES ('9123456-4','Panadería El Trigal Ltda','Elaboración y venta de pan','Av. 2 Norte 450, Talca','+56 9 9345 6721','contacto@eltrigal.cl','EMPRESA','ACTIVO');

INSERT INTO LPMFJCBC_CLIENTES (rut, razon_social, giro, direccion_despacho, telefono, email, tipo_cliente, estado)
VALUES ('9234567-K','Natalia Arancibia Fuentes',NULL,'Villa Las Araucarias 56, Curicó','+56 9 7223 1189','natalia.arancibia@correo.cl','PARTICULAR','ACTIVO');

INSERT INTO LPMFJCBC_CLIENTES (rut, razon_social, giro, direccion_despacho, telefono, email, tipo_cliente, estado)
VALUES ('9345678-5','Ferretería Paredes y Cía.','Venta de materiales de construcción','Camino San Miguel 2340, Talca','+56 9 9456 7812','ventas@ferreteriaparedes.cl','EMPRESA','ACTIVO');

INSERT INTO LPMFJCBC_CLIENTES (rut, razon_social, giro, direccion_despacho, telefono, email, tipo_cliente, estado)
VALUES ('9456789-0','Soledad Inostroza Riquelme',NULL,'Los Castaños 890, Linares','+56 9 8012 3498','soledad.inostroza@mail.cl','PARTICULAR','ACTIVO');

-- INSERT SUCURSALES --
INSERT INTO LPMFJCBC_SUCURSALES (nombre, direccion, telefono, nombre_encargado, estado)
VALUES ('Sucursal Talca Centro',
        'Av. 1 Sur 1234, Talca, Región del Maule',
        '+56 71 223 4455',
        'María José Cartes López',
        'ACTIVA');

-- INSERT PRODUCTOS --
INSERT INTO LPMFJCBC_PRODUCTOS (sku, nombre, descripcion, precio_unitario, categoria, unidad_medida, estado)
VALUES ('PRO-001','Clavos 2”',
        'Clavos galvanizados de 2 pulgadas, resistentes a la corrosión.',
        1990,'Ferretería','Caja 100 unid','ACTIVO');

INSERT INTO LPMFJCBC_PRODUCTOS (sku, nombre, descripcion, precio_unitario, categoria, unidad_medida, estado)
VALUES ('PRO-002','Martillo Carpintero 16 oz',
        'Martillo de acero con mango ergonómico de goma.',
        7490,'Ferretería','Unidad','ACTIVO');

INSERT INTO LPMFJCBC_PRODUCTOS (sku, nombre, descripcion, precio_unitario, categoria, unidad_medida, estado)
VALUES ('PRO-003','Taladro Eléctrico 600W',
        'Taladro percutor 600W con control de velocidad.',
        38990,'Herramientas','Unidad','ACTIVO');

INSERT INTO LPMFJCBC_PRODUCTOS (sku, nombre, descripcion, precio_unitario, categoria, unidad_medida, estado)
VALUES ('PRO-004','Pintura Látex Interior 1 galón',
        'Pintura blanca para interiores, acabado mate, secado rápido.',
        12990,'Pinturas','Galón','ACTIVO');

INSERT INTO LPMFJCBC_PRODUCTOS (sku, nombre, descripcion, precio_unitario, categoria, unidad_medida, estado)
VALUES ('PRO-005','Brocha 2.5” Profesional',
        'Brocha sintética de alta calidad para pinturas base agua.',
        2490,'Pinturas','Unidad','ACTIVO');


--INSERT PRODUCTOS--
INSERT INTO LPMFJCBC_STOCK_SUCURSAL (id_producto, id_sucursal, stock_actual, punto_critico)
VALUES (1, 1, 150, 30);

INSERT INTO LPMFJCBC_STOCK_SUCURSAL (id_producto, id_sucursal, stock_actual, punto_critico)
VALUES (2, 1, 60, 15);

INSERT INTO LPMFJCBC_STOCK_SUCURSAL (id_producto, id_sucursal, stock_actual, punto_critico)
VALUES (3, 1, 25, 5);

INSERT INTO LPMFJCBC_STOCK_SUCURSAL (id_producto, id_sucursal, stock_actual, punto_critico)
VALUES (4, 1, 40, 10);

INSERT INTO LPMFJCBC_STOCK_SUCURSAL (id_producto, id_sucursal, stock_actual, punto_critico)
VALUES (5, 1, 70, 20);

--INSERT ENTRADAS-STOCK --
INSERT INTO LPMFJCBC_ENTRADAS_STOCK (id_producto, id_sucursal, cantidad, numero_lote, fecha_vencimiento, id_usuario)
VALUES (1, 1, 300, 'L-NAIL-001', NULL, 1);

INSERT INTO LPMFJCBC_ENTRADAS_STOCK (id_producto, id_sucursal, cantidad, numero_lote, fecha_vencimiento, id_usuario)
VALUES (2, 1, 80, 'L-MART-045', NULL, 2);

INSERT INTO LPMFJCBC_ENTRADAS_STOCK (id_producto, id_sucursal, cantidad, numero_lote, fecha_vencimiento, id_usuario)
VALUES (3, 1, 40, 'L-TALD-230', NULL, 3);

INSERT INTO LPMFJCBC_ENTRADAS_STOCK (id_producto, id_sucursal, cantidad, numero_lote, fecha_vencimiento, id_usuario)
VALUES (4, 1, 55, 'L-PINTB-155', DATE '2026-12-31', 4);

INSERT INTO LPMFJCBC_ENTRADAS_STOCK (id_producto, id_sucursal, cantidad, numero_lote, fecha_vencimiento, id_usuario)
VALUES (5, 1, 120, 'L-BRCH-019', NULL, 5);

-- INSERT VENTAS DE EJEMPLO --
INSERT INTO LPMFJCBC_VENTAS (id_cliente, id_usuario, id_sucursal_despacho, fecha_venta, metodo_pago, subtotal, iva, total, estado)
VALUES (1, 2, 1, TO_DATE('2025-12-01', 'YYYY-MM-DD'), 'EFECTIVO', 15480, 2941.20, 18421.20, 'EMITIDA');

INSERT INTO LPMFJCBC_VENTAS (id_cliente, id_usuario, id_sucursal_despacho, fecha_venta, metodo_pago, subtotal, iva, total, estado)
VALUES (2, 2, 1, TO_DATE('2025-12-03', 'YYYY-MM-DD'), 'TARJETA', 38990, 7408.10, 46398.10, 'EMITIDA');

INSERT INTO LPMFJCBC_VENTAS (id_cliente, id_usuario, id_sucursal_despacho, fecha_venta, metodo_pago, subtotal, iva, total, estado)
VALUES (3, 5, 1, TO_DATE('2025-12-05', 'YYYY-MM-DD'), 'TRANSFERENCIA', 25960, 4932.40, 30892.40, 'EMITIDA');

-- INSERT DETALLE VENTAS --
-- Detalle para Venta 1 (Clavos + Brocha)
INSERT INTO LPMFJCBC_DETALLE_VENTAS (id_venta, id_producto, cantidad, precio_unitario, subtotal)
VALUES (1, 1, 5, 1990, 9950);

INSERT INTO LPMFJCBC_DETALLE_VENTAS (id_venta, id_producto, cantidad, precio_unitario, subtotal)
VALUES (1, 5, 2, 2490, 4980);

-- Detalle para Venta 2 (Taladro)
INSERT INTO LPMFJCBC_DETALLE_VENTAS (id_venta, id_producto, cantidad, precio_unitario, subtotal)
VALUES (2, 3, 1, 38990, 38990);

-- Detalle para Venta 3 (Pintura + Martillo)
INSERT INTO LPMFJCBC_DETALLE_VENTAS (id_venta, id_producto, cantidad, precio_unitario, subtotal)
VALUES (3, 4, 1, 12990, 12990);

INSERT INTO LPMFJCBC_DETALLE_VENTAS (id_venta, id_producto, cantidad, precio_unitario, subtotal)
VALUES (3, 2, 1, 7490, 7490);

-- INSERT SALIDAS DE STOCK (por las ventas anteriores) --
INSERT INTO LPMFJCBC_SALIDAS_STOCK (id_producto, id_sucursal, cantidad, motivo, id_venta)
VALUES (1, 1, 5, 'VENTA', 1);

INSERT INTO LPMFJCBC_SALIDAS_STOCK (id_producto, id_sucursal, cantidad, motivo, id_venta)
VALUES (5, 1, 2, 'VENTA', 1);

INSERT INTO LPMFJCBC_SALIDAS_STOCK (id_producto, id_sucursal, cantidad, motivo, id_venta)
VALUES (3, 1, 1, 'VENTA', 2);

INSERT INTO LPMFJCBC_SALIDAS_STOCK (id_producto, id_sucursal, cantidad, motivo, id_venta)
VALUES (4, 1, 1, 'VENTA', 3);

INSERT INTO LPMFJCBC_SALIDAS_STOCK (id_producto, id_sucursal, cantidad, motivo, id_venta)
VALUES (2, 1, 1, 'VENTA', 3);

COMMIT;
