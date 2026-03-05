import fs from "fs";
import path from "path";

const rootIdx = process.argv.indexOf("--root");
const repoRoot = rootIdx !== -1 ? process.argv[rootIdx + 1] : process.cwd();
const productsPath = path.join(repoRoot, "lib", "data", "products.json");
if (!fs.existsSync(productsPath)) {
    console.error("No encuentro:", productsPath);
    process.exit(1);
}
const mediaRoot = path.join(repoRoot, "public", "media", "products");

const products = JSON.parse(fs.readFileSync(productsPath, "utf8"));
const slugBase = (slug) => String(slug || "").replace(/-\d+$/, "");
const existsDir = (p) => {
    try { return fs.existsSync(p) && fs.statSync(p).isDirectory(); } catch { return false; }
};

const placeholders = products.filter((p) => {
    const img = p.image || "";
    const srcs = Array.isArray(p.imagesSource) ? p.imagesSource : [];
    return img === "/placeholder.svg" || srcs.length === 0;
});

const rows = placeholders.map((p) => {
    const base = slugBase(p.slug);
    const folderBase = path.join(mediaRoot, base);
    const folderSlug = path.join(mediaRoot, p.slug);

    return {
        id: String(p.id ?? ""),
        title: String(p.title ?? p.name ?? ""),
        slug: String(p.slug ?? ""),
        slugBase: base,
        legacyUrl: String(p.legacyUrl ?? ""),
        imagesSourceCount: Array.isArray(p.imagesSource) ? p.imagesSource.length : 0,
        image: String(p.image ?? ""),
        expectedFolder: `/public/media/products/${base}`,
        folderExists_slugBase: existsDir(folderBase),
        folderExists_fullSlug: existsDir(folderSlug),
    };
});

const outDir = path.join(repoRoot, "out");
fs.mkdirSync(outDir, { recursive: true });

const jsonOut = path.join(outDir, "placeholders_products.json");
fs.writeFileSync(jsonOut, JSON.stringify(rows, null, 2), "utf8");

// CSV
const csvOut = path.join(outDir, "placeholders_products.csv");
const headers = Object.keys(rows[0] ?? {
    id: "", title: "", slug: "", slugBase: "", legacyUrl: "", imagesSourceCount: 0, image: "", expectedFolder: "", folderExists_slugBase: false, folderExists_fullSlug: false
});
const esc = (v) => `"${String(v ?? "").replaceAll('"', '""')}"`;
const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => esc(r[h])).join(",")),
].join("\n");
fs.writeFileSync(csvOut, "\uFEFF" + csv, "utf8"); // BOM for Excel UTF-8

console.log(`Placeholders: ${rows.length}`);
console.log("JSON:", jsonOut);
console.log("CSV:", csvOut);
