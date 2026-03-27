import Link from "next/link";

import type { BlogPost } from "@/lib/data/blog";
import type { EditableBlogPostRecord } from "@/lib/content/types";
import { serializeBlogPostForForm } from "@/lib/content/blog-admin";

function getNotice(
  isLegacyPost: boolean,
  searchParams?: { saved?: string; deleted?: string; error?: string },
): { tone: "success" | "danger" | null; message: string | null } {
  if (searchParams?.saved === "1") {
    return { tone: "success", message: "Entrada guardada correctamente." };
  }

  if (searchParams?.deleted === "1") {
    return {
      tone: "success",
      message: isLegacyPost
        ? "Registro editable eliminado. La entrada legacy vuelve a usar el fallback actual."
        : "Entrada eliminada correctamente.",
    };
  }

  if (searchParams?.error === "title") {
    return { tone: "danger", message: "El título es obligatorio." };
  }

  if (searchParams?.error === "upload") {
    return {
      tone: "danger",
      message: "No se ha podido subir la imagen. Revisa la configuración de Vercel Blob.",
    };
  }

  return { tone: null, message: null };
}

export function BlogForm({
  record,
  basePost,
  searchParams,
  saveAction,
  deleteAction,
}: {
  record: EditableBlogPostRecord | null;
  basePost: BlogPost & { contentMarkdown?: string };
  searchParams?: { saved?: string; deleted?: string; error?: string };
  saveAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
}) {
  const values = serializeBlogPostForForm(basePost);
  const legacyId = record?.legacyId || (/^\d+$/.test(basePost.id) ? basePost.id : "");
  const isLegacyPost = Boolean(legacyId);
  const notice = getNotice(isLegacyPost, searchParams);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-stone-500">
            {isLegacyPost ? "Post legacy" : "Post nuevo"}
          </p>
          <h2 className="font-display text-3xl text-stone-950">
            {values.title || "Editar entrada"}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
            Editor Markdown sencillo. Si la entrada ya existe en el sistema legacy, la versión en DB toma el control de la publicación pública cuando se guarda.
          </p>
        </div>

        <Link
          href="/admin/blog"
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
        <input type="hidden" name="recordId" value={record?.recordId || basePost.id} />
        <input type="hidden" name="legacyId" value={legacyId} />
        <input type="hidden" name="previousSlug" value={record?.slug || basePost.slug} />

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
              readOnly={isLegacyPost}
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
            <span className="mb-2 block text-sm font-medium text-stone-700">Autor</span>
            <input
              type="text"
              name="authorName"
              defaultValue={values.authorName}
              className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-950"
            />
          </label>

          <label className="block lg:col-span-2">
            <span className="mb-2 block text-sm font-medium text-stone-700">Extracto</span>
            <textarea
              name="excerpt"
              defaultValue={values.excerpt}
              rows={4}
              className="w-full rounded-3xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-950"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-stone-700">Fecha de publicación</span>
            <input
              type="datetime-local"
              name="publishedAt"
              defaultValue={values.publishedAt}
              className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-950"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-stone-700">Legacy URL</span>
            <input
              type="text"
              name="legacyUrl"
              defaultValue={values.legacyUrl}
              readOnly={isLegacyPost}
              className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-950 read-only:bg-stone-100"
            />
          </label>
        </section>

        <section className="grid gap-6 rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm lg:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-stone-700">Imagen destacada / URL</span>
            <input
              type="text"
              name="featuredImageUrl"
              defaultValue={values.featuredImageUrl}
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

          <label className="block lg:col-span-2">
            <span className="mb-2 block text-sm font-medium text-stone-700">Contenido en Markdown</span>
            <textarea
              name="contentMarkdown"
              defaultValue={values.contentMarkdown}
              rows={18}
              className="w-full rounded-3xl border border-stone-300 px-4 py-3 font-mono text-sm outline-none transition focus:border-stone-950"
            />
          </label>
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="rounded-2xl bg-stone-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-800"
          >
            Guardar entrada
          </button>

          {record ? (
            <button
              type="submit"
              formAction={deleteAction}
              className="rounded-2xl border border-rose-300 px-5 py-3 text-sm font-semibold text-rose-700 transition hover:border-rose-500 hover:text-rose-900"
            >
              {isLegacyPost ? "Eliminar registro editable" : "Borrar entrada"}
            </button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
