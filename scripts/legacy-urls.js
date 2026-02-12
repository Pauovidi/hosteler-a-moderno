const fs = require('fs');
const path = require('path');

// Configuration
const INPUT_PRODUCTS_PATH = path.join(__dirname, '../lib/data/generated-products.with-images.json');
const FALLBACK_INPUT_PATH = path.join(__dirname, '../lib/data/generated-products.json');
const OUTPUT_PRODUCTS_PATH = path.join(__dirname, '../lib/data/generated-products.with-legacy.json');
const REDIRECTS_OUTPUT_PATH = path.join(__dirname, '../out/redirects.json');
const LEGACY_MAP_PATH = path.join(__dirname, '../data/legacy-map.csv');
const SAMPLE_MAP_PATH = path.join(__dirname, '../data/legacy-map.sample.csv');

// Load Data
let productsPath = INPUT_PRODUCTS_PATH;
if (!fs.existsSync(productsPath)) {
    console.log(`Preferred input not found (${INPUT_PRODUCTS_PATH}), falling back to ${FALLBACK_INPUT_PATH}`);
    productsPath = FALLBACK_INPUT_PATH;
}

if (!fs.existsSync(productsPath)) {
    console.error(`No product data found to process.`);
    process.exit(1);
}

const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
console.log(`Loaded ${products.length} products.`);

// Load Legacy Map if exists
const legacyMap = new Map();
if (fs.existsSync(LEGACY_MAP_PATH)) {
    console.log(`Loading legacy map from ${LEGACY_MAP_PATH}...`);
    const content = fs.readFileSync(LEGACY_MAP_PATH, 'utf8');
    const lines = content.split(/\r?\n/);
    lines.forEach(line => {
        if (!line.trim()) return;
        const [sku, path] = line.split(/[;,]/).map(s => s.trim().replace(/^"|"$/g, ''));
        if (sku && path) {
            legacyMap.set(sku, path);
        }
    });
} else {
    console.log("No legacy map found. Creating sample...");
    fs.writeFileSync(SAMPLE_MAP_PATH, "sku;legacyPath\n12345;/old-category/old-product.html");
    console.log(`Created sample map at ${SAMPLE_MAP_PATH}`);
}

// Process
const redirects = [];
const updatedProducts = products.map(p => {
    // Determine new path
    // Assuming product page is /producto/[slug]
    const newPath = `/producto/${p.slug}`;

    // Determine Legacy Path
    // Priority: 1. CSV Map (by ID/SKU), 2. Existing data field, 3. Construct from old ID? 
    // The prompt says "if data source exists... otherwise allow mapping by CSV".
    // We map by Product ID since 'sku' is often empty in variable parents.

    let legacy = legacyMap.get(p.id) || legacyMap.get(p.sku) || p.legacyPath || '';

    // If still empty, we can't guess valid 301s without data. 
    // But for demo purposes, if we had an "oldSlug" field we could use it.

    if (legacy) {
        redirects.push({
            source: legacy,
            destination: newPath,
            permanent: true
        });
    }

    return {
        ...p,
        legacyPath: legacy
    };
});

// Save Products
fs.writeFileSync(OUTPUT_PRODUCTS_PATH, JSON.stringify(updatedProducts, null, 2));
console.log(`Saved updated products to ${OUTPUT_PRODUCTS_PATH}`);

// Save Redirects
fs.writeFileSync(REDIRECTS_OUTPUT_PATH, JSON.stringify(redirects, null, 2));
console.log(`Generated ${redirects.length} redirects to ${REDIRECTS_OUTPUT_PATH}`);

// Quality Gate
const args = process.argv.slice(2);
if (args.includes('--strict')) {
    const missingLegacy = updatedProducts.filter(p => !p.legacyPath).length;
    if (missingLegacy > 0) {
        console.error(`FAIL: ${missingLegacy} products missing legacy paths.`);
        process.exit(1);
    }
} else {
    const missingLegacy = updatedProducts.filter(p => !p.legacyPath).length;
    if (missingLegacy > 0) {
        console.warn(`WARNING: ${missingLegacy} products are missing legacy paths (no redirects generated).`);
        console.warn(`Populate 'data/legacy-map.csv' with 'id;old_url' to fix.`);
    }
}
