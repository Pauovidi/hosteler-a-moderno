/**
 * fix-images-from-export.js
 * Rellena el campo `images` (array de strings /media/...) en products.json
 * a partir de los JSON del export del scraper.
 * Matchea por: id numérico, slug exacto o slug parcial.
 *
 * Uso: node scripts/fix-images-from-export.js --export <ruta_export_root>
 */
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const exportIdx = args.indexOf('--export');
if (exportIdx === -1 || !args[exportIdx + 1]) {
    console.error('Uso: node scripts/fix-images-from-export.js --export <ruta_export_root>');
    process.exit(1);
}
const exportRoot = args[exportIdx + 1];
const productsDir = path.join(exportRoot, 'content', 'products');
const productsJsonPath = path.join(__dirname, '../lib/data/products.json');

if (!fs.existsSync(productsDir)) {
    console.error(`No existe: ${productsDir}`);
    process.exit(1);
}

// 1. Cargar todos los JSON del export → map por slug e id
const exportBySlug = new Map();
const exportById = new Map();
const exportFiles = fs.readdirSync(productsDir).filter(f => f.endsWith('.json') && f !== 'index.json');
for (const file of exportFiles) {
    const data = JSON.parse(fs.readFileSync(path.join(productsDir, file), 'utf8'));
    const slug = data.slug || file.replace('.json', '');
    const id = String(data.id || '');
    if (slug) exportBySlug.set(slug, data);
    if (id) exportById.set(id, data);
}
console.log(`Export: ${exportFiles.length} ficheros cargados, ${exportBySlug.size} slugs, ${exportById.size} ids`);

// 2. Cargar products.json del repo
const products = JSON.parse(fs.readFileSync(productsJsonPath, 'utf8'));
console.log(`Repo products.json: ${products.length} productos`);

// 3. Match y relleno
let matched = 0, alreadyHad = 0, noMatch = 0;
const fixed = products.map(p => {
    // Si ya tiene imágenes, no tocar
    if (p.images && Array.isArray(p.images) && p.images.length > 0) {
        alreadyHad++;
        return p;
    }

    // Buscar en export
    let exportData = exportBySlug.get(p.slug) || exportById.get(String(p.id));

    // Si no matchea por slug exacto, intentar slug del repo sin el ID al final
    if (!exportData && p.slug) {
        const slugWithoutId = p.slug.replace(/-\d+$/, '');
        exportData = exportBySlug.get(slugWithoutId);
    }

    if (!exportData) {
        noMatch++;
        return p;
    }

    // Extraer imágenes del export (array de objetos {src, alt} o strings)
    const rawImages = exportData.images || [];
    const imagePaths = rawImages
        .map(img => (typeof img === 'string' ? img : img?.src || ''))
        .filter(src => src && src.startsWith('/media/'));

    if (imagePaths.length === 0) {
        noMatch++;
        return p;
    }

    matched++;
    return { ...p, images: imagePaths, imagesSource: exportData.slug || p.slug };
});

// 4. Guardar
fs.writeFileSync(productsJsonPath, JSON.stringify(fixed, null, 2) + '\n', 'utf8');
console.log(`\nResultado:`);
console.log(`  matched + images rellenadas: ${matched}`);
console.log(`  ya tenían imágenes:          ${alreadyHad}`);
console.log(`  sin match:                   ${noMatch}`);
console.log(`\nproducts.json actualizado en ${productsJsonPath}`);
