<?php
require_once __DIR__ . '/config/database.php';

$settings = [];
$stmt = $pdo->query("SELECT clave, valor FROM restaurante_settings");
foreach ($stmt as $row) {
    $settings[$row['clave']] = $row['valor'];
}

$featured = $pdo->query("
    SELECT m.*, c.nombre AS cat_nombre
    FROM menu_items m
    LEFT JOIN categories c ON m.category_id = c.id
    WHERE m.destacado = 1 AND m.activo = 1
    ORDER BY c.sort_order, m.sort_order
    LIMIT 6
")->fetchAll();

if (!$featured) {
    $featured = $pdo->query("
        SELECT m.*, c.nombre AS cat_nombre
        FROM menu_items m
        LEFT JOIN categories c ON m.category_id = c.id
        WHERE m.activo = 1
        ORDER BY c.sort_order, m.sort_order
        LIMIT 6
    ")->fetchAll();
}

$restaurantName = htmlspecialchars($settings['restaurante_nombre'] ?? 'Eclat');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Reserve your table at <?php echo $restaurantName; ?> - Fine Dining Restaurant">
    <meta name="theme-color" content="#1a1a1a">
    <title><?php echo $restaurantName; ?> - Fine Dining Restaurant</title>
    <link rel="stylesheet" href="css/style.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        .dish-card__image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
        }
        .dish-card__image {
            overflow: hidden;
        }
    </style>
</head>
<body>
    <nav class="navbar" role="navigation" aria-label="Main">
        <div class="navbar__container">
            <a href="index.php" class="navbar__logo" aria-label="<?php echo $restaurantName; ?> - Home">
                <span class="navbar__logo-text"><?php echo $restaurantName; ?></span>
            </a>
            
            <button class="navbar__toggle" id="navToggle" aria-label="Toggle menu" aria-expanded="false">
                <span></span>
                <span></span>
                <span></span>
            </button>

            <ul class="navbar__menu" id="navMenu">
                <li><a href="index.php" class="navbar__link">Home</a></li>
                <li><a href="#featured" class="navbar__link">Dishes</a></li>
                <li><a href="#testimonials" class="navbar__link">Reviews</a></li>
                <li><a href="reservation.html" class="navbar__link navbar__link--cta">Reserve</a></li>
            </ul>

            <div class="navbar__actions">
                <button class="theme-toggle" id="themeToggle" aria-label="Toggle dark mode" title="Toggle dark mode">
                    <svg class="icon icon--light" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                    </svg>
                    <svg class="icon icon--dark" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                    </svg>
                </button>
            </div>
        </div>
    </nav>

    <section class="hero" aria-label="Hero">
        <div class="hero__content">
            <div class="hero__text">
                <h1 class="hero__title"><?php echo htmlspecialchars($settings['hero_titulo'] ?? 'Experience Culinary Excellence'); ?></h1>
                <p class="hero__subtitle"><?php echo htmlspecialchars($settings['hero_subtitulo'] ?? 'Indulge in exquisite flavors crafted by world-renowned chefs in an atmosphere of refined elegance'); ?></p>
                <a href="reservation.html" class="btn btn--primary btn--lg">
                    <span>Reserve Your Table</span>
                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                    </svg>
                </a>
            </div>
            <div class="hero__image">
                <?php
                $hero_img = $settings['hero_imagen'] ?? '';
                if (!empty($hero_img)):
                    $hero_src = (str_starts_with($hero_img, 'http') || str_starts_with($hero_img, '/'))
                        ? $hero_img
                        : 'admin/uploads/' . $hero_img;
                ?>
                    <img src="<?php echo htmlspecialchars($hero_src); ?>" alt="<?php echo $restaurantName; ?>" style="width:100%;height:100%;object-fit:cover">
                <?php else: ?>
                <div class="hero__image-placeholder">
                    <svg viewBox="0 0 400 300" fill="none" stroke="currentColor" stroke-width="2" opacity="0.2">
                        <rect x="20" y="20" width="360" height="260" rx="10"/>
                        <circle cx="200" cy="100" r="30"/>
                        <path d="M150 150 L250 150 L250 250 L150 250 Z"/>
                    </svg>
                    <p class="text-muted">Premium restaurant imagery</p>
                </div>
                <?php endif; ?>
            </div>
        </div>
    </section>

    <section class="featured" id="featured" aria-labelledby="featured-title">
        <div class="container">
            <div class="section-header">
                <h2 id="featured-title" class="section-title">Signature Dishes</h2>
                <p class="section-subtitle">Carefully curated selections from our menu</p>
            </div>

            <div class="dishes-grid">
                <?php foreach ($featured as $dish): ?>
                <article class="dish-card">
                    <div class="dish-card__image">
                        <?php if (!empty($dish['imagen'])): ?>
                            <img src="admin/uploads/<?php echo htmlspecialchars($dish['imagen']); ?>" alt="<?php echo htmlspecialchars($dish['nombre']); ?>" loading="lazy">
                        <?php else: ?>
                        <div class="dish-placeholder">
                            <svg viewBox="0 0 200 150" fill="none" stroke="currentColor" stroke-width="2" opacity="0.3">
                                <circle cx="100" cy="75" r="50"/>
                                <path d="M60 75 L140 75 M100 35 L100 115"/>
                            </svg>
                        </div>
                        <?php endif; ?>
                    </div>
                    <div class="dish-card__content">
                        <h3 class="dish-card__title"><?php echo htmlspecialchars($dish['nombre']); ?></h3>
                        <p class="dish-card__description"><?php echo htmlspecialchars($dish['descripcion']); ?></p>
                        <p class="dish-card__price">$<?php echo number_format($dish['precio'], 2); ?></p>
                    </div>
                </article>
                <?php endforeach; ?>
            </div>
        </div>
    </section>

    <section class="testimonials" id="testimonials" aria-labelledby="testimonials-title">
        <div class="container">
            <div class="section-header">
                <h2 id="testimonials-title" class="section-title">Guest Experiences</h2>
                <p class="section-subtitle">What our valued guests say about us</p>
            </div>

            <div class="testimonials-grid">
                <article class="testimonial-card">
                    <div class="testimonial-card__rating">
                        <span class="star">&#9733;</span><span class="star">&#9733;</span><span class="star">&#9733;</span><span class="star">&#9733;</span><span class="star">&#9733;</span>
                    </div>
                    <p class="testimonial-card__text">"The most extraordinary dining experience. Every detail was perfection."</p>
                    <p class="testimonial-card__author">&#8212; Sarah Mitchell</p>
                </article>

                <article class="testimonial-card">
                    <div class="testimonial-card__rating">
                        <span class="star">&#9733;</span><span class="star">&#9733;</span><span class="star">&#9733;</span><span class="star">&#9733;</span><span class="star">&#9733;</span>
                    </div>
                    <p class="testimonial-card__text">"A culinary masterpiece. The ambiance, service, and food are simply incomparable."</p>
                    <p class="testimonial-card__author">&#8212; James Richardson</p>
                </article>

                <article class="testimonial-card">
                    <div class="testimonial-card__rating">
                        <span class="star">&#9733;</span><span class="star">&#9733;</span><span class="star">&#9733;</span><span class="star">&#9733;</span><span class="star">&#9733;</span>
                    </div>
                    <p class="testimonial-card__text">"Worth every penny. We celebrated our anniversary here and it was unforgettable."</p>
                    <p class="testimonial-card__author">&#8212; Emma & David Chen</p>
                </article>
            </div>
        </div>
    </section>

    <section class="cta-section" aria-label="Call to action">
        <div class="container">
            <h2 class="cta-section__title">Ready to Reserve?</h2>
            <p class="cta-section__subtitle">Join us for an unforgettable evening of fine dining</p>
            <a href="reservation.html" class="btn btn--secondary btn--lg">Book Your Table Now</a>
        </div>
    </section>

    <footer class="footer">
        <div class="container">
            <div class="footer-grid">
                <div class="footer-section">
                    <h3 class="footer__title"><?php echo $restaurantName; ?></h3>
                    <p class="footer__text">Fine Dining Excellence</p>
                </div>
                <div class="footer-section">
                    <h4 class="footer__heading">Hours</h4>
                    <ul class="footer__list">
                        <li>Mon - Thu: <?php echo htmlspecialchars($settings['horas_lun_jue'] ?? '5:00 PM - 11:00 PM'); ?></li>
                        <li>Fri - Sat: <?php echo htmlspecialchars($settings['horas_vie_sab'] ?? '5:00 PM - 12:00 AM'); ?></li>
                        <li>Sunday: <?php echo htmlspecialchars($settings['horas_dom'] ?? '5:00 PM - 10:00 PM'); ?></li>
                    </ul>
                </div>
                <div class="footer-section">
                    <h4 class="footer__heading">Contact</h4>
                    <ul class="footer__list">
                        <li><a href="tel:<?php echo htmlspecialchars($settings['telefono'] ?? ''); ?>"><?php echo htmlspecialchars($settings['telefono'] ?? '(123) 456-7890'); ?></a></li>
                        <li><a href="mailto:<?php echo htmlspecialchars($settings['email'] ?? ''); ?>"><?php echo htmlspecialchars($settings['email'] ?? 'info@eclat.com'); ?></a></li>
                        <li><?php echo htmlspecialchars($settings['direccion'] ?? '123 Culinary Lane'); ?></li>
                    </ul>
                </div>
                <div class="footer-section">
                    <h4 class="footer__heading">Quick Links</h4>
                    <ul class="footer__list">
                        <li><a href="reservation.html">Make a Reservation</a></li>
                        <li><a href="dashboard.html">Manage Reservations</a></li>
                        <li><a href="#">Menu</a></li>
                    </ul>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; <?php echo date('Y'); ?> <?php echo htmlspecialchars($settings['copyright'] ?? 'Eclat Restaurant. All rights reserved.'); ?></p>
            </div>
        </div>
    </footer>

    <button class="scroll-to-top" id="scrollToTop" aria-label="Scroll to top" title="Scroll to top">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="18 15 12 9 6 15"></polyline>
        </svg>
    </button>

    <div id="toastContainer" class="toast-container" role="region" aria-live="polite" aria-atomic="true"></div>

    <script src="js/app.js"></script>
</body>
</html>
