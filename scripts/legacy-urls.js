const fs = require('fs');
const path = require('path');

// Generates out/redirects.json for Next.js `redirects()`.
// IMPORTANT: main legacy pages (/p<ID>-slug.html and /c<ID>-slug.html) are handled by `rewrites()` and MUST NOT be 301'ed.
// This script is only for extra legacy URLs that do NOT match those patterns.

const PRODUCTS_PATH = path.resolve(process.cwd(), 'lib/data/products.json');
const REDIRECTS_OUTPUT_PATH = path.resolve(process.cwd(), 'out/redirects.json');
const LEGACY_MAP_PATH = path.resolve(process.cwd(), 'data/legacy-map.csv');
const SAMPLE_MAP_PATH = path.resolve(process.cwd(), 'data/legacy-map.sample.csv');

const STRICT = process.argv.includes('--strict');

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeRedirects(redirects) {
  ensureDir(REDIRECTS_OUTPUT_PATH);
  fs.writeFileSync(REDIRECTS_OUTPUT_PATH, JSON.stringify(redirects, null, 2));
  console.log(`Generated ${redirects.length} redirects -> ${REDIRECTS_OUTPUT_PATH}`);
}

function isMainLegacyPattern(p) {
  return /^\/([pc])\d+-.*\.html$/i.test(p) || /^\/(p)\d+\.html$/i.test(p);
}

function toLegacySlug(product) {
  const id = String(product.id || '');
  const slug = String(product.slug || '');
  const suffix = `-${id}`;
  return slug.endsWith(suffix) ? slug.slice(0, -suffix.length) : slug;
}

function legacyProductHref(product) {
  const id = String(product.id || '');
  const legacySlug = toLegacySlug(product) || 'producto';
  return `/p${id}-${legacySlug}.html`;
}

function loadProductsById() {
  if (!fs.existsSync(PRODUCTS_PATH)) {
    console.warn(`Products file not found at ${PRODUCTS_PATH}. Writing empty redirects.json so build never fails.`);
    return new Map();
  }

  const products = JSON.parse(fs.readFileSync(PRODUCTS_PATH, 'utf8'));
  const map = new Map();
  (Array.isArray(products) ? products : []).forEach((p) => map.set(String(p.id), p));
  return map;
}

function parseCsvMap() {
  if (!fs.existsSync(LEGACY_MAP_PATH)) {
    ensureDir(SAMPLE_MAP_PATH);
    fs.writeFileSync(
      SAMPLE_MAP_PATH,
      [
        '## Two supported formats (semicolon or comma separated):',
        '## 1) source;destination',
        '## 2) id;legacyPath   (destination will be computed to the canonical /p<ID>-slug.html)',
        '##',
        '## Examples:',
        '/antiguo-producto.html;/p8222301-cuberteria-personalizada-aurora-champan-nacar-3-mm.html',
        '8222301;/antiguo-producto.html',
        ''
      ].join('\n'),
      'utf8'
    );
    console.log(`No legacy-map.csv found. Created sample at ${SAMPLE_MAP_PATH}`);
    return [];
  }

  const raw = fs.readFileSync(LEGACY_MAP_PATH, 'utf8');
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  const rows = [];
  for (const line of lines) {
    if (line.startsWith('#')) continue;
    const parts = line.split(/[;,]/).map((s) => s.trim().replace(/^"|"$/g, ''));
    if (parts.length < 2) continue;
    rows.push({ a: parts[0], b: parts[1] });
  }
  return rows;
}

function run() {
  const productsById = loadProductsById();
  const mapRows = parseCsvMap();

  const redirects = [];

  for (const row of mapRows) {
    const a = row.a;
    const b = row.b;

    // Format 1: source;destination
    // If first column starts with '/' we treat it as a direct source.
    if (a.startsWith('/')) {
      const source = a;
      const destination = b;

      if (!source || !destination) continue;
      if (isMainLegacyPattern(source)) {
        // /p... and /c... are served via rewrites (200 OK) — do NOT redirect them.
        continue;
      }
      redirects.push({ source, destination, permanent: true });
      continue;
    }

    // Format 2: id;legacyPath
    const id = a;
    const legacyPath = b;

    if (!id || !legacyPath) continue;
    if (isMainLegacyPattern(legacyPath)) {
      // Already handled by rewrites.
      continue;
    }

    const product = productsById.get(String(id));
    if (!product) {
      if (STRICT) {
        throw new Error(`legacy-map.csv references unknown product id: ${id}`);
      }
      continue;
    }

    const destination = legacyProductHref(product);
    redirects.push({ source: legacyPath, destination, permanent: true });
  }

  writeRedirects(redirects);
}

try {
  run();
} catch (e) {
  console.error(e?.message || e);
  if (STRICT) process.exit(1);
  // Never fail builds in non-strict mode.
  writeRedirects([]);
}
