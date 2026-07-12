-- =====================================================
-- TIENDA ONLINE - Script SQL Completo
-- =====================================================

CREATE DATABASE IF NOT EXISTS tienda_online CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE tienda_online;

-- Tabla de productos
CREATE TABLE IF NOT EXISTS productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    detalles TEXT,
    precio DECIMAL(10,2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    imagen VARCHAR(255),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_nombre (nombre),
    INDEX idx_precio (precio),
    INDEX idx_stock (stock)
);

-- Tabla de pedidos (MEJORADA: agrega teléfono, ciudad, notas, estado)
CREATE TABLE IF NOT EXISTS pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_cliente VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    telefono VARCHAR(50),
    direccion TEXT NOT NULL,
    ciudad VARCHAR(100),
    notas TEXT,
    total DECIMAL(10,2) NOT NULL,
    estado ENUM('pendiente','procesando','enviado','entregado','cancelado') DEFAULT 'pendiente',
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_estado (estado)
);

-- Tabla de items de pedido
CREATE TABLE IF NOT EXISTS pedido_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL DEFAULT 0,
    subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE RESTRICT
);

-- Datos de ejemplo
INSERT INTO productos (nombre, descripcion, precio, stock, imagen) VALUES
('Laptop HP Pavilion', 'Laptop HP Pavilion 15.6" con Ryzen 5, 8GB RAM, 256GB SSD', 850000, 10, NULL),
('Smartphone Samsung Galaxy', 'Samsung Galaxy A54 5G 128GB, pantalla Super AMOLED 6.4"', 650000, 15, NULL),
('Auriculares Bluetooth', 'Auriculares inalámbricos Sony WH-1000XM5 con cancelación de ruido', 350000, 3, NULL),
('Teclado Mecánico', 'Teclado mecánico Redragon Kumara K552 RGB switches red', 85000, 20, NULL),
('Mouse Gamer', 'Mouse Logitech G203 Lightsync RGB 8000 DPI', 45000, 25, NULL),
('Monitor 24"', 'Monitor LG 24MK400H-B 24" LED HD IPS 75Hz', 280000, 12, NULL);
