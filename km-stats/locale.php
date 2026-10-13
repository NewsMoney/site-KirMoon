<?php
declare(strict_types=1);
// Install alongside the Admin's traffic.php. No IP/country/cookie is returned.
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: private, no-store, max-age=0');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    http_response_code(405);
    header('Allow: GET');
    echo '{"locale":null}';
    exit;
}
function kmSiteCountryLocale(string $country): ?string {
    if ($country === 'ZZ' || !preg_match('/^[A-Z]{2}$/D', $country)) return null;
    // Explicit product map. GQ is in the Spanish group, rather than the Portuguese group.
    $portuguese = ['BR', 'PT', 'AO', 'CV', 'GW', 'MZ', 'ST', 'TL'];
    $spanish = ['ES', 'MX', 'AR', 'BO', 'CL', 'CO', 'CR', 'CU', 'DO', 'EC', 'SV', 'GQ', 'GT', 'HN', 'NI', 'PA', 'PY', 'PE', 'PR', 'UY', 'VE'];
    if (in_array($country, $portuguese, true)) return 'pt-BR';
    if (in_array($country, $spanish, true)) return 'es';
    return 'en';
}
$locale = null;
try {
    $helper = __DIR__ . '/traffic.php';
    // Same private configuration path used by the Admin's collect.php.
    $configPath = dirname(__DIR__, 2) . '/kirmoon-analytics-config.php';
    if (is_file($helper) && is_file($configPath)) {
        require_once $helper;
        $config = require $configPath;
        if (is_array($config) && function_exists('kmTrafficClientIp') && function_exists('kmTrafficCountry')) {
            // Include the active public root so a public country database is rejected.
            $config['public_roots'] = array_merge($config['public_roots'] ?? [], [$_SERVER['DOCUMENT_ROOT'] ?? dirname(__DIR__)]);
            $country = kmTrafficCountry(kmTrafficClientIp($_SERVER, $config['trusted_proxy_cidrs'] ?? []), $config);
            $locale = kmSiteCountryLocale($country);
        }
    }
} catch (Throwable $error) {
    // An unavailable or unconfigured lookup preserves the browser fallback.
}
echo json_encode(['locale' => $locale], JSON_UNESCAPED_SLASHES);
