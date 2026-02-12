import 'server-only';

import fs from 'fs';
import path from 'path';

export type ProductOption = {
  label: string;
  price: number;
  effectivePrice: number;
  stock: number;
  weight: number;
  discountType?: string;
  discountValue?: number;
};

export type Product = {
  id: string;
  slug: string;
  title: string;

  descriptionHtml?: string;
  shortDescriptionHtml?: string;

  categoryPaths: string[];
  categoriesFlat: string[];

  image?: string;
  images?: string[];

  price?: number;
  options: ProductOption[];

  tax?: string;
  brand?: string;
  status?: string;
  featured?: boolean;
  secondHand?: boolean;
  marketingLabel?: string;
  marketingLabelDate?: string;
  cost?: number;
  tags?: string[];
  personalizationsRaw?: string;
};

type RawProduct = {
  id: string | number;
  name?: string;
  title?: string;
  slug?: string;
  descriptionHtml?: string;
  shortDescriptionHtml?: string;
  categoryPaths?: string[];
  categoriesFlat?: string[];
  imagesSource?: string[];
  image?: string;
  price?: number;
  options?: Array<{
    label?: string;
    price?: number;
    effectivePrice?: number;
    stock?: number;
    weight?: number;
    discountType?: string;
    discountValue?: number;
  }>;
  tax?: string;
  brand?: string;
  status?: string;
  featured?: boolean;
  secondHand?: boolean;
  marketingLabel?: string;
  marketingLabelDate?: string;
  cost?: number;
  tags?: string[];
  personalizationsRaw?: string;
};

let _cache: Product[] | null = null;

function computeBestPrice(raw: RawProduct): number | undefined {
  if (typeof raw.price === 'number' && raw.price > 0) return raw.price;

  const opts = Array.isArray(raw.options) ? raw.options : [];
  const prices = opts
    .map((o) => (typeof o.effectivePrice === 'number' ? o.effectivePrice : (typeof o.price === 'number' ? o.price : 0)))
    .filter((v) => typeof v === 'number' && v > 0);

  if (prices.length === 0) return 0;
  return Math.min(...prices);
}

function toProduct(raw: RawProduct): Product {
  const images = Array.isArray(raw.imagesSource) ? raw.imagesSource.filter(Boolean) : [];
  const image = raw.image || images[0];

  const title = raw.title || raw.name || '';

  return {
    id: String(raw.id ?? ''),
    slug: String(raw.slug ?? ''),
    title,

    descriptionHtml: raw.descriptionHtml || '',
    shortDescriptionHtml: raw.shortDescriptionHtml || '',

    categoryPaths: Array.isArray(raw.categoryPaths) ? raw.categoryPaths : [],
    categoriesFlat: Array.isArray(raw.categoriesFlat) ? raw.categoriesFlat : [],

    images,
    image,

    price: computeBestPrice(raw),

    options: Array.isArray(raw.options)
      ? raw.options.map((o) => ({
          label: String(o.label ?? ''),
          price: Number(o.price ?? 0),
          effectivePrice: Number(o.effectivePrice ?? o.price ?? 0),
          stock: Number(o.stock ?? 0),
          weight: Number(o.weight ?? 0),
          discountType: o.discountType,
          discountValue: typeof o.discountValue === 'number' ? o.discountValue : Number(o.discountValue ?? 0),
        }))
      : [],

    tax: raw.tax,
    brand: raw.brand,
    status: raw.status,
    featured: raw.featured,
    secondHand: raw.secondHand,
    marketingLabel: raw.marketingLabel,
    marketingLabelDate: raw.marketingLabelDate,
    cost: typeof raw.cost === 'number' ? raw.cost : Number(raw.cost ?? 0),
    tags: raw.tags,
    personalizationsRaw: raw.personalizationsRaw,
  };
}

export function getAllProducts(): Product[] {
  if (_cache) return _cache;

  const filePath = path.join(process.cwd(), 'lib/data/products.json');
  if (!fs.existsSync(filePath)) {
    console.warn(`[products] Missing ${filePath}. Did prebuild run? Returning empty list.`);
    _cache = [];
    return _cache;
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(raw);
  const list: RawProduct[] = Array.isArray(data) ? data : [];
  _cache = list.map(toProduct);
  return _cache;
}

export function getProductById(id: string | number): Product | undefined {
  return getAllProducts().find((p) => String(p.id) === String(id));
}

export function toLegacySlug(p: Product): string {
  const id = String(p.id || '');
  const slug = String(p.slug || '');
  const suffix = `-${id}`;
  return slug.endsWith(suffix) ? slug.slice(0, -suffix.length) : slug;
}
