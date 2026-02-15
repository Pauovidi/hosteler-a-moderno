const fs = require('fs');
const path = require('path');

const INPUT_CSV_PATH = path.join(__dirname, '../data/exportBlog.csv');
const OUTPUT_JSON_PATH = path.join(__dirname, '../lib/data/generated-blog.json');

function parseCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      const next = line[i + 1];
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ';' && !inQuotes) {
      values.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current);
  return values.map((value) => value.trim());
}

function parseCsv(content) {
  const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map((header) => header.replace(/^"|"$/g, ''));

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line).map((value) => value.replace(/^"|"$/g, ''));
    const row = {};

    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    return row;
  });
}

function parseDateToUtcIso(value) {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/);
  if (!match) return null;

  const [, day, month, year, hours, minutes] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hours), Number(minutes)));
  return date.toISOString();
}

function slugify(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function migrate() {
  if (!fs.existsSync(INPUT_CSV_PATH)) {
    throw new Error(`Input file not found: ${INPUT_CSV_PATH}`);
  }

  const csv = fs.readFileSync(INPUT_CSV_PATH, 'utf8');
  const rows = parseCsv(csv);

  const publishedRows = rows.filter((row) => row.Estado === 'Publicado');

  const posts = publishedRows
    .map((row, index) => {
      const title = row.Titulo;
      const slugBase = slugify(title);
      const publishedAt = parseDateToUtcIso(row['Fecha Creacion']);
      const updatedAt = parseDateToUtcIso(row['Fecha Actualizacion']) || publishedAt;

      if (!title || !publishedAt) {
        return null;
      }

      return {
        id: String(index + 1),
        slug: `${index + 1}-${slugBase}`,
        title,
        excerpt: `Artículo: ${title}`,
        contentHtml: `<p><strong>${title}</strong></p><p>Contenido pendiente de importación. Si quieres información sobre este tema, contáctanos y te ayudamos.</p>`,
        featuredImageUrl: null,
        authorName: 'Personalizados Hostelería',
        publishedAt,
        updatedAt,
      };
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  fs.writeFileSync(OUTPUT_JSON_PATH, `${JSON.stringify(posts, null, 2)}\n`);
  console.log(`Generated ${posts.length} blog posts at ${OUTPUT_JSON_PATH}`);
}

migrate();
