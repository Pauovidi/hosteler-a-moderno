const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');

// Configuration
const INPUT_CSV_PATH = path.join(__dirname, '../data/exportBlog.csv');
const OUTPUT_JSON_PATH = path.join(__dirname, '../out/blog-posts.json');
const TARGET_LIB_PATH = path.join(__dirname, '../lib/data/generated-blog.json');

// Ensure directories
function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}
ensureDir(path.dirname(OUTPUT_JSON_PATH));

// Decoding Helper (Same as migrate-data.js)
function readTextSmart(buffer) {
    // Detect if valid UTF-8
    let isUtf8 = true;
    for (let i = 0; i < buffer.length; i++) {
        const byte = buffer[i];
        if ((byte & 0x80) === 0) continue;
        if ((byte & 0xE0) === 0xC0) {
            if (i + 1 >= buffer.length || (buffer[i + 1] & 0xC0) !== 0x80) { isUtf8 = false; break; }
            i += 1;
        } else if ((byte & 0xF0) === 0xE0) {
            if (i + 2 >= buffer.length || (buffer[i + 1] & 0xC0) !== 0x80 || (buffer[i + 2] & 0xC0) !== 0x80) { isUtf8 = false; break; }
            i += 2;
        } else if ((byte & 0xF8) === 0xF0) {
            if (i + 3 >= buffer.length || (buffer[i + 1] & 0xC0) !== 0x80 || (buffer[i + 2] & 0xC0) !== 0x80 || (buffer[i + 3] & 0xC0) !== 0x80) { isUtf8 = false; break; }
            i += 3;
        } else {
            isUtf8 = false;
            break;
        }
    }

    if (isUtf8) return buffer.toString('utf8');
    return buffer.toString('latin1');
}

// Simple CSV Parser (Semicolon)
function parseCSV(text) {
    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length === 0) return [];

    const headers = lines[0].split(';').map(h => h.trim().replace(/^"|"$/g, ''));
    const result = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        // Note: This simple split fails if quotes contain semicolons.
        // But for this legacy export, it seems sufficient based on product migration.
        // If needed, we can use a library, but sticking to "no extra deps".
        const values = line.split(';');
        const row = {};

        headers.forEach((h, idx) => {
            let val = values[idx] || '';
            val = val.trim().replace(/^"|"$/g, '');
            row[h] = val;
        });
        result.push(row);
    }
    return result;
}

// Slugify
function slugify(text) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start
        .replace(/-+$/, '');            // Trim - from end
}

// Main Map
function mapPost(row, index) {
    // Map CSV columns to BlogPost
    // CSV Headers seen: Título;Estado;Comentarios;Fecha Creación;Fecha Actualización;
    // We assume there's a content column, probably "Contenido" or similar, 
    // but the `Get-Content` output was truncated.
    // Let's assume standard headers or try to find them dynamically.

    // Fallback if headers are missing/weird
    const title = row['Título'] || row['Title'] || `Untitled Post ${index}`;
    const date = row['Fecha Creación'] || row['Date'] || new Date().toISOString();
    const content = row['Contenido'] || row['Content'] || row['Body'] || '<p>Contenido no disponible.</p>';

    // Clean content
    // Minimal dangerous tag removal
    const cleanContent = content
        .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
        .replace(/on\w+="[^"]*"/g, "");

    return {
        id: (index + 1).toString(),
        slug: slugify(title),
        title: title,
        excerpt: cleanContent.substring(0, 150).replace(/<[^>]*>?/gm, '') + '...',
        content: cleanContent,
        date: date,
        author: 'Palbin', // Default
        image: '/placeholder.svg', // Default
        tags: [],
        legacyPath: '', // Can be populated if header exists
        metaTitle: title,
        metaDescription: ''
    };
}

async function main() {
    console.log("Starting Blog Migration...");

    if (!fs.existsSync(INPUT_CSV_PATH)) {
        console.error(`Input file not found: ${INPUT_CSV_PATH}`);
        console.log("Usage: node scripts/blog-migrate.js");
        process.exit(1);
    }

    // Read and Decode
    const rawBuffer = fs.readFileSync(INPUT_CSV_PATH);
    const text = readTextSmart(rawBuffer);

    // Parse
    const rawData = parseCSV(text);
    console.log(`Parsed ${rawData.length} rows.`);

    // Map
    const posts = rawData.map((row, i) => mapPost(row, i));

    // Save
    fs.writeFileSync(OUTPUT_JSON_PATH, JSON.stringify(posts, null, 2));
    // Also update lib/data/generated-blog.json for app usage
    fs.writeFileSync(TARGET_LIB_PATH, JSON.stringify(posts, null, 2));

    console.log(`Successfully migrated ${posts.length} posts.`);
    console.log(`Saved to ${OUTPUT_JSON_PATH} and ${TARGET_LIB_PATH}`);
}

main();
