-- Migración: agregar soporte multi-idioma a propiedades
-- Ejecutar después de importar database.sql

ALTER TABLE propiedades MODIFY titulo varchar(255) DEFAULT '';
ALTER TABLE propiedades MODIFY ubicacion varchar(255) DEFAULT '';
ALTER TABLE propiedades MODIFY descripcion text DEFAULT NULL;
ALTER TABLE propiedades MODIFY amenidades text DEFAULT NULL;

CREATE TABLE IF NOT EXISTS `propiedades_i18n` (
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

-- Migrar datos existentes como español
INSERT IGNORE INTO propiedades_i18n (propiedad_id, idioma, titulo, descripcion, ubicacion)
SELECT id, 'es', COALESCE(titulo, ''), descripcion, COALESCE(ubicacion, '') FROM propiedades
WHERE id > 0;

-- Las propiedades existentes NO tienen traducción EN/PT.
-- Quedan con solo fila 'es'; la landing usará español como fallback automático.
