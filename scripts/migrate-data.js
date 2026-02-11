const fs = require('fs');
const path = require('path');

// Configuration
const PRODUCTS_CSV_PATH = path.join(__dirname, '../data/exportProducts.csv');
const BLOG_CSV_PATH = path.join(__dirname, '../data/exportBlog.csv');
const OUTPUT_PRODUCTS_PATH = path.join(__dirname, '../lib/data/generated-products.json');
const OUTPUT_BLOG_PATH = path.join(__dirname, '../lib/data/generated-blog.json');

// --- HELPER FUNCTIONS ---

// 1. Smart Text Reader: Tries UTF-8, checks for replacement chars, falls back to Latin1 if needed.
function readTextSmart(filePath) {
    console.log(`Reading ${filePath} with smart encoding detection...`);
    const buffer = fs.readFileSync(filePath);

    // Try standard UTF-8 first
    const contentUtf8 = buffer.toString('utf8');

    // Count Replacement Characters (U+FFFD)
    // If there are many, it's likely not UTF-8 but Latin1 (or Windows-1252) read as UTF-8.
    const replacementCount = (contentUtf8.match(/\uFFFD/g) || []).length;

    if (replacementCount > 0) {
        console.warn(`  > Detected ${replacementCount} replacement characters (\\uFFFD) when reading as UTF-8.`);
        console.warn(`  > Falling back to 'latin1' (binary) reading.`);
        return buffer.toString('latin1');
    }

    console.log(`  > Valid UTF-8 detected.`);
    return contentUtf8;
}

// 2. Text Cleaner: Normalizes string content
function cleanText(str) {
    if (typeof str !== 'string') return str;
    if (!str) return "";

    return str
        .replace(/\uFFFD/g, '')        // Remove Replacement Character if any
        .replace(/\u00A0/g, ' ')       // Replace Non-Breaking Space (NBSP) with normal space
        .replace(/â€œ/g, '"').replace(/â€/g, '"') // Fix some common UTF-8 moji if any slipped through
        .replace(/Ã‘/g, 'Ñ').replace(/Ã±/g, 'ñ')  // Common double-encoded UTF-8 -> Latin1 artifacts
        // Legacy Latin1 fixes (if read as Latin1 but had specific chars)
        .replace(/¢/g, 'ó')  // Often "Descripci¢n" -> "Descripción" in some DOS/Latin contexts
        .replace(/£/g, 'ú')  // "m£ltiplos" -> "múltiplos"
        .replace(/à/g, 'Ó')  // "àPTIMA" -> "ÓPTIMA"
        .replace(/µ/g, 'á')  // "LµSER" -> "LÁSER"
        .replace(/¥/g, 'Ñ')  // Sometimes used
        .replace(/¤/g, 'ñ')  // "Espa¤a" -> "España"
        .replace(/Ö/g, 'Í')  // "MANTELERÖA" -> "MANTELERÍA"
        .replace(/¡/g, 'í')  // "Hosteler¡a" -> "Hostelería"
        .replace(/‚/g, 'é')  // "tambi‚n" -> "también"

        // General cleanup
        .replace(/\s+/g, ' ')          // Collapse multiple spaces
        .trim();                       // Trim edges
}

// 3. Slugify
function slugify(text) {
    if (!text) return "";
    return text
        .toString()
        .toLowerCase()
        .normalize('NFD') // Split accented characters
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/\s+/g, '-') // Replace spaces with -
        .replace(/[^\w\-]+/g, '') // Remove all non-word chars
        .replace(/\-\-+/g, '-') // Replace multiple - with single -
        .replace(/^-+/, '') // Trim - from start
        .replace(/-+$/, ''); // Trim - from end
}

