const fs = require('fs');
const path = require('path');

// Generates out/redirects.json for Next.js `redirects()`.
//
// IMPORTANT
// - Main legacy pages (/p<ID>-slug.html and /c<ID>-slug.html) are handled by `rewrites()` (200 OK) and MUST NOT be 301'ed.
// - This script is only for *extra* legacy URLs that do NOT match those patterns (e.g. old marketing pages, typos, alternate paths).

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
  return /^\/(?:[pc])\d+-.*\.html$/i.test(p) || /^\/(?:p)\d+\.html$/i.test(p);
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

function normalizePath(p) {
  if (!p) return '';
  const s = String(p).trim();
  return s.startsWith('/') ? s : `/${s}`;
}

function buildRedirects(rows, productsById) {
  const redirects = [];
  const seen = new Set();

  const push = (source, destination) => {
    const src = normalizePath(source);
    const dst = normalizePath(destination);
    if (!src || !dst) return;

    // Never 301 the main legacy patterns (they must stay 200 OK via rewrites)
    if (isMainLegacyPattern(src)) return;

    const key = `${src}=>${dst}`;
    if (seen.has(key)) return;
    seen.add(key);

    redirects.push({ source: src, destination: dst, permanent: true });
  };

  for (const row of rows) {
    const a = String(row.a || '').trim();
    const b = String(row.b || '').trim();
    if (!a || !b) continue;

    // Format (1): explicit source;destination
    if (a.startsWith('/')) {
      push(a, b);
      continue;
    }

    // Format (2): id;legacyPath  (destination computed to canonical /p<ID>-slug.html)
    if (/^\d+$/.test(a)) {
      const id = a;
      const legacyPath = b;
      const product = productsById.get(String(id));
      if (!product) {
        const msg = `Mapping refers to missing product id=${id}`;
        if (STRICT) throw new Error(msg);
        console.warn(`[WARN] ${msg}`);
        continue;
      }
      push(legacyPath, legacyProductHref(product));
      continue;
    }

    // Unknown row format
    const msg = `Unrecognized mapping row: "${a};${b}"`;
    if (STRICT) throw new Error(msg);
    console.warn(`[WARN] ${msg}`);
  }

  return redirects;
}

function main() {
  try {
    const productsById = loadProductsById();
    const rows = parseCsvMap();
    const redirects = buildRedirects(rows, productsById);
    writeRedirects(redirects);
  } catch (e) {
    console.error(`[legacy:build] ERROR: ${e?.message || e}`);
    // Never fail build unless STRICT
    if (STRICT) process.exit(1);
    writeRedirects([]);
  }
}

main();
