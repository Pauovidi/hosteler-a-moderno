import fs from "fs";
import path from "path";
import os from "os";
import { execFileSync } from "child_process";

const rootIdx = process.argv.indexOf("--root");
const repo = rootIdx !== -1 ? path.resolve(process.argv[rootIdx + 1]) : process.cwd();

const productsPath = path.join(repo, "lib", "data", "products.json");
const mediaRoot = path.join(repo, "public", "media", "products");

const products = JSON.parse(fs.readFileSync(productsPath, "utf8"));

const folderSet = new Set(
    fs.existsSync(mediaRoot)
        ? fs.readdirSync(mediaRoot).filter((d) =>
            fs.statSync(path.join(mediaRoot, d)).isDirectory()
        )
        : []
);

const thumbExt = /\.thumb$/i;
const dotExtOk = /\.(webp|png|jpe?g|avif|gif)$/i;

function slugBase(slug) {
    return String(slug || "").replace(/-\d+$/, "");
}

function getPrefixNum(name) {
    const m = String(name).match(/^(\d{2})_/);
    return m ? Number(m[1]) : 99;
}

// Write Python helper once to a temp file (Windows-compatible, no heredoc)
const pyScript = path.join(os.tmpdir(), "thumb2webp_repair.py");
fs.writeFileSync(
    pyScript,
    `import sys, io
from PIL import Image
inp, out = sys.argv[1], sys.argv[2]
data = open(inp, 'rb').read()
im = Image.open(io.BytesIO(data))
if im.mode in ('P', 'RGBA', 'LA', 'CMYK'):
    im = im.convert('RGB')
w, h = im.size
if w > 1200:
    im = im.resize((1200, int(h * 1200 / w)), Image.LANCZOS)
im.save(out, 'WEBP', quality=82, method=6)
`
);

function ensureWebpFromThumb(inPath) {
    const outPath = inPath.replace(/\.thumb$/i, ".webp");
    if (fs.existsSync(outPath)) return outPath;
    try {
        execFileSync("python", [pyScript, inPath, outPath], { stdio: "pipe" });
        return fs.existsSync(outPath) ? outPath : null;
    } catch {
        return null;
    }
}

let total = products.length;
let hadFolder = 0, updated = 0, withImages = 0, stillPlaceholder = 0;

for (const p of products) {
    const base = slugBase(p.slug);

    if (!base || !folderSet.has(base)) {
        p.imagesSource = [];
        p.image = "/placeholder.svg";
        stillPlaceholder++;
        updated++;
        continue;
    }

    hadFolder++;
    const folder = path.join(mediaRoot, base);
    const files = fs
        .readdirSync(folder)
        .filter((f) => fs.statSync(path.join(folder, f)).isFile());

    // 1) Use existing .webp files (already converted from previous run)
    let webps = files.filter((f) => f.toLowerCase().endsWith(".webp"));

    // 2) If none yet, convert any .thumb files now
    if (webps.length === 0) {
        const thumbs = files.filter((f) => thumbExt.test(f));
        for (const t of thumbs) {
            const out = ensureWebpFromThumb(path.join(folder, t));
            if (out) webps.push(path.basename(out));
        }
    }

    // 3) Sort by numeric prefix and build URLs
    webps = webps
        .filter((f) => dotExtOk.test(f))
        .sort((a, b) => getPrefixNum(a) - getPrefixNum(b));

    if (webps.length > 0) {
        const urls = webps.map((f) => `/media/products/${base}/${f}`);
        p.imagesSource = urls;
        p.image = urls[0];
        withImages++;
    } else {
        p.imagesSource = [];
        p.image = "/placeholder.svg";
        stillPlaceholder++;
    }
    updated++;
}

fs.writeFileSync(productsPath, JSON.stringify(products, null, 2), "utf8");
console.log(JSON.stringify({ total, hadFolder, updated, withImages, stillPlaceholder }, null, 2));
