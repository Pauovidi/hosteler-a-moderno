/*
  Legacy redirects generator (301)
  --------------------------------
  PURPOSE:
  - Keep the main legacy URLs (/p<ID>-...html and /c<ID>-...html) alive via Next rewrites (200 OK).
  - Generate 301 redirects ONLY for other legacy URLs (old paths, aliases, outdated permalinks) into the canonical legacy URLs.

  INPUT:
  - data/legacy-map.csv  (optional)
    Format (semicolon separated):
      key;legacyPath
    key can be:
      - product id (e.g. 10446447)
      - product sku

  OUTPUT:
  - out/redirects.json
    Array of Next.js redirect objects: { source, destination, permanent }

  NOTE:
  - This script NEVER fails the build by default. It writes an empty redirects.json if inputs are missing.
  - Use --strict to fail on missing data/mappings.
*/

const fs = require('fs');
const path = require('path');

const STRICT = process.argv.includes('--strict');

const PRODUCTS_PATH = path.join(process.cwd(), 'lib', 'data', 'products.json');
const LEGACY_MAP_PATH = path.join(process.cwd(), 'data', 'legacy-map.csv');
const LEGACY_MAP_SAMPLE_PATH = path.join(process.cwd(), 'data', 'legacy-map.sample.csv');
const OUT_PATH = path.join(process.cwd(), 'out', 'redirects.json');

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function toLegacySlug(input) {
  return String(input || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, 'y')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizePath(p) {
  if (!p) return null;
  const s = String(p).trim();
  if (!s) return null;
  return s.startsWith('/') ? s : `/${s}`;
}

function readProducts() {
  if (!fs.existsSync(PRODUCTS_PATH)) {
    if (STRICT) throw new Error(`Products file not found: ${PRODUCTS_PATH}`);
    console.warn(`[legacy:build] Products not found at ${PRODUCTS_PATH}. Writing empty redirects.`);
    return [];
  }
  try {
    const raw = fs.readFileSync(PRODUCTS_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      if (STRICT) throw new Error('products.json is not an array');
      console.warn('[legacy:build] products.json is not an array. Writing empty redirects.');
      return [];
    }
    return parsed;
  } catch (e) {
    if (STRICT) throw e;
    console.warn('[legacy:build] Failed to parse products.json. Writing empty redirects.', e);
    return [];
  }
}

function findProduct(products, key) {
  const k = String(key || '').trim();
  if (!k) return null;
  // Try by id
  let p = products.find((x) => String(x.id) === k);
  if (p) return p;
  // Try by sku
  p = products.find((x) => String(x.sku || '') === k);
  return p || null;
}

function legacyProductHref(product) {
  const slug = toLegacySlug(product.name || product.title || product.slug || product.sku || 'producto');
  return `/p${product.id}-${slug}.html`;
}

function writeJson(outPath, data) {
  ensureDir(path.dirname(outPath));
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2), 'utf-8');
}

function maybeWriteSample() {
  if (fs.existsSync(LEGACY_MAP_PATH) || fs.existsSync(LEGACY_MAP_SAMPLE_PATH)) return;
  ensureDir(path.dirname(LEGACY_MAP_SAMPLE_PATH));
  fs.writeFileSync(
    LEGACY_MAP_SAMPLE_PATH,
    [
      '# key;legacyPath',
      '# key = product id OR sku',
      '# legacyPath = an old URL path you want to 301 to the canonical /p<ID>-<slug>.html',
      '10446447;/productos/servilleta-airlaid-pliegue-americano.html',
      '8222301;/producto/aurora-champan-nacar.html',
    ].join('\n') + '\n',
    'utf-8'
  );
}

function parseMap(csvText) {
  const lines = String(csvText || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));

  const rows = [];
  for (const line of lines) {
    // allow either ; or ,
    const parts = line.split(';').length >= 2 ? line.split(';') : line.split(',');
    const key = (parts[0] || '').trim();
    const legacyPath = (parts.slice(1).join(';') || '').trim();
    if (!key || !legacyPath) continue;
    rows.push({ key, legacyPath });
  }
  return rows;
}

function main() {
  const products = readProducts();

  maybeWriteSample();

  if (!fs.existsSync(LEGACY_MAP_PATH)) {
    // No mappings -> still write empty redirects.json (so Next build never breaks)
    writeJson(OUT_PATH, []);
    console.log(`[legacy:build] No data/legacy-map.csv found. Wrote empty ${OUT_PATH}`);
    return;
  }

  const csv = fs.readFileSync(LEGACY_MAP_PATH, 'utf-8');
  const rows = parseMap(csv);

  const redirects = [];
  const seen = new Set();

  for (const row of rows) {
    const product = findProduct(products, row.key);
    if (!product) {
      const msg = `[legacy:build] Mapping key not found in products: ${row.key}`;
      if (STRICT) throw new Error(msg);
      console.warn(msg);
      continue;
    }

    const source = normalizePath(row.legacyPath);
    const destination = legacyProductHref(product);

    if (!source) continue;

    // Avoid loops and duplicates
    if (source === destination) continue;
    const signature = `${source} -> ${destination}`;
    if (seen.has(signature)) continue;
    seen.add(signature);

    redirects.push({ source, destination, permanent: true });
  }

  writeJson(OUT_PATH, redirects);
  console.log(`[legacy:build] Wrote ${redirects.length} redirects to ${OUT_PATH}`);
}

try {
  main();
} catch (e) {
  console.error(e);
  process.exit(1);
}
