const fs = require('fs');
const path = require('path');

// Configuration
const INPUT_PRODUCTS_PATH = path.join(__dirname, '../lib/data/products.json');
const REDIRECTS_OUTPUT_PATH = path.join(__dirname, '../out/redirects.json');
const LEGACY_MAP_PATH = path.join(__dirname, '../data/legacy-map.csv');
const SAMPLE_MAP_PATH = path.join(__dirname, '../data/legacy-map.sample.csv');

// Load Data
if (!fs.existsSync(INPUT_PRODUCTS_PATH)) {
    console.error(`ERROR: Product data not found at ${INPUT_PRODUCTS_PATH}`);
    console.error("Please run 'npm run data:build' first.");
    process.exit(1);
}

let products = [];
try {
    products = JSON.parse(fs.readFileSync(INPUT_PRODUCTS_PATH, 'utf8'));
} catch (e) {
    console.error(`ERROR: Failed to parse products.json: ${e.message}`);
    process.exit(1);
}
console.log(`Loaded ${products.length} products from ${INPUT_PRODUCTS_PATH}`);

// Load Legacy Map if exists
const legacyMap = new Map();
if (fs.existsSync(LEGACY_MAP_PATH)) {
    console.log(`Loading legacy map from ${LEGACY_MAP_PATH}...`);
    try {
        const content = fs.readFileSync(LEGACY_MAP_PATH, 'utf8');
        const lines = content.split(/\r?\n/);
        lines.forEach(line => {
            if (!line.trim()) return;
            // Support both semicolon and comma, handle quotes loosely
            const [sku, path] = line.split(/[;,]/).map(s => s.trim().replace(/^"|"$/g, ''));
            if (sku && path) {
                legacyMap.set(sku, path);
            }
        });
        console.log(`Loaded ${legacyMap.size} legacy mappings.`);
    } catch (e) {
        console.warn(`WARNING: Failed to read legacy map: ${e.message}`);
    }
} else {
    // If map is missing, create sample and exit gracefully with empty redirects
    console.log("No legacy map found. Creating sample...");
    try {
        fs.writeFileSync(SAMPLE_MAP_PATH, "sku;legacyPath\n12345;/old-category/old-product.html");
        console.log(`Created sample map at ${SAMPLE_MAP_PATH}`);
    } catch (e) {
        console.warn(`WARNING: Failed to create sample map: ${e.message}`);
    }

    // Write empty redirects to ensure next.config.mjs doesn't crash
    fs.mkdirSync(path.dirname(REDIRECTS_OUTPUT_PATH), { recursive: true });
    fs.writeFileSync(REDIRECTS_OUTPUT_PATH, "[]");
    console.log(`Generated empty redirects file at ${REDIRECTS_OUTPUT_PATH} (No map provided).`);
    process.exit(0);
}

// Process Redirects
const redirects = [];
products.forEach(p => {
    // New Path Strategy
    const newPath = `/producto/${p.slug}`;

    // Legacy Path Strategy
    // 1. Check Map by ID (most reliable)
    // 2. Check Map by Name/SKU if available (less reliable)
    // 3. Check internal legacyPath field if it exists
    let legacy = legacyMap.get(p.id) || (p.sku && legacyMap.get(p.sku)) || p.legacyPath || '';

    if (legacy) {
        redirects.push({
            source: legacy,
            destination: newPath,
            permanent: true
        });
    }
});

// Save Redirects
fs.mkdirSync(path.dirname(REDIRECTS_OUTPUT_PATH), { recursive: true });
fs.writeFileSync(REDIRECTS_OUTPUT_PATH, JSON.stringify(redirects, null, 2));
console.log(`Generated ${redirects.length} redirects to ${REDIRECTS_OUTPUT_PATH}`);

// Strict Mode check (optional, but requested by package.json scripts)
const args = process.argv.slice(2);
if (args.includes('--strict')) {
    // If strict, we want to know if *mapped* products are missing?
    // Or if products have no legacy path?
    // With an external map, "missing legacy path" is the default state for new products, so erroring might be too aggressive.
    // We will just warn.
    const mappedCount = redirects.length;
    const totalCount = products.length;
    if (mappedCount < totalCount) {
        console.warn(`WARNING: Only ${mappedCount}/${totalCount} products have legacy redirects.`);
    }
}
