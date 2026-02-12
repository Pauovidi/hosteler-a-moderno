const fs = require('fs');
const path = require('path');


// Configuration (CLI)
// Usage:
//   node scripts/import-catalog.js --input data/exportProducts.csv --out lib/data/products.json [--strict]
function getArgValue(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return null;
  const val = process.argv[idx + 1];
  if (!val || val.startsWith('--')) return null;
  return val;
}

const INPUT_CSV = path.resolve(process.cwd(), getArgValue('--input') || 'data/exportProducts.csv');
const OUTPUT_JSON = path.resolve(process.cwd(), getArgValue('--out') || 'lib/data/products.json');
const OUTPUT_REPORT = path.resolve(process.cwd(), 'out/import-report.json');
const OUTPUT_ERRORS = path.resolve(process.cwd(), 'out/import-errors.json');

const STRICT_MODE = process.argv.includes('--strict');

// --- HELPER FUNCTIONS ---

// 1. Latin1 Reader
function readLatin1(filePath) {
    console.log(`Reading ${filePath} as Latin1...`);
    // Node.js 'latin1' encoding matches the CSV encoding requirement
    return fs.readFileSync(filePath, 'latin1');
}

// 2. Text Cleaner (Specific Mojibake Fixes + NBSP)
function cleanText(str) {
    if (typeof str !== 'string') return str;
    if (!str) return "";

    let cleaned = str
        .replace(/\u00A0/g, ' ')       // NBSP -> space
        .replace(/\s+/g, ' ')          // Collapse spaces
        .trim();

    // Specific replacements requested
    const replacements = {
        "m£ltiplos": "múltiplos",
        "l ser": "láser", // NBSP was already handled above, but "l ser" might have had a normal space or NBSP
        "PERSONALIZACIàN": "PERSONALIZACIÓN",
        // Add more common latin1 mojibake fixes if needed based on typical patterns
        "Descripci¢n": "Descripción",
        "Im genes": "Imágenes",
        "C¢digo": "Código",
        "Categor¡as": "Categorías",
        "Opci¢n": "Opción",
        "m s": "más",
        "f cil": "fácil",
        "pr ximo": "próximo",
        "T¡tulo": "Título",
        // Extended legacy fixes
        "Ö": "Í", // DÖAS -> DÍAS
        "¢": "ó", // Descripci¢n -> Descripción (redundant but safe)
        "£": "ú",
        "à": "Ó",
        "µ": "á", // LµSER -> LÁSER
        "¥": "Ñ",
        "¤": "ñ",
        "¡": "í",
        "‚": "é"
    };

    // Apply specific replacements
    // We iterate over keys. For "l ser", we match it carefully.
    // The issue with "l ser" is that if we already collapsed spaces, it is "l ser".
    // If the original had NBSP, it's now "l ser".

    // Check known mojibake words
    for (const [bad, good] of Object.entries(replacements)) {
        if (cleaned.includes(bad)) {
            cleaned = cleaned.split(bad).join(good);
        }
    }

    // Generic fix for "l ser" which is likely "láser"
    // Be careful not to replace valid "l ser" usage? Unlikely in this context.
    // "grabada a l ser" -> "grabada a láser"
    if (cleaned.includes("l ser")) {
        cleaned = cleaned.replace(/l ser/g, "láser");
    }

    return cleaned;
}

