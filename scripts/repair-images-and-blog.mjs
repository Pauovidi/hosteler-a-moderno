import fs from "fs";
import path from "path";

const repoRoot = process.argv.indexOf("--root") !== -1
    ? process.argv[process.argv.indexOf("--root") + 1]
    : process.cwd();
const exportIdx = process.argv.indexOf("--export");
const exportRoot = exportIdx !== -1 ? process.argv[exportIdx + 1] : null;

if (!exportRoot) {
    console.error("Usage: node scripts/repair-images-and-blog.mjs --export <exportRoot>");
    process.exit(1);
}

const productsJsonPath = path.join(repoRoot, "lib", "data", "products.json");
const blogJsonPath = path.join(repoRoot, "lib", "data", "generated-blog.json");
const expProductsIndex = path.join(exportRoot, "content", "products", "index.json");
const expProductsDir = path.join(exportRoot, "content", "products");
const expPostsIndex = path.join(exportRoot, "content", "posts", "index.json");
const expPostsDir = path.join(exportRoot, "content", "posts");

// ─── Products ────────────────────────────────────────────────────────────────

const products = JSON.parse(fs.readFileSync(productsJsonPath, "utf8"));
const expIndex = JSON.parse(fs.readFileSync(expProductsIndex, "utf8"));

const byId = new Map(products.map((p) => [String(p.id), p]));

const badKw = [
    "logo", "facebook", "instagram", "twitter", "linkedin", "pinterest",
    "youtube", "tiktok", "whatsapp", "transparent", "blank", "placeholder",
    "icon", "sprite", "camion", "truck", "presupuesto", "presupuestos",
    "carrito", "compra", "default", "generico", "servilleta", "canguro",
    "airlaid", "miniservice", "-qr", " qr",
];

function isBad(src) {
    const s = src.toLowerCase();
    return badKw.some((k) => s.includes(k));
}

function isValid(src) {
    return (
        typeof src === "string" &&
        /\.(png|jpe?g|webp|avif|gif)$/i.test(src) &&
        !src.endsWith(".thumb")
    );
}

function prefixOk(src) {
    const m = src.match(/\/(\d{2})_/);
    return m ? Number(m[1]) >= 20 : false;
}

let matched = 0, updated = 0;

for (const item of expIndex) {
    const id = String(item.id ?? "");
    const p = byId.get(id);
    if (!p) continue;

    const expFile = path.join(expProductsDir, `${item.slug}.json`);
    if (!fs.existsSync(expFile)) continue;

    const exp = JSON.parse(fs.readFileSync(expFile, "utf8"));

    // images can be [{src, alt}] objects or plain strings
    const rawImgs = Array.isArray(exp.images) ? exp.images : [];
    const srcs = rawImgs
        .map((x) => (typeof x === "string" ? x : x?.src))
        .filter(Boolean);

    const clean = srcs
        .filter(isValid)
        .filter((s) => s.includes("/media/products/"))
        .filter(prefixOk)
        .filter((s) => !isBad(s));

    matched++;
    if (clean.length > 0) {
        p.imagesSource = clean;
        p.image = clean[0];
        updated++;
    } else {
        p.imagesSource = [];
        p.image = "/placeholder.svg";
    }
}

fs.writeFileSync(productsJsonPath, JSON.stringify(products, null, 2), "utf8");

// ─── Blog ─────────────────────────────────────────────────────────────────────

const postsOut = [];

if (fs.existsSync(expPostsIndex)) {
    const postsIndex = JSON.parse(fs.readFileSync(expPostsIndex, "utf8"));

    // Only include real long-form posts — skip thin "t-" landing pages
    const longPosts = postsIndex.filter((it) => !it.slug.startsWith("t-"));

    for (const it of longPosts) {
        const fp = path.join(expPostsDir, `${it.slug}.mdx`);
        if (!fs.existsSync(fp)) continue;

        const raw = fs.readFileSync(fp, "utf8");

        // Strip frontmatter --- ... --- and use the remainder as HTML body
        let body = raw;
        const fmMatch = raw.match(/^---\s*\n[\s\S]*?\n---\s*\n([\s\S]*)$/);
        if (fmMatch) body = fmMatch[1].trim();

        // excerpt: first plain-text paragraph, max 180 chars
        let excerpt = it.excerpt ?? "";
        if (!excerpt) {
            const pMatch = body.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
            if (pMatch) {
                excerpt = pMatch[1]
                    .replace(/<[^>]+>/g, "")
                    .replace(/&[a-z]+;/gi, " ")
                    .trim()
                    .slice(0, 180);
            }
        }

        const authorName = "Personalizados Hostelería";
        const publishedAt = it.date
            ? new Date(it.date).toISOString()
            : new Date(0).toISOString();

        postsOut.push({
            id: String(it.id ?? ""),
            slug: it.slug,
            title: it.title ?? it.slug,
            excerpt: excerpt || "",
            contentHtml: body,
            featuredImageUrl: it.coverImage ?? null,
            authorName,
            publishedAt,
            updatedAt: publishedAt,
        });
    }
}

fs.writeFileSync(blogJsonPath, JSON.stringify(postsOut, null, 2), "utf8");

// ─── Summary ──────────────────────────────────────────────────────────────────

const withImages = products.filter(
    (p) => Array.isArray(p.imagesSource) && p.imagesSource.length > 0
).length;

console.log(
    JSON.stringify(
        {
            productsTotal: products.length,
            matchedExport: matched,
            updatedWithImages: updated,
            productsWithImages: withImages,
            posts: postsOut.length,
        },
        null,
        2
    )
);
