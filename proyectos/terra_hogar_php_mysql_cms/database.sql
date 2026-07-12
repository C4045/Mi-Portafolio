-- Terra & Hogar - Esquema + Datos
SET NAMES utf8mb4;

DROP TABLE IF EXISTS `propiedades_i18n`;
DROP TABLE IF EXISTS `login_attempts`;
DROP TABLE IF EXISTS `propiedad_fotos`;
DROP TABLE IF EXISTS `propiedades`;
DROP TABLE IF EXISTS `contenido`;
DROP TABLE IF EXISTS `contactos`;
DROP TABLE IF EXISTS `admins`;

CREATE TABLE `admins` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(60) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `login_attempts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ip` varchar(45) NOT NULL,
  `attempted_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_ip_time` (`ip`, `attempted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `contactos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(120) DEFAULT NULL,
  `telefono` varchar(50) DEFAULT NULL,
  `mensaje` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `contenido` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `clave` varchar(100) DEFAULT NULL,
  `valor` longtext DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_clave` (`clave`)
) ENGINE=InnoDB AUTO_INCREMENT=59 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `propiedades` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `titulo` varchar(255) DEFAULT NULL,
  `precio_usd` decimal(12,2) DEFAULT NULL,
  `dormitorios` int(11) DEFAULT 0,
  `banos` int(11) DEFAULT 0,
  `metros` int(11) DEFAULT 0,
  `lote` varchar(100) DEFAULT '',
  `uso_suelo` varchar(100) DEFAULT '',
  `impuestos` varchar(200) DEFAULT '',
  `titulacion` varchar(100) DEFAULT '',
  `amenidades` text DEFAULT NULL,
  `tipo` varchar(20) DEFAULT 'venta',
  `categoria` varchar(50) DEFAULT 'casa',
  `ubicacion` varchar(255) DEFAULT '',
  `ubicacion_exacta` varchar(500) DEFAULT '',
  `imagen` varchar(255) DEFAULT NULL,
  `descripcion` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `propiedad_fotos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `propiedad_id` int(11) NOT NULL,
  `url` varchar(500) NOT NULL,
  `orden` int(11) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `propiedad_id` (`propiedad_id`),
  CONSTRAINT `propiedad_fotos_ibfk_1` FOREIGN KEY (`propiedad_id`) REFERENCES `propiedades` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `propiedades_i18n` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `propiedad_id` int(11) NOT NULL,
  `idioma` enum('es','en','pt') NOT NULL,
  `titulo` varchar(255) DEFAULT '',
  `descripcion` text DEFAULT NULL,
  `ubicacion` varchar(255) DEFAULT '',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_propiedad_idioma` (`propiedad_id`,`idioma`),
  KEY `propiedad_id` (`propiedad_id`),
  CONSTRAINT `propiedades_i18n_ibfk_1` FOREIGN KEY (`propiedad_id`) REFERENCES `propiedades` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DELETE FROM `contenido`;
INSERT INTO `contenido` (`clave`, `valor`) VALUES ('hero_descripcion', 'Prototipo para pagina - prueba 4');
INSERT INTO `contenido` (`clave`, `valor`) VALUES ('contacto_email', 'romerocelso521@gmail.com');
INSERT INTO `contenido` (`clave`, `valor`) VALUES ('contacto_telefono', '0987172354');
INSERT INTO `contenido` (`clave`, `valor`) VALUES ('about_texto', 'p');
INSERT INTO `contenido` (`clave`, `valor`) VALUES ('hero_titulo', 'PROTOTIPO PAG WEB PARA UNA IMMOBILIARIA');

DELETE FROM `propiedades`;
INSERT INTO `propiedades` (`id`, `titulo`, `precio_usd`, `dormitorios`, `banos`, `metros`, `lote`, `uso_suelo`, `impuestos`, `titulacion`, `amenidades`, `tipo`, `categoria`, `ubicacion`, `ubicacion_exacta`, `imagen`, `descripcion`) VALUES
(1, 'Av. Las Lomas 342', 145000.00, 3, 2, 210, '', '', '', '', 'wifi,agua,electricidad,cochera,parrilla', 'venta', 'casa', 'Barrio San Rafael · CDE', '', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80', 'Hermosa casa en una de las zonas más exclusivas de Ciudad del Este. Con amplios espacios verdes, cocina moderna integrada al living comedor, y un jardín posterior ideal para reuniones familiares. Cercana a supermercados, colegios y a 10 minutos del centro.'),
(2, 'Edificio Mirador 8B', 650.00, 2, 1, 78, '', '', '', '', 'wifi,aire,ascensor,portero,agua_caliente,amoblado,gas,cable', 'alquiler', 'apartamento', 'Centro · CDE', '', 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200&q=80', 'Moderno departamento en pleno centro de la ciudad. A pasos de bancos, comercios y restaurantes. Cuenta con balcón con vista panorámica, cocina americana equipada y baño en suite. Ideal para profesionales.'),
(3, 'Camino Itá Pytá 1190', 268000.00, 4, 3, 340, '', '', '', '', 'wifi,aire,pileta,quincho,parrilla,jardin,estacionamiento,agua,gas', 'venta', 'casa', 'Zona country · CDE', '', 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=1200&q=80', 'Imponente casa de diseño contemporáneo en la zona country más exclusiva. Piscina, quincho, parque con árboles frutales, cocina gourmet, suite principal con walk-in closet y baño con hidromasaje. Seguridad 24hs.'),
(4, 'Apartamento El Faro', 850.00, 1, 1, 45, '', '', '', '', 'wifi,aire,amoblado,agua_caliente,gas,cocina,balcon', 'alquiler', 'apartamento', 'Centro · CDE', '', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80', 'Acogedor apartamento en pleno centro, ideal para estudiantes o profesionales. Amoblado, con balcón y vista a la bahía.'),
(5, 'Casa Quinta Los Naranjos', 320000.00, 5, 3, 500, '', '', '', '', 'wifi,pileta,quincho,parrilla,jardin,estacionamiento,lavanderia,cochera', 'venta', 'casa', 'Zona norte · CDE', '', 'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=1200&q=80', 'Espaciosa casa quinta con pileta, quincho, cancha de fútbol y amplio parque. Ideal para familias grandes o emprendimientos.'),
(6, 'Local Comercial Centro', 1200.00, 0, 1, 80, '', '', '', '', 'wifi,aire,seguridad,estacionamiento,ascensor,portero,agua,electricidad', 'alquiler', 'local', 'Av. Adrián Jara · CDE', '', 'https://images.unsplash.com/photo-1449844908441-8829872d2607?w=1200&q=80', 'Local comercial en la calle más transitada de la ciudad. Ideal para tienda, oficina o showroom. Vidriera amplia y baño privado.'),
(7, 'Terreno Urbano San José', 55000.00, 0, 0, 360, '', '', '', '', NULL, 'venta', 'terreno', 'Barrio San José · CDE', '', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80', 'Terreno plano en zona residencial en crecimiento. Con todos los servicios: agua, luz, cloaca. Listo para construir.'),
(8, 'Penthouse Lujoso Mirador', 2500.00, 3, 2, 150, '', '', '', '', 'wifi,aire,ascensor,amoblado,terraza,parrilla,seguridad,agua_caliente,gas,lavanderia', 'alquiler', 'apartamento', 'Edificio Mirador · CDE', '', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80', 'Penthouse de lujo con terraza propia, jacuzzi exterior, cocina gourmet y vista 360° de la ciudad. Amoblado.'),
(9, 'Casa Dúplex San Miguel', 175000.00, 3, 2, 200, '', '', '', '', NULL, 'venta', 'casa', 'Barrio San Miguel · CDE', '', 'https://images.unsplash.com/photo-1600566753086-00f18e8b9322?w=1200&q=80', 'Dúplex moderno con dos plantas, patio trasero, cochera para 2 autos y acabados de primera calidad.'),
(10, 'Oficina Ejecutiva Edificio Fortune', 900.00, 0, 1, 60, '', '', '', '', 'wifi,aire,estacionamiento,seguridad,ascensor,portero,agua,electricidad', 'alquiler', 'local', 'Edificio Fortune · CDE', '', 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200&q=80', 'Oficina ejecutiva en el mejor edificio corporativo de la ciudad. Recepción, sala de reuniones, internet incluido.'),
(11, 'Terreno Industrial Ruta 7', 120000.00, 0, 0, 1200, '', '', '', '', NULL, 'venta', 'terreno', 'Ruta 7 Km 10 · CDE', '', 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1200&q=80', 'Terreno industrial sobre ruta asfaltada. Ideal para depósito, fábrica o logística. Acceso directo.'),
(12, 'Cabaña Ecológica Yvy Pyta', 95.00, 1, 1, 35, '', '', '', '', 'wifi,agua,parrilla,cocina,amoblado', 'alquiler', 'cabaña', 'Yvy Pyta · CDE', '', 'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=1200&q=80', 'Cabaña ecológica rodeada de naturaleza. Ideal para escapadas de fin de semana. Fogón exterior y senderos.');

DELETE FROM `propiedades_i18n`;
INSERT INTO `propiedades_i18n` (`propiedad_id`, `idioma`, `titulo`, `descripcion`, `ubicacion`)
SELECT id, 'es', COALESCE(titulo,''), descripcion, COALESCE(ubicacion,'') FROM propiedades;

DELETE FROM `propiedad_fotos`;
INSERT INTO `propiedad_fotos` (`id`, `propiedad_id`, `url`, `orden`) VALUES
(1, 1, 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80', 0),
(2, 1, 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80', 1),
(3, 1, 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80', 2),
(4, 1, 'https://images.unsplash.com/photo-1600566753086-00f18e8b9322?w=1200&q=80', 3),
(5, 1, 'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=1200&q=80', 4),
(6, 2, 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200&q=80', 0),
(7, 2, 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80', 1),
(8, 2, 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80', 2),
(9, 2, 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200&q=80', 3),
(10, 2, 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80', 4),
(11, 3, 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=1200&q=80', 0),
(12, 3, 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&q=80', 1),
(13, 3, 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&q=80', 2),
(14, 3, 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80', 3),
(15, 3, 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80', 4),
(16, 4, 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80', 0),
(17, 4, 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80', 1),
(18, 4, 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200&q=80', 2),
(19, 4, 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80', 3),
(20, 5, 'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=1200&q=80', 0),
(21, 5, 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80', 1),
(22, 5, 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80', 2),
(23, 5, 'https://images.unsplash.com/photo-1600566753086-00f18e8b9322?w=1200&q=80', 3),
(24, 6, 'https://images.unsplash.com/photo-1449844908441-8829872d2607?w=1200&q=80', 0),
(25, 6, 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80', 1),
(26, 6, 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200&q=80', 2),
(27, 6, 'https://images.unsplash.com/photo-1497215842964-222b430dc094?w=1200&q=80', 3),
(28, 7, 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80', 0),
(29, 7, 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&q=80', 1),
(30, 7, 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200&q=80', 2),
(31, 7, 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&q=80', 3),
(32, 8, 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80', 0),
(33, 8, 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80', 1),
(34, 8, 'https://images.unsplash.com/photo-1600566753086-00f18e8b9322?w=1200&q=80', 2),
(35, 8, 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80', 3),
(36, 9, 'https://images.unsplash.com/photo-1600566753086-00f18e8b9322?w=1200&q=80', 0),
(37, 9, 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80', 1),
(38, 9, 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80', 2),
(39, 9, 'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=1200&q=80', 3),
(40, 10, 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200&q=80', 0),
(41, 10, 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80', 1),
(42, 10, 'https://images.unsplash.com/photo-1497215842964-222b430dc094?w=1200&q=80', 2),
(43, 10, 'https://images.unsplash.com/photo-1449844908441-8829872d2607?w=1200&q=80', 3),
(44, 11, 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1200&q=80', 0),
(45, 11, 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&q=80', 1),
(46, 11, 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200&q=80', 2),
(47, 11, 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80', 3),
(48, 12, 'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=1200&q=80', 0),
(49, 12, 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200&q=80', 1),
(50, 12, 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=1200&q=80', 2),
(51, 12, 'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=1200&q=80', 3);

-- Fin
