-- Migración: sufijo de idioma para claves traducibles de contenido
-- Las claves originales (hero_titulo, hero_descripcion, about_texto) se conservan como español.

INSERT IGNORE INTO contenido (clave, valor)
SELECT 'hero_titulo_es', valor FROM contenido WHERE clave = 'hero_titulo' AND valor != '';

INSERT IGNORE INTO contenido (clave, valor)
SELECT 'hero_descripcion_es', valor FROM contenido WHERE clave = 'hero_descripcion' AND valor != '';

INSERT IGNORE INTO contenido (clave, valor)
SELECT 'about_texto_es', valor FROM contenido WHERE clave = 'about_texto' AND valor != '';

-- Las claves hero_titulo_en, hero_titulo_pt, hero_descripcion_en, hero_descripcion_pt,
-- about_texto_en, about_texto_pt NO existen todavía. Se crearán al guardar desde el panel.
-- Si no existen, la landing usará _es como fallback automático.
