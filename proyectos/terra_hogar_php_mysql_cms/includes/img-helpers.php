<?php
function optimizeImageUrl(string $url, int $ancho, int $calidad = 80): string {
    if ($url === '') return '';

    if (str_contains($url, 'images.unsplash.com')) {
        $parts = parse_url($url);
        $params = [];
        if (isset($parts['query'])) {
            parse_str($parts['query'], $params);
        }
        $params['w'] = $ancho;
        $params['q'] = $calidad;
        $params['auto'] = 'format';
        $params['fit'] = 'crop';
        $newQuery = http_build_query($params, '', '&', PHP_QUERY_RFC3986);
        return $parts['scheme'] . '://' . $parts['host'] . $parts['path'] . '?' . $newQuery;
    }

    if (!str_contains($url, 'w=') && !str_contains($url, 'q=')) {
        echo "<!-- IMG-HELPER: URL no optimizable (no es Unsplash y no tiene parámetros w/q): $url -->\n";
    }
    return $url;
}

function unsplashSrcset(string $url, int $ancho): string {
    if (!str_contains($url, 'images.unsplash.com')) {
        return 'src="' . htmlspecialchars($url) . '"';
    }
    $mitad = max(200, (int)($ancho / 2));
    $src1x = optimizeImageUrl($url, $ancho);
    $src05x = optimizeImageUrl($url, $mitad);
    return 'src="' . htmlspecialchars($src1x) . '" srcset="' . htmlspecialchars($src05x) . ' ' . $mitad . 'w, ' . htmlspecialchars($src1x) . ' ' . $ancho . 'w" sizes="(max-width: 768px) 100vw, ' . $ancho . 'px"';
}
