DROP TABLE IF EXISTS `pedido_items`;
DROP TABLE IF EXISTS `pedidos`;
DROP TABLE IF EXISTS `productos`;
DROP TABLE IF EXISTS `contactos`;
DROP TABLE IF EXISTS `clientes`;

CREATE TABLE `productos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `detalles` text DEFAULT NULL,
  `precio` decimal(10,2) NOT NULL,
  `stock` int(11) DEFAULT 10,
  `imagen` varchar(255) DEFAULT NULL,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `productos` (`id`, `nombre`, `descripcion`, `detalles`, `precio`, `stock`, `imagen`, `fecha_creacion`) VALUES (1, 'Laptop HP Pavilion', 'Laptop HP Pavilion 15.6" con Ryzen 5, 8GB RAM, 256GB SSD', '', 850000.00, 10, 'prod_6a3e741406019.jpg', '2026-06-25 19:22:56');
INSERT INTO `productos` (`id`, `nombre`, `descripcion`, `detalles`, `precio`, `stock`, `imagen`, `fecha_creacion`) VALUES (2, 'Smartphone Samsung Galaxy', 'Samsung Galaxy A54 5G 128GB, pantalla Super AMOLED 6.4"', '', 650000.00, 15, 'prod_6a3e740b5558d.jpg', '2026-06-25 19:22:56');
INSERT INTO `productos` (`id`, `nombre`, `descripcion`, `detalles`, `precio`, `stock`, `imagen`, `fecha_creacion`) VALUES (3, 'Auriculares Bluetooth', 'Auriculares inalámbricos Sony WH-1000XM5 con cancelación de ruido', '', 350000.00, 3, 'prod_6a3e73fdf3b45.jpg', '2026-06-25 19:22:56');
INSERT INTO `productos` (`id`, `nombre`, `descripcion`, `detalles`, `precio`, `stock`, `imagen`, `fecha_creacion`) VALUES (4, 'Teclado Mecánico', 'Teclado mecánico Redragon Kumara K552 RGB switches red', '', 85000.00, 19, 'prod_6a3dbe3c630a1.jpg', '2026-06-25 19:22:56');
INSERT INTO `productos` (`id`, `nombre`, `descripcion`, `detalles`, `precio`, `stock`, `imagen`, `fecha_creacion`) VALUES (5, 'Mouse Gamer', 'Mouse Logitech G203 Lightsync RGB 8000 DPI', '', 45000.00, 25, 'prod_6a3dba1715776.jpg', '2026-06-25 19:22:56');
INSERT INTO `productos` (`id`, `nombre`, `descripcion`, `detalles`, `precio`, `stock`, `imagen`, `fecha_creacion`) VALUES (6, 'Monitor 24"', 'Monitor LG 24MK400H-B 24" LED HD IPS 75Hz', '⚙️ Especificaciones Técnicas - LG 24MK400H-B\r\nCategoría	Especificación\r\nMarca	LG \r\nModelo	24MK400H-B \r\nTamaño de Pantalla	23.8" - 24" (Clase) \r\nResolución	Full HD (1920 x 1080) \r\nRelación de Aspecto	16:9 \r\nTipo de Panel	TN (Twisted Nematic) \r\nTiempo de Respuesta	1ms (GTG en modo Faster) \r\nFrecuencia de Refresco	75Hz \r\nBrillo	250 cd/m² (Típico) \r\nContraste	1000:1 (Típico) \r\nÁngulo de Visión	170° Horizontal / 160° Vertical \r\nColores	16.7 Millones \r\nGama de Color	NTSC 72% \r\nConectividad\r\nCategoría	Especificación\r\nEntrada de Video	1x HDMI, 1x VGA (D-Sub) \r\nSalida de Audio	1x Jack para Auriculares (3.5mm) \r\nCaracterísticas Especiales	AMD FreeSync™, Estabilizador de Negros, Dynamic Action Sync, Modo Lector, OnScreen Control, Antiparpadeo (Flicker Safe) \r\nDimensiones y Montaje\r\nCategoría	Especificación\r\nDimensiones (con Soporte)	55.5 x 42.05 x 18.19 cm \r\nDimensiones (sin Soporte)	55.5 x 33.09 x 3.84 cm \r\nPeso (con Soporte)	2.8 kg \r\nPeso (sin Soporte)	2.5 kg \r\nMontaje VESA	75 x 75 mm \r\nAjuste de Inclinación	-5º a 20º \r\nConsumo de Energía\r\nCategoría	Especificación\r\nTipo de Fuente	Adaptador Externo \r\nConsumo Máximo	30W \r\nConsumo Típico	26W \r\nConsumo en Espera	< 0.3W', 1000000.00, 6, 'prod_6a3dbe29deeb7.jpg', '2026-06-25 19:22:56');

CREATE TABLE `pedidos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre_cliente` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `telefono` varchar(50) DEFAULT NULL,
  `direccion` text NOT NULL,
  `ciudad` varchar(100) DEFAULT NULL,
  `notas` text DEFAULT NULL,
  `estado` enum('pendiente','procesando','enviado','entregado','cancelado') DEFAULT 'pendiente',
  `total` decimal(10,2) NOT NULL,
  `fecha_pedido` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `pedido_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `pedido_id` int(11) DEFAULT NULL,
  `producto_id` int(11) DEFAULT NULL,
  `cantidad` int(11) NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL DEFAULT 0.00,
  `subtotal` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `pedido_id` (`pedido_id`),
  KEY `producto_id` (`producto_id`),
  CONSTRAINT `pedido_items_ibfk_1` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos` (`id`),
  CONSTRAINT `pedido_items_ibfk_2` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `contactos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `telefono` varchar(50) DEFAULT NULL,
  `asunto` varchar(255) DEFAULT NULL,
  `mensaje` text NOT NULL,
  `leido` tinyint(1) DEFAULT 0,
  `fecha` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `clientes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `telefono` varchar(50) DEFAULT NULL,
  `verificado` tinyint(1) DEFAULT 0,
  `foto` varchar(255) DEFAULT NULL,
  `codigo_verificacion` varchar(10) DEFAULT NULL,
  `codigo_expiracion` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `clientes` (`id`, `email`, `password`, `nombre`, `telefono`, `verificado`, `foto`, `codigo_verificacion`, `codigo_expiracion`, `created_at`) VALUES (1, 'celsox122x@gmail.com', '$2y$10$Srwd5TR04spiBW3O1hCeaODgXGNlhrMgOmLeXDDR6Dp7GIkopKDpO', 'Celso Javier Romero Paiva', '', 1, 'cliente_1.jpg', NULL, NULL, '2026-06-26 11:22:31');
