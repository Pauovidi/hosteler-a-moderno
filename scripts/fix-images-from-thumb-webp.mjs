import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import os from "os";

const args = process.argv.slice(2);
const rootIdx = args.indexOf("--root");
const exportIdx = args.indexOf("--export");
const repo = rootIdx !== -1 ? path.resolve(args[rootIdx + 1]) : process.cwd();
const exportRoot = exportIdx !== -1 ? path.resolve(args[exportIdx + 1]) : null;

if (!exportRoot) {
    console.error("Usage: node scripts/fix-images-from-thumb-webp.mjs --export <exportRoot> [--root <repoRoot>]");
    process.exit(1);
}

const productsPath = path.join(repo, "lib", "data", "products.json");
const mediaProductsRoot = path.join(repo, "public", "media", "products");
const expIndexPath = path.join(exportRoot, "content", "products", "index.json");

const products = JSON.parse(fs.readFileSync(productsPath, "utf8"));
const expIndex = JSON.parse(fs.readFileSync(expIndexPath, "utf8"));
const byId = new Map(products.map((p) => [String(p.id), p]));

// ─── Python helper: write temp script once ───────────────────────────────────
const pyScript = path.join(os.tmpdir(), "thumb2webp.py");
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
maxw = 1200
if w > maxw:
    nh = int(h * (maxw / w))
    im = im.resize((maxw, nh), Image.LANCZOS)
im.save(out, 'WEBP', quality=82, method=6)
print('OK', out, im.size)
`
);

function ensureWebp(inputPath) {
    const dir = path.dirname(inputPath);
    const base = path.basename(inputPath);          // e.g. "01_sublym-jpg.thumb"
    const outName = base.replace(/\.thumb$/i, "") + ".webp"; // "01_sublym-jpg.webp"
    const outPath = path.join(dir, outName);
    if (fs.existsSync(outPath)) return outPath;     // already converted
    try {
        execFileSync("python", [pyScript, inputPath, outPath], { stdio: "pipe" });
        return fs.existsSync(outPath) ? outPath : null;
    } catch {
        return null;
    }
}

function orderKey(name) {
    const m = name.match(/^(\d{2})_/);
    return m ? Number(m[1]) : 99;
}

let matched = 0, withThumb = 0, updated = 0;
const total = products.length;

for (const it of expIndex) {
    const id = String(it.id ?? "");
    const p = byId.get(id);
    if (!p) continue;

    const folder = path.join(mediaProductsRoot, it.slug);
    if (!fs.existsSync(folder)) continue;

    matched++;

    const files = fs.readdirSync(folder).filter((f) =>
        fs.statSync(path.join(folder, f)).isFile()
    );

    // Select ONLY .thumb files — these are the real product images
    const thumbFiles = files
        .filter((f) => path.extname(f).toLowerCase() === ".thumb")
        .sort((a, b) => orderKey(a) - orderKey(b));

    const webps = [];
    for (const f of thumbFiles) {
        const inPath = path.join(folder, f);
        const outPath = ensureWebp(inPath);
        if (outPath) {
            // Build URL relative to public/
            const rel = "/" + path.relative(path.join(repo, "public"), outPath).replace(/\\/g, "/");
            webps.push(rel);
        }
    }

    if (webps.length > 0) {
        withThumb++;
        p.imagesSource = webps;
        p.image = webps[0];
    } else {
        p.imagesSource = [];
        p.image = "/placeholder.svg";
    }
    updated++;
}

fs.writeFileSync(productsPath, JSON.stringify(products, null, 2), "utf8");
console.log(JSON.stringify({ total, matched, updated, withThumb }, null, 2));
