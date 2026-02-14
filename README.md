# Palbin Replication Project

## Getting Started (One Truth)

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Build the real catalog data (from CSV)**
   ```bash
   npm run data:build
   ```
   This generates:
   - `lib/data/products.json`
   - `out/import-report.json`
   - `out/import-errors.json`

3. **(Optional) Legacy product redirects**
   - Create `data/legacy-map.csv` with:
     ```csv
     key;legacyPath
     7295638;/ruta-antigua.html
     ```
     Where `key` is the product `id` from `products.json`.
   - Then run:
     ```bash
     npm run legacy:build
     ```
     This generates `out/redirects.json` (used by `next.config.mjs`).

4. **Run the dev server**
   ```bash
   npm run dev
   ```

## Environment

- `NEXT_PUBLIC_WHATSAPP_PHONE`: WhatsApp number in international format (digits only).
  - Example: `34693039422`


## Scripts

- `npm run data:build` / `npm run data:build:strict`: Import real catalog from `data/exportProducts.csv` to `lib/data/products.json`.
- `npm run legacy:build` / `npm run legacy:build:strict`: Generate legacy 301 redirects to `out/redirects.json` (requires `data/legacy-map.csv`).
- `npm run build`: Build for production.
- `npm run start`: Start production server.

## Legacy URLs

- **Products (301)**: `/old-url.html` -> `/producto/<slug>` (generated via `scripts/legacy-urls.js` + `data/legacy-map.csv`).
- **Categories (rewrite + canonical)**: `/c123-slug.html` -> internal `/legacy-category/123?slug=slug`
  - Mapping lives in `data/legacy-landing-map.json`.
  - Canonical is set to the **legacy URL itself** (`/c123-slug.html`).

## Data Flow

- **Source**: `data/exportProducts.csv`
- **Output (official)**: `lib/data/products.json`
- **Frontend**: consumes the official JSON via `lib/data/products.ts`