// 3. Slugify (Stable)
function slugify(text) {
    if (!text) return "";
    return text
        .toString()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

// 4. Robust CSV Parser (State Machine for Quoted Newlines)
function parseCSV(content) {
    const rows = [];
    let currentRow = [];
    let currentField = '';
    let inQuote = false;
    let i = 0;

    // Normalize line endings to \n for easier processing
    // Use a temp buffer or just handle \r\n
    // Let's just iterate

    while (i < content.length) {
        const char = content[i];
        const nextChar = content[i + 1];

        if (char === '"') {
            // Check for escaped quote ""
            if (inQuote && nextChar === '"') {
                currentField += '"';
                i++; // Skip next quote
            } else {
                inQuote = !inQuote;
            }
        } else if (char === ';' && !inQuote) {
            // End of field
            currentRow.push(currentField);
            currentField = '';
        } else if ((char === '\r' || char === '\n') && !inQuote) {
            // End of row
            // Handle \r\n
            if (char === '\r' && nextChar === '\n') {
                i++;
            }
            currentRow.push(currentField);
            rows.push(currentRow);
            currentRow = [];
            currentField = '';
        } else {
            currentField += char;
        }
        i++;
    }

    // Push last row if exists
    if (currentRow.length > 0 || currentField.length > 0) {
        currentRow.push(currentField);
        rows.push(currentRow);
    }

    if (rows.length === 0) return { headers: [], data: [] };

    // Headers are first row
    const headers = rows[0].map(h => cleanText(h.trim())); // Clean headers

    // Helper to clean fields (remove surrounding quotes if any left? No, state machine handles content)
    // Actually, my state machine accumulates content *inside* or *outside* quotes.
    // If I want to strip enclosing quotes, I should do it.
    // My logic above adds *everything* except the toggling quotes.
    // Wait. `if (char === '"')`.
    // Use standard CSV: "value" -> value. "val""ue" -> val"ue.
    // My logic:
    // If quote, toggle. It does NOT add the quote to currentField.
    // If escaped quote `""`, it adds one `"` and skips.
    // This correctly strips enclosing quotes and unescapes inner quotes.
    // BUT what about unquoted fields? `value` -> value.
    // Correct.

    const data = [];
    for (let j = 1; j < rows.length; j++) {
        const values = rows[j];
        // Skip empty rows (length 1 and empty string)
        if (values.length === 1 && values[0].trim() === '') continue;

        const row = {};
        headers.forEach((h, idx) => {
            let val = values[idx] || "";
            // Apply text cleaning/trimming here?
            // Yes, trimming around the value?
            // For quoted fields, we want the exact content (maybe with newlines).
            // But we usually want to trim whitespace *around* the field if it wasn't quoted?
            // Standard CSV doesn't have whitespace around quoted fields usually. 
            // ` value ` -> " value ". `" value "` -> " value ".
            // Let's just trim for safety as cleanText does it.
            row[h] = cleanText(val); // cleanText trims
        });
        row._rowIndex = j + 1;
        data.push(row);
    }

    return { headers, data };
}

// --- MAIN LOGIC ---

function run() {
    console.log("Starting Import...");

    if (!fs.existsSync(INPUT_CSV)) {
        console.error(`Input file not found: ${INPUT_CSV}`);
        process.exit(1);
    }

    const content = readLatin1(INPUT_CSV);
    const { headers, data: rows } = parseCSV(content);

    console.log(`Parsed ${rows.length} rows.`);
    console.log(`Headers detected:`, headers);

    const products = [];
    const report = {
        total_rows: rows.length,
        header_rows: 0,
        option_rows: 0,
        products_count: 0,
        options_count: 0,
        missing_images_count: 0,
        missing_price_count: 0,
        warnings: []
    };

    const errors = [];

    // Helper to get column value fuzzy
    const getVal = (row, ...keys) => {
        for (const k of keys) {
            if (row[k] !== undefined) return cleanText(row[k]);
        }
        return "";
    };

    // Processing state
    let currentProduct = null;

    rows.forEach(row => {
        // Identification Logic
        // isHeaderRow = (ID != '' AND Nombre != '')
        // isOptionRow = (ID == '' AND Nombre == '' AND Nombre opci¢n != '')

        const id = getVal(row, "ID");
        const name = getVal(row, "Nombre", "Name");
        const optionName = getVal(row, "Nombre opci¢n", "Nombre opción", "Opción");

        const isHeader = (id !== "" && name !== "");
        const isOption = (id === "" && name === "" && optionName !== "");

        if (isHeader) {
            report.header_rows++;

            // Start new product
            const slug = slugify(name) + "-" + id;

            // Parse Categories
            // "A>B | A>B>C"
            const catRaw = getVal(row, "Categor¡as", "Categorías");
            let categoryPaths = [];
            let categoriesFlat = new Set();

            if (catRaw) {
                const parts = catRaw.split('|');
                parts.forEach(p => {
                    const path = p.trim().split('>').map(s => s.trim());
                    if (path.length > 0) {
                        categoryPaths.push(path);
                        path.forEach(node => categoriesFlat.add(node));
                    }
                });
            }

            // Images
            const imgRaw = getVal(row, "Im genes", "Imágenes"); // Note space in Im genes
            const imagesSource = imgRaw ? imgRaw.split(/[|,]/).map(s => s.trim()).filter(Boolean) : [];
            if (imagesSource.length === 0) report.missing_images_count++;

            // Tags
            const tagRaw = getVal(row, "Tags");
            let tags = [];
            if (tagRaw) {
                // prioriza | si existe, sino ,
                const delim = tagRaw.includes('|') ? '|' : ',';
                tags = tagRaw.split(delim).map(s => s.trim()).filter(Boolean);
            }

            // Price
            const priceStr = getVal(row, "Precio").replace(',', '.');
            const price = parseFloat(priceStr) || 0;
            if (price === 0) report.missing_price_count++;

            // Cost
            const costStr = getVal(row, "Coste").replace(',', '.');
            const cost = parseFloat(costStr) || 0;

            // Tax
            const taxStr = getVal(row, "Impuesto").replace(',', '.');
            const tax = parseFloat(taxStr) || 0;

            currentProduct = {
                id: id,
                name: name,
                slug: slug,
                descriptionHtml: getVal(row, "Descripci¢n", "Descripción"),
                shortDescriptionHtml: getVal(row, "Descripci¢n Corta", "Descripción Corta"),
                categoryPaths: categoryPaths,
                categoriesFlat: Array.from(categoriesFlat),
                variantName: getVal(row, "Nombre variante"),
                tax: tax,
                brand: getVal(row, "Marca"),
                status: getVal(row, "Estado"),
                featured: getVal(row, "En Portada") === "1",
                secondHand: getVal(row, "Segunda mano") === "1",
                marketingLabel: getVal(row, "R¢tulo de Marketing", "Rótulo de Marketing"),
                marketingLabelDate: getVal(row, "Fecha Etiq. Mark."),
                cost: cost,
                price: price,
                imagesSource: imagesSource,
                tags: tags,
                personalizationsRaw: getVal(row, "Personalizaciones"),
                options: []
            };

            products.push(currentProduct);
        } else if (isOption) {
            report.option_rows++;

            if (!currentProduct) {
                const msg = `Orphaned option row at line ${row._rowIndex}. No parent product.`;
                console.error(msg);
                errors.push({ rowIndex: row._rowIndex, reason: msg, snapshot: row });
                report.warnings.push(msg);
                return; // Skip
            }

            // Parse Option
            const priceStr = getVal(row, "Precio").replace(',', '.');
            const price = parseFloat(priceStr) || 0;

            const stockStr = getVal(row, "Stock").replace(',', '.');
            const stock = parseFloat(stockStr) || 0;

            const weightStr = getVal(row, "Peso").replace(',', '.');
            const weight = parseFloat(weightStr) || 0;

            const discValStr = getVal(row, "Valor Descuento").replace(',', '.');
            const discountValue = parseFloat(discValStr) || 0;

            // Effective Price Logic
            // if price>0 => price
            // else if product.price>0 => product.price
            // else 0
            let effectivePrice = 0;
            if (price > 0) effectivePrice = price;
            else if (currentProduct.price > 0) effectivePrice = currentProduct.price;

            const option = {
                label: optionName,
                price: price,
                stock: stock,
                weight: weight,
                discountType: getVal(row, "Tipo Descuento"),
                discountValue: discountValue,
                effectivePrice: effectivePrice
            };

            currentProduct.options.push(option);

        } else {
            // Empty or malformed row
            // If it has content but didn't match identification, warn
            const hasContent = Object.values(row).some(v => v !== "" && v !== row._rowIndex);
            if (hasContent) {
                const msg = `Unrecognized row type at line ${row._rowIndex}. Skipped.`;
                report.warnings.push(msg);
            }
        }
    });

    report.products_count = products.length;
    report.options_count = products.reduce((acc, p) => acc + p.options.length, 0);

    // Outputs
    fs.mkdirSync(path.dirname(OUTPUT_JSON), { recursive: true });
    fs.writeFileSync(OUTPUT_JSON, JSON.stringify(products, null, 2));

    fs.mkdirSync(path.dirname(OUTPUT_REPORT), { recursive: true });
    fs.writeFileSync(OUTPUT_REPORT, JSON.stringify(report, null, 2));
    fs.writeFileSync(OUTPUT_ERRORS, JSON.stringify(errors, null, 2));

    console.log(`Generated products.json with ${products.length} products.`);
    console.log(`Report saved to ${OUTPUT_REPORT}`);

    // STRICT CHECKS
    if (STRICT_MODE) {
        console.log("Running Strict Checks...");
        const failures = [];

        if (products.length === 0) failures.push("No products imported.");
        if (errors.length > 0) failures.push(`${errors.length} orphaned/error rows found.`);
        if (report.header_rows === 0) failures.push("No headers parsed.");

        // Scan for U+FFFD coverage
        const jsonContent = fs.readFileSync(OUTPUT_JSON, 'utf8');
        if (jsonContent.includes('\uFFFD')) {
            failures.push("Output contains Replacement Character (U+FFFD). Encoding issue.");
        }

        if (failures.length > 0) {
            console.error("\nSTRICT MODE FAILED:");
            failures.forEach(f => console.error(`- ${f}`));
            process.exit(1);
        }
    }
}

run();