// Helper: Parse CSV Line (handling quotes and semicolons)
function parseCSVLine(line, separator = ';') {
    const result = [];
    let startValueIndex = 0;
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        if (line[i] === '"') {
            inQuotes = !inQuotes;
        } else if (line[i] === separator && !inQuotes) {
            let val = line.substring(startValueIndex, i);
            // Remove surrounding quotes if present
            if (val.startsWith('"') && val.endsWith('"')) {
                val = val.slice(1, -1).replace(/""/g, '"');
            }
            result.push(val);
            startValueIndex = i + 1;
        }
    }
    // Push last value
    let val = line.substring(startValueIndex);
    if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1).replace(/""/g, '"');
    }
    result.push(val);
    return result;
}

// Helper: Parse CSV File with Smart Read
function parseCSV(filePath) {
    const content = readTextSmart(filePath);
    const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');

    if (lines.length === 0) return [];

    // Parse Headers (and clean them just in case)
    const headers = parseCSVLine(lines[0]).map(h => h.trim());

    const data = [];

    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length < headers.length) continue; // Skip malformed lines

        const row = {};
        headers.forEach((header, index) => {
            // Apply cleanText to VALUES
            row[header] = cleanText(values[index]);
        });
        data.push(row);
    }
    return data;
}


// ---- PRODUCTS MIGRATION (GROUPED) ----
function migrateProducts() {
    console.log("\nMigrating Products...");

    // Strategy: Look for keys flexibly.

    const rawProducts = parseCSV(PRODUCTS_CSV_PATH);
    console.log(`Found ${rawProducts.length} raw products.`);

    const products = [];
    let currentParent = null;

    // Flexible Key Finder
    const findKey = (row, ...candidates) => {
        const keys = Object.keys(row);
        for (const cand of candidates) {
            // Exact match
            if (row[cand]) return cand;
            // Partial match (careful with this)
            const found = keys.find(k => k.includes(cand));
            if (found) return found;
        }
        return null;
    };

    const getValue = (row, ...candidates) => {
        const key = findKey(row, ...candidates);
        return key ? row[key] : "";
    };

    rawProducts.forEach((p, index) => {
        const id = p["ID"];

        // PARENT PRODUCT
        if (id && id.trim() !== "") {
            const title = getValue(p, "Nombre", "Name") || "Unknown Product";

            if (!title || title === "Unknown Product") {
                currentParent = null;
                return;
            }

            const slug = slugify(title);
            const longDesc = getValue(p, "Descripci¢n", "Descripción", "Description");
            const shortDesc = getValue(p, "Descripci¢n Corta", "Descripción Corta", "Short Description");

            // Images
            const imagesStr = getValue(p, "Im\xa0genes", "Imágenes", "Images");
            const imageUrls = imagesStr.split(',').map(url => url.trim()).filter(Boolean);
            const mainImage = imageUrls.length > 0 ? imageUrls[0] : "/placeholder.svg";

            // Tags
            const tagsStr = getValue(p, "Tags", "Etiquetas");
            const tags = tagsStr.split(',').map(t => t.trim()).filter(Boolean);

            const priceStr = getValue(p, "Precio", "Price");
            const price = parseFloat(priceStr.replace(',', '.') || "0");

            const typeRaw = getValue(p, "Tipo de Producto", "Type");
            let productType = typeRaw === "1" ? "variable" : "simple";

            const brand = getValue(p, "Marca", "Brand");
            const sku = getValue(p, "C¢digo", "Código", "SKU", "Codigo");
            const categories = getValue(p, "Categor¡as", "Categorías", "Categories");

            currentParent = {
                id: id,
                slug: slug,
                title: title,
                shortDescription: shortDesc,
                longDescription: longDesc,
                image: mainImage,
                imageUrls: imageUrls,
                price: price,
                sku: sku,
                tags: tags,
                productType: productType,
                variantName: getValue(p, "Nombre variante", "Variant Name"),
                variantOption: getValue(p, "Nombre opci¢n", "Nombre opción", "Option Name"),
                variants: [],
                features: [],
                brands: brand ? [brand] : [],
                legacyPath: undefined,
                category: categories
            };
            products.push(currentParent);
        }
        // CHILD VARIANT
        else if (currentParent) {
            const priceStr = getValue(p, "Precio", "Price");
            const variantPrice = parseFloat(priceStr.replace(',', '.') || "0");

            let label = getValue(p, "Nombre opci¢n", "Nombre opción");
            if (!label) label = getValue(p, "Nombre variante", "Variant Name");
            if (!label) label = "Opción standard";

            const sku = getValue(p, "C¢digo", "Código", "SKU");

            const variant = {
                sku: sku,
                price: variantPrice,
                effectivePrice: variantPrice > 0 ? variantPrice : (currentParent.price > 0 ? currentParent.price : 0),
                optionLabel: label
            };

            currentParent.variants.push(variant);
            currentParent.productType = "variable";
        }
    });

    // Write
    fs.writeFileSync(OUTPUT_PRODUCTS_PATH, JSON.stringify(products, null, 2));
    console.log(`Saved ${products.length} grouped products to ${OUTPUT_PRODUCTS_PATH}`);
}

