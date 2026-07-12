CREATE DATABASE IF NOT EXISTS eclat CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE eclat;

DROP TABLE IF EXISTS menu_items;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS restaurante_settings;
DROP TABLE IF EXISTS admins;

CREATE TABLE admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(255) DEFAULT '',
    sort_order INT DEFAULT 0
);

CREATE TABLE menu_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    imagen VARCHAR(255) DEFAULT '',
    destacado TINYINT(1) DEFAULT 0,
    sort_order INT DEFAULT 0,
    activo TINYINT(1) DEFAULT 1,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE restaurante_settings (
    clave VARCHAR(100) PRIMARY KEY,
    valor TEXT
);

INSERT INTO admins (username, password_hash) VALUES
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

INSERT INTO categories (nombre, sort_order) VALUES
('Signature Dishes', 1),
('Starters', 2),
('Main Course', 3),
('Desserts', 4),
('Beverages', 5);

INSERT INTO menu_items (category_id, nombre, descripcion, precio, destacado, sort_order) VALUES
(1, 'Butter Poached Lobster', 'Delicate lobster tail with drawn butter, micro herbs, and champagne foam', 48.00, 1, 1),
(1, 'Wagyu Beef Perfection', 'A5 Japanese Wagyu with roasted root vegetables and black garlic jus', 65.00, 1, 2),
(1, 'Diver Scallops', 'Hand-harvested scallops with saffron risotto and truffle oil', 52.00, 1, 3),
(2, 'Truffle Arancini', 'Crispy risotto balls with mozzarella and black truffle', 18.00, 0, 1),
(2, 'Oysters Rockefeller', 'Fresh oysters with spinach, parmesan and herb crust', 24.00, 0, 2),
(3, 'Filet Mignon', '8oz center-cut filet with truffle mashed potatoes', 58.00, 0, 1),
(3, 'Pan-Seared Salmon', 'Atlantic salmon with lemon beurre blanc and asparagus', 42.00, 0, 2),
(4, 'Crème Brûlée', 'Classic vanilla custard with caramelized sugar', 14.00, 0, 1),
(4, 'Chocolate Lava Cake', 'Warm dark chocolate cake with vanilla ice cream', 16.00, 0, 2);

INSERT INTO restaurante_settings (clave, valor) VALUES
('restaurante_nombre', 'Éclat'),
('hero_titulo', 'Experience Culinary Excellence'),
('hero_subtitulo', 'Indulge in exquisite flavors crafted by world-renowned chefs in an atmosphere of refined elegance'),
('hero_imagen', ''),
('telefono', '(123) 456-7890'),
('email', 'info@eclat.com'),
('direccion', '123 Culinary Lane, City, State 12345'),
('horas_lun_jue', '5:00 PM - 11:00 PM'),
('horas_vie_sab', '5:00 PM - 12:00 AM'),
('horas_dom', '5:00 PM - 10:00 PM'),
('copyright', 'Éclat Restaurant. All rights reserved.');
