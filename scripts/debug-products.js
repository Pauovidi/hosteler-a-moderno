const fs = require('fs');
const path = require('path');

const PRODUCTS_PATH = path.join(__dirname, '../lib/data/products.json');

try {
    const products = JSON.parse(fs.readFileSync(PRODUCTS_PATH, 'utf8'));
    console.log(`Loaded ${products.length} products.`);

    // 1. Check Duplicates
    const slugs = new Set();
    const ids = new Set();

    products.forEach(p => {
        if (slugs.has(p.slug)) console.error(`Duplicate Slug: ${p.slug}`);
        slugs.add(p.slug);

        if (ids.has(p.id)) console.error(`Duplicate ID: ${p.id}`);
        ids.add(p.id);
    });

    // 2. Check HTML / Content
    products.forEach(p => {
        const desc = p.descriptionHtml || "";
        if (desc.includes('%2F')) {
            console.warn(`[${p.id}] Description contains URL encoded chars (%2F): ${desc.substring(0, 50)}...`);
        }
        if (desc.includes('style=text-align')) {
            // Check quotes
            // Regex for style= without quotes?
            if (/style=[^"']/.test(desc)) {
                console.warn(`[${p.id}] Description contains unquoted style attribute: ${desc.substring(0, 50)}...`);
            }
        }
    });

    console.log("Validation complete.");

} catch (e) {
    console.error("Failed to read/parse products.json", e);
}