// ---- BLOG MIGRATION ----
function migrateBlog() {
    console.log("\nMigrating Blog...");
    const rawBlog = parseCSV(BLOG_CSV_PATH);
    console.log(`Found ${rawBlog.length} raw blog posts.`);

    const foundKey = (row, part) => Object.keys(row).find(k => k.includes(part));

    const mappedPosts = rawBlog.map(p => {
        const titleKey = foundKey(p, "T¡tulo") || foundKey(p, "Título") || "Title";
        const dateKey = foundKey(p, "Fecha") || "Date";

        const title = p[titleKey] || "Untitled Post";
        const slug = slugify(title);
        const date = p[dateKey] || new Date().toISOString().split('T')[0];

        return {
            slug: slug,
            title: title,
            excerpt: "Contenido pendiente de migración",
            content: "<p>Contenido pendiente de migración desde el sistema anterior.</p>",
            date: date,
            author: "Palbin",
            image: "/placeholder.svg",
            tags: [],
            legacyPath: undefined
        };
    });

    fs.writeFileSync(OUTPUT_BLOG_PATH, JSON.stringify(mappedPosts, null, 2));
    console.log(`Saved ${mappedPosts.length} posts to ${OUTPUT_BLOG_PATH}`);
}

// ---- SELF-CHECK ----
function runSelfCheck() {
    console.log("\nRunning Encoding Self-Check...");
    const content = fs.readFileSync(OUTPUT_PRODUCTS_PATH, 'utf8');

    // Check for common corruption artifacts that shouldn't be in final Spanish text
    const badChars = [
        { char: '£', name: 'Pound sign (likely ú)' },
        { char: '\uFFFD', name: 'Replacement character' },
        { char: 'Ã', name: 'UTF-8 artifact' },
        { char: '¢', name: 'Cent sign (likely ó)' },
        { char: 'Â', name: 'UTF-8 artifact' }
    ];
    let warnings = 0;

    badChars.forEach(item => {
        if (!item.char) return;
        const count = content.split(item.char).length - 1;
        if (count > 0) {
            console.warn(`WARNING: Found ${count} occurrences of suspicious character '${item.char}' (${item.name}) in generated JSON.`);
            warnings++;
        }
    });

    if (warnings === 0) {
        console.log("SUCCESS: No suspicious encoding characters found in output.");
    } else {
        console.error(`\nERROR: Found ${warnings} encoding issues. Quality Gate Failed.`);
        console.error("Please fix the cleaning logic or source data before proceeding.");
        process.exit(1);
    }
}

// Run
try {
    migrateProducts();
    migrateBlog();
    runSelfCheck();
    console.log("\nMigration completed.");
} catch (e) {
    console.error("Migration failed:", e);
    process.exit(1);
}
