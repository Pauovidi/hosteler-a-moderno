const fs = require('fs');
const path = require('path');

const INPUT_CSV_PATH = path.join(__dirname, '../data/exportBlog.csv');
const OUTPUT_JSON_PATH = path.join(__dirname, '../out/blog-posts.json');
const TARGET_LIB_PATH = path.join(__dirname, '../lib/data/generated-blog.json');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readTextSmart(buffer) {
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
  return isUtf8 ? buffer.toString('utf8') : buffer.toString('latin1');
}

function parseCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (ch === '"') {
      const next = line[i + 1];
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === ';' && !inQuotes) {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += ch;
  }

  values.push(current.trim());
  return values;
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const headers = parseCsvLine(lines[0]).map((h) => h.replace(/^"|"$/g, ''));
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const rawValues = parseCsvLine(lines[i]).map((v) => v.replace(/^"|"$/g, ''));
    const row = {};
    headers.forEach((header, idx) => {
      row[header] = rawValues[idx] || '';
    });
    rows.push(row);
  }

  return rows;
}

function slugify(input) {
  return String(input || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toUtcIso(dateStr) {
  const match = String(dateStr || '').trim().match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/);
  if (!match) return null;

  const [, dd, mm, yyyy, hh, min] = match;
  const utc = Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd), Number(hh), Number(min), 0, 0);
  return new Date(utc).toISOString();
}

function createContentHtml(title) {
  return `<p><strong>${title}</strong></p><p>Contenido pendiente de importación. Si quieres información sobre este tema, contáctanos y te ayudamos.</p>`;
}

function main() {
  console.log('Starting blog build from CSV...');

  if (!fs.existsSync(INPUT_CSV_PATH)) {
    console.error(`Input file not found: ${INPUT_CSV_PATH}`);
    process.exit(1);
  }

  ensureDir(path.dirname(OUTPUT_JSON_PATH));
  ensureDir(path.dirname(TARGET_LIB_PATH));

  const rawBuffer = fs.readFileSync(INPUT_CSV_PATH);
  const text = readTextSmart(rawBuffer);
  const rows = parseCSV(text);

  const publishedRows = rows.filter((row) => String(row['Estado'] || '').trim() === 'Publicado');

  const normalized = publishedRows
    .map((row) => {
      const title = String(row['Titulo'] || '').trim();
      const publishedAt = toUtcIso(row['Fecha Creacion']);
      const updatedAt = toUtcIso(row['Fecha Actualizacion']) || publishedAt;

      if (!title || !publishedAt) return null;

      return {
        title,
        slugBase: slugify(title),
        publishedAt,
        updatedAt,
      };
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .map((item, idx) => ({
      id: String(idx + 1),
      slug: `${idx + 1}-${item.slugBase}`,
      title: item.title,
      excerpt: `Artículo: ${item.title}`,
      contentHtml: createContentHtml(item.title),
      featuredImageUrl: null,
      authorName: 'Personalizados Hostelería',
      publishedAt: item.publishedAt,
      updatedAt: item.updatedAt,
    }));

  fs.writeFileSync(OUTPUT_JSON_PATH, JSON.stringify(normalized, null, 2));
  fs.writeFileSync(TARGET_LIB_PATH, JSON.stringify(normalized, null, 2));

  console.log(`Generated ${normalized.length} blog posts.`);
  console.log(`Saved: ${OUTPUT_JSON_PATH}`);
  console.log(`Saved: ${TARGET_LIB_PATH}`);
}

migrate();
