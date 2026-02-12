const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');

// Configuration
const INPUT_JSON_PATH = path.join(__dirname, '../lib/data/generated-products.json');
const OUTPUT_JSON_PATH = path.join(__dirname, '../lib/data/generated-products.with-images.json');
const IMAGE_MAP_PATH = path.join(__dirname, '../out/image-map.json'); // Directory 'out' must exist
const PUBLIC_MEDIA_DIR = path.join(__dirname, '../public/media/products');

const CONCURRENCY_LIMIT = 5;
const USER_AGENT = 'Mozilla/5.0 (compatible; Bot/1.0)';

// Args
const args = process.argv.slice(2);
const IS_STRICT = args.includes('--strict');

// Optional Sharp
let sharp;
try {
    sharp = require('sharp');
    console.log("Optimization: Sharp detected. Images will be converted to WebP.");
} catch (e) {
    console.log("Optimization: Sharp NOT detected. Images will be saved as originals.");
}

// Ensure directories
function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}
ensureDir(path.dirname(IMAGE_MAP_PATH));
ensureDir(PUBLIC_MEDIA_DIR);

// Helper: Download File
function downloadFile(url, destPath) {
    return new Promise((resolve, reject) => {
        const proto = url.startsWith('https') ? https : http;
        const req = proto.get(url, { headers: { 'User-Agent': USER_AGENT } }, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                // Redirect
                downloadFile(res.headers.location, destPath).then(resolve).catch(reject);
                return;
            }
            if (res.statusCode !== 200) {
                reject(new Error(`Status ${res.statusCode}`));
                return;
            }

            const fileStream = fs.createWriteStream(destPath);
            res.pipe(fileStream);
            fileStream.on('finish', () => {
                fileStream.close();
                resolve();
            });
            fileStream.on('error', (err) => {
                fs.unlink(destPath, () => { });
                reject(err);
            });
        });

        req.on('error', (err) => {
            fs.unlink(destPath, () => { });
            reject(err);
        });
        req.on('timeout', () => {
            req.destroy();
            reject(new Error("Timeout"));
        });
        req.setTimeout(10000);
    });
}

// Helper: Process Single Image
async function processImage(url, productId, index) {
    if (!url || !url.startsWith('http')) return null;

    try {
        const ext = path.extname(new URL(url).pathname) || '.jpg';
        const filename = `${index}${ext}`;
        const productDir = path.join(PUBLIC_MEDIA_DIR, productId);
        ensureDir(productDir);

        const rawDest = path.join(productDir, filename);

        // Download
        if (!fs.existsSync(rawDest)) {
            await downloadFile(url, rawDest);
        }

        // Optimize if Sharp
        let finalPath = rawDest;
        let webpFilename = `${index}.webp`;
        let webpDest = path.join(productDir, webpFilename);

        if (sharp) {
            try {
                await sharp(rawDest)
                    .resize({ width: 1200, withoutEnlargement: true }) // Reasonable max width
                    .webp({ quality: 80 })
                    .toFile(webpDest);

                // If successful, use webp. we can keep or delete original.
                // Requirement: "mantener original solo si hace falta".
                // Let's keep original for now as source of truth or backup, but return webp path.
                finalPath = webpDest;
            } catch (optErr) {
                console.warn(`    Warning: Optimization failed for ${url}: ${optErr.message}`);
            }
        }

        // Return local public path
        const relativePath = path.relative(path.join(__dirname, '../public'), finalPath).replace(/\\/g, '/');
        return '/' + relativePath;

    } catch (error) {
        throw new Error(`Failed to download ${url}: ${error.message}`);
    }
}

