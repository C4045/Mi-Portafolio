-- Script de migración para MySQL / MariaDB
-- Ejecutar SOLO si ya tenés datos en la BD y querés actualizar las tablas

ALTER TABLE pedidos
  ADD COLUMN telefono VARCHAR(50) AFTER email,
  ADD COLUMN ciudad VARCHAR(100) AFTER direccion,
  ADD COLUMN notas TEXT AFTER ciudad,
  ADD COLUMN estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' AFTER notas;

ALTER TABLE pedido_items
  ADD COLUMN precio_unitario DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER cantidad;

ALTER TABLE productos
  ADD COLUMN detalles TEXT AFTER descripcion;
