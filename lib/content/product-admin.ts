import type { Product } from "@/lib/data/products";
import { slugify } from "@/lib/utils";

function parseNumber(raw: FormDataEntryValue | null): number | undefined {
  const value = String(raw || "").trim().replace(",", ".");
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function splitLines(value: FormDataEntryValue | null): string[] {
  return String(value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function splitCommaSeparated(value: FormDataEntryValue | null): string[] {
  return String(value || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function toBasicHtml(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  if (/<[a-z][\s\S]*>/i.test(trimmed)) {
    return trimmed;
  }

  return trimmed
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br />")}</p>`)
    .join("");
}

function stripHtml(html: string): string {
  return String(html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseCategoryPaths(value: FormDataEntryValue | null): string[][] {
  return splitLines(value)
    .map((line) =>
      line
        .split(">")
        .map((segment) => segment.trim())
        .filter(Boolean),
    )
    .filter((path) => path.length > 0);
}

function parseOptions(value: FormDataEntryValue | null): Product["options"] {
  return splitLines(value).map((line) => {
    const [labelRaw, priceRaw, effectiveRaw] = line.split("|").map((part) => part.trim());
    const price = Number(priceRaw || 0) || 0;
    const effectivePrice = Number(effectiveRaw || price) || price;

    return {
      label: labelRaw || "Opción",
      price,
      effectivePrice,
    };
  });
}

function ensureLeadingImage(imageUrl: string | null, imagesSource: string[]): string[] {
  if (!imageUrl) {
    return imagesSource;
  }

  return [imageUrl, ...imagesSource.filter((value) => value !== imageUrl)];
}

function createBlankProduct(recordId: string, slug: string, title: string): Product {
  return {
    id: recordId,
    name: title,
    slug,
    descriptionHtml: "",
    shortDescriptionHtml: "",
    shortDescription: "",
    categoryPaths: [],
    categoriesFlat: [],
    imagesSource: [],
    image: "/placeholder.svg",
    options: [],
    features: [],
    brands: [],
    title,
    longDescription: "",
  };
}

export function buildProductPayloadFromForm(input: {
  formData: FormData;
  recordId: string;
  legacyId: string | null;
  baseProduct?: Product;
  uploadedImageUrl?: string | null;
}): Product {
  const title = String(input.formData.get("title") || "").trim();
  const baseProduct =
    input.baseProduct ||
    createBlankProduct(input.legacyId || input.recordId, "", title);
  const isLegacyProduct = Boolean(input.legacyId);
  const slugInput = String(input.formData.get("slug") || "").trim();
  const slug = isLegacyProduct
    ? baseProduct.slug
    : slugInput || slugify(title || baseProduct.title || input.recordId);
  const descriptionHtml = toBasicHtml(String(input.formData.get("descriptionHtml") || ""));
  const shortDescriptionHtml = toBasicHtml(
    String(input.formData.get("shortDescriptionHtml") || ""),
  );
  const imageUrl =
    input.uploadedImageUrl ||
    String(input.formData.get("imageUrl") || "").trim() ||
    baseProduct.image ||
    null;
  const features = splitLines(input.formData.get("features"));
  const categoriesFlat = splitLines(input.formData.get("categoriesFlat"));
  const categoryPaths = parseCategoryPaths(input.formData.get("categoryPaths"));
  const tags = splitCommaSeparated(input.formData.get("tags"));
  const brand = String(input.formData.get("brand") || "").trim();
  const options = parseOptions(input.formData.get("options"));
  const shortDescription = stripHtml(shortDescriptionHtml || descriptionHtml);
  const resolvedId = input.legacyId || baseProduct.id || input.recordId;
  const imagesSource = ensureLeadingImage(
    imageUrl,
    Array.isArray(baseProduct.imagesSource) ? baseProduct.imagesSource : [],
  );

  return {
    ...baseProduct,
    id: resolvedId,
    name: title,
    slug,
    title,
    descriptionHtml,
    shortDescriptionHtml,
    shortDescription,
    longDescription: descriptionHtml,
    image: imageUrl || "/placeholder.svg",
    imagesSource,
    categoryPaths: categoryPaths.length > 0 ? categoryPaths : baseProduct.categoryPaths,
    categoriesFlat: categoriesFlat.length > 0 ? categoriesFlat : baseProduct.categoriesFlat,
    price: parseNumber(input.formData.get("price")) ?? baseProduct.price,
    sku: String(input.formData.get("sku") || "").trim() || baseProduct.sku,
    brand: brand || baseProduct.brand,
    brands: brand ? [brand] : baseProduct.brands || [],
    tags: tags.length > 0 ? tags : baseProduct.tags,
    options: options.length > 0 ? options : baseProduct.options,
    features: features.length > 0 ? features : baseProduct.features,
    metaTitle:
      String(input.formData.get("metaTitle") || "").trim() || baseProduct.metaTitle,
    metaDescription:
      String(input.formData.get("metaDescription") || "").trim() ||
      baseProduct.metaDescription,
  };
}

export function serializeProductForForm(product: Product) {
  return {
    id: product.id,
    slug: product.slug,
    title: product.title || product.name,
    shortDescriptionHtml: String(product.shortDescriptionHtml || ""),
    descriptionHtml: String(product.descriptionHtml || product.longDescription || ""),
    imageUrl: String(product.image || ""),
    price: product.price ? String(product.price) : "",
    sku: String(product.sku || ""),
    brand: String(product.brand || product.brands?.[0] || ""),
    tags: Array.isArray(product.tags) ? product.tags.join(", ") : "",
    categoriesFlat: Array.isArray(product.categoriesFlat)
      ? product.categoriesFlat.join("\n")
      : "",
    categoryPaths: Array.isArray(product.categoryPaths)
      ? product.categoryPaths.map((path) => path.join(" > ")).join("\n")
      : "",
    features: Array.isArray(product.features) ? product.features.join("\n") : "",
    options: Array.isArray(product.options)
      ? product.options
          .map((option) => [option.label, option.price, option.effectivePrice].join(" | "))
          .join("\n")
      : "",
    metaTitle: String(product.metaTitle || ""),
    metaDescription: String(product.metaDescription || ""),
  };
}