// Main
async function main() {
    console.log("Starting Image Sync Pipeline...");
    if (IS_STRICT) console.log("Mode: STRICT (will fail on errors)");

    if (!fs.existsSync(INPUT_JSON_PATH)) {
        console.error(`Input file not found: ${INPUT_JSON_PATH}`);
        process.exit(1);
    }

    const products = JSON.parse(fs.readFileSync(INPUT_JSON_PATH, 'utf8'));
    console.log(`Loaded ${products.length} products.`);

    const imageMap = {}; // url -> localPath
    const stats = { total: 0, downloaded: 0, failed: 0, skipped: 0 };
    const queue = [];

    // 1. Identify all unique images
    console.log("Scanning for images...");
    const tasks = [];

    for (const p of products) {
        const candidates = [p.image, ...(p.imageUrls || [])];
        const uniqueUrls = [...new Set(candidates.filter(u => u && u.startsWith('http')))];

        uniqueUrls.forEach((url, idx) => {
            if (!imageMap[url]) { // Avoid processing duplicate URLs globally if desired
                // But we want to structure by ProductID. 
                // If URL is reused across products, we might download it twice or map it to first product.
                // Requirement: "Evite duplicados (dedup por URL, y reutiliza el mismo archivo si se repite)"

                // We'll queue it. If it's already in map, we skip executing download but we need to assign path.
                // Wait, if we dedup by URL, we need a single storage location or map to one product's folder.
                // But structure is /media/products/<productId>.
                // If URL X is in Product A and Product B, we should probably verify if we want to copy it or link it.
                // Simple approach: Store in the first product's folder encountered, and point others there.

                imageMap[url] = { status: 'pending', productId: p.id, index: idx };
                tasks.push({ url, productId: p.id, index: idx });
            }
        });
    }

    stats.total = tasks.length;
    console.log(`Found ${stats.total} unique external images to process.`);

    // 2. Process Queue with Concurrency
    async function worker() {
        while (tasks.length > 0) {
            const task = tasks.shift();
            const { url, productId, index } = task;

            console.log(`[${stats.downloaded + stats.failed + 1}/${stats.total}] Processing: ${url}`);

            try {
                const localPath = await processImage(url, productId, index);
                imageMap[url] = localPath; // Update map with string path
                stats.downloaded++;
            } catch (err) {
                console.error(`  Error: ${err.message}`);
                imageMap[url] = null; // Mark failure
                stats.failed++;
            }
        }
    }

    const workers = [];
    for (let i = 0; i < CONCURRENCY_LIMIT; i++) {
        workers.push(worker());
    }
    await Promise.all(workers);

    // 3. Update Products
    console.log("Updating product data...");
    const updatedProducts = products.map(p => {
        const newP = { ...p };

        // Main Image
        if (p.image && p.image.startsWith('http')) {
            const local = imageMap[p.image];
            if (local) {
                newP.image = local;
                newP.imageLocal = local;
                newP.imageSourceUrl = p.image;
            }
        }

        // Image URLs
        if (p.imageUrls && p.imageUrls.length > 0) {
            newP.imageUrls = p.imageUrls.map(u => {
                if (u.startsWith('http')) {
                    return imageMap[u] || u;
                }
                return u;
            });
            // Also add imagesLocal for convenience
            newP.imagesLocal = p.imageUrls.map(u => (u.startsWith('http') ? imageMap[u] : null)).filter(Boolean);
        }

        return newP;
    });

    // 4. Save Outputs
    fs.writeFileSync(OUTPUT_JSON_PATH, JSON.stringify(updatedProducts, null, 2));
    fs.writeFileSync(IMAGE_MAP_PATH, JSON.stringify(imageMap, null, 2));

    console.log("\n--- Summary ---");
    console.log(`Total: ${stats.total}`);
    console.log(`Success: ${stats.downloaded}`);
    console.log(`Failed: ${stats.failed}`);
    console.log(`Saved products to: ${OUTPUT_JSON_PATH}`);
    console.log(`Saved map to: ${IMAGE_MAP_PATH}`);

    if (stats.failed > 0) {
        if (IS_STRICT) {
            console.error("FAIL: Strict mode enabled and failures detected.");
            process.exit(1);
        } else {
            console.warn("WARN: Failures detected but strict mode disabled.");
        }
    }
}

main().catch(err => {
    console.error("Fatal Error:", err);
    process.exit(1);
});
