import Link from "next/link";

import type { Product } from "@/lib/data/products";
import type { EditableProductRecord } from "@/lib/content/types";
import { serializeProductForForm } from "@/lib/content/product-admin";

function getNotice(
  isLegacyProduct: boolean,
  searchParams?: { saved?: string; deleted?: string; error?: string },
): { tone: "success" | "danger" | null; message: string | null } {
  if (searchParams?.saved === "1") {
    return {
      tone: "success",
      message: "Producto guardado correctamente.",
    };
  }

  if (searchParams?.deleted === "1") {
    return {
      tone: "success",
      message: isLegacyProduct
        ? "Registro editable eliminado. El producto legacy vuelve a usar el fallback actual."
        : "Producto eliminado correctamente.",
    };
  }

  if (searchParams?.error === "title") {
    return {
      tone: "danger",
      message: "El título es obligatorio.",
    };
  }

  if (searchParams?.error === "upload") {
    return {
      tone: "danger",
      message: "No se ha podido subir la imagen. Revisa la configuración de Vercel Blob.",
    };
  }

  return { tone: null, message: null };
}

export function ProductForm({
  record,
  baseProduct,
  searchParams,
  saveAction,
  deleteAction,
}: {
  record: EditableProductRecord | null;
  baseProduct: Product;
  searchParams?: { saved?: string; deleted?: string; error?: string };
  saveAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
}) {
  const values = serializeProductForForm(baseProduct);
  const legacyId = record?.legacyId || (/^\d+$/.test(baseProduct.id) ? baseProduct.id : "");
  const isLegacyProduct = Boolean(legacyId);
  const notice = getNotice(isLegacyProduct, searchParams);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-stone-500">
            {isLegacyProduct ? "Producto legacy" : "Producto nuevo"}
          </p>
          <h2 className="font-display text-3xl text-stone-950">
            {values.title || "Editar producto"}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
            {isLegacyProduct
              ? "Este formulario crea o actualiza una versión editable en base de datos que pasa a ser la fuente de verdad para la web pública."
              : "Este formulario crea un producto nuevo gestionado solo desde el panel."}
          </p>
        </div>

        <Link
          href="/admin/productos"
          className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-stone-950 hover:text-stone-950"
        >
          Volver al listado
        </Link>
      </div>

      {notice.message ? (
        <div
          className={
            notice.tone === "success"
              ? "rounded-2xl border border-emerald-300 bg-emerald-50 px-5 py-4 text-sm text-emerald-900"
              : "rounded-2xl border border-rose-300 bg-rose-50 px-5 py-4 text-sm text-rose-900"
          }
        >
          {notice.message}
        </div>
      ) : null}

      <form action={saveAction} className="space-y-6">
        <input type="hidden" name="recordId" value={record?.recordId || baseProduct.id} />
        <input type="hidden" name="legacyId" value={legacyId} />
        <input type="hidden" name="previousSlug" value={record?.slug || baseProduct.slug} />

        <section className="grid gap-6 rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm lg:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-stone-700">Título</span>
            <input
              type="text"
              name="title"
              defaultValue={values.title}
              className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-950"
              required
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-stone-700">Slug</span>
            <input
              type="text"
              name="slug"
              defaultValue={values.slug}
              readOnly={isLegacyProduct}
              className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-950 read-only:bg-stone-100"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-stone-700">Estado</span>
            <select
              name="publishStatus"
              defaultValue={record?.status || "draft"}
              className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-950"
            >
              <option value="draft">Borrador / Despublicado</option>
              <option value="published">Publicado</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-stone-700">Precio base</span>
            <input
              type="text"
              name="price"
              defaultValue={values.price}
              className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-950"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-stone-700">Marca</span>
            <input
              type="text"
              name="brand"
              defaultValue={values.brand}
              className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-950"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-stone-700">SKU</span>
            <input
              type="text"
              name="sku"
              defaultValue={values.sku}
              className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-950"
            />
          </label>
        </section>

        <section className="grid gap-6 rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm lg:grid-cols-2">
          <label className="block lg:col-span-2">
            <span className="mb-2 block text-sm font-medium text-stone-700">Descripción corta</span>
            <textarea
              name="shortDescriptionHtml"
              defaultValue={values.shortDescriptionHtml}
              rows={4}
              className="w-full rounded-3xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-950"
            />
          </label>

          <label className="block lg:col-span-2">
            <span className="mb-2 block text-sm font-medium text-stone-700">Descripción larga</span>
            <textarea
              name="descriptionHtml"
              defaultValue={values.descriptionHtml}
              rows={10}
              className="w-full rounded-3xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-950"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-stone-700">Imagen actual / URL</span>
            <input
              type="text"
              name="imageUrl"
              defaultValue={values.imageUrl}
              className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-950"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-stone-700">Subir nueva imagen</span>
            <input
              type="file"
              name="imageFile"
              accept="image/*"
              className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition file:mr-4 file:border-0 file:bg-stone-200 file:px-3 file:py-2 file:text-sm file:font-medium file:text-stone-800 focus:border-stone-950"
            />
          </label>
        </section>

        <section className="grid gap-6 rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm lg:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-stone-700">Categorías planas</span>
            <textarea
              name="categoriesFlat"
              defaultValue={values.categoriesFlat}
              rows={6}
              className="w-full rounded-3xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-950"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-stone-700">Rutas de categoría</span>
            <textarea
              name="categoryPaths"
              defaultValue={values.categoryPaths}
              rows={6}
              className="w-full rounded-3xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-950"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-stone-700">Características</span>
            <textarea
              name="features"
              defaultValue={values.features}
              rows={8}
              className="w-full rounded-3xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-950"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-stone-700">Opciones</span>
            <textarea
              name="options"
              defaultValue={values.options}
              rows={8}
              className="w-full rounded-3xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-950"
            />
          </label>
        </section>

        <section className="grid gap-6 rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm lg:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-stone-700">SEO Title</span>
            <input
              type="text"
              name="metaTitle"
              defaultValue={values.metaTitle}
              className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-950"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-stone-700">SEO Description</span>
            <textarea
              name="metaDescription"
              defaultValue={values.metaDescription}
              rows={4}
              className="w-full rounded-3xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-950"
            />
          </label>

          <label className="block lg:col-span-2">
            <span className="mb-2 block text-sm font-medium text-stone-700">Tags</span>
            <input
              type="text"
              name="tags"
              defaultValue={values.tags}
              className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-950"
            />
          </label>
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="rounded-2xl bg-stone-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-800"
          >
            Guardar producto
          </button>

          {record ? (
            <button
              type="submit"
              formAction={deleteAction}
              className="rounded-2xl border border-rose-300 px-5 py-3 text-sm font-semibold text-rose-700 transition hover:border-rose-500 hover:text-rose-900"
            >
              {isLegacyProduct ? "Eliminar registro editable" : "Borrar producto"}
            </button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
