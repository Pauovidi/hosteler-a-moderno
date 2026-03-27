import Link from "next/link";

import { toggleBlogPostStatusAction } from "@/app/admin/(protected)/blog/actions";
import { listEditableBlogPosts } from "@/lib/content/db";
import { hasDatabaseUrl } from "@/lib/content/env";
import { getFallbackEditablePosts } from "@/lib/content/blog-store";

type BlogListItem = {
  key: string;
  title: string;
  slug: string;
  legacyId: string | null;
  recordId: string | null;
  source: "editable" | "legacy" | "new";
  statusLabel: string;
  actionHref: string;
  statusTone: string;
  publishedAt: string | null;
};

async function buildItems(): Promise<BlogListItem[]> {
  const fallbackPosts = getFallbackEditablePosts();
  const editablePosts = hasDatabaseUrl() ? await listEditableBlogPosts() : [];
  const editableByLegacyId = new Map(
    editablePosts
      .filter((record) => record.legacyId)
      .map((record) => [String(record.legacyId), record]),
  );

  const fallbackItems = fallbackPosts.map((post) => {
    const editableRecord = editableByLegacyId.get(String(post.id));

    return {
      key: `legacy-${post.id}`,
      title: post.title,
      slug: post.slug,
      legacyId: post.id,
      recordId: editableRecord?.recordId || null,
      source: editableRecord ? "editable" : "legacy",
      statusLabel: editableRecord
        ? editableRecord.status === "published"
          ? "Editable publicado"
          : "Editable en borrador"
        : "Fallback legacy",
      actionHref: editableRecord
        ? `/admin/blog/editar?recordId=${editableRecord.recordId}`
        : `/admin/blog/editar?legacyId=${post.id}`,
      statusTone: editableRecord
        ? editableRecord.status === "published"
          ? "bg-emerald-100 text-emerald-800"
          : "bg-amber-100 text-amber-800"
        : "bg-stone-100 text-stone-700",
      publishedAt: post.publishedAt,
    } satisfies BlogListItem;
  });

  const newEditableItems = editablePosts
    .filter((record) => !record.legacyId)
    .map((record) => ({
      key: record.recordId,
      title: record.title,
      slug: record.slug,
      legacyId: null,
      recordId: record.recordId,
      source: "new",
      statusLabel: record.status === "published" ? "Nuevo publicado" : "Nuevo en borrador",
      actionHref: `/admin/blog/editar?recordId=${record.recordId}`,
      statusTone:
        record.status === "published"
          ? "bg-sky-100 text-sky-800"
          : "bg-amber-100 text-amber-800",
      publishedAt: record.publishedAt,
    }));

  return [...newEditableItems, ...fallbackItems].sort((left, right) =>
    left.title.localeCompare(right.title, "es"),
  );
}

export default async function AdminBlogPage({
  searchParams,
}: {
  searchParams?: Promise<{ deleted?: string; error?: string }>;
}) {
  const [items, params] = await Promise.all([buildItems(), searchParams]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
        <div>
          <h2 className="font-display text-2xl text-stone-950">Blog</h2>
          <p className="mt-2 text-sm text-stone-600">
            El listado mezcla el blog legado con los registros editables. Si existe una entrada en DB, esa versión pasa a gobernar la publicación pública.
          </p>
        </div>
        <Link
          href="/admin/blog/nuevo"
          className="rounded-2xl bg-stone-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-800"
        >
          Nueva entrada
        </Link>
      </div>

      {params?.deleted === "1" ? (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 px-5 py-4 text-sm text-emerald-900">
          La entrada se ha actualizado correctamente tras eliminar el registro editable.
        </div>
      ) : null}

      {params?.error === "db" ? (
        <div className="rounded-2xl border border-rose-300 bg-rose-50 px-5 py-4 text-sm text-rose-900">
          Falta `DATABASE_URL`. No se pueden guardar entradas hasta configurar la base de datos.
        </div>
      ) : null}

      <div className="overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-stone-50 text-stone-600">
            <tr>
              <th className="px-6 py-4 font-medium">Entrada</th>
              <th className="px-6 py-4 font-medium">Slug</th>
              <th className="px-6 py-4 font-medium">Estado</th>
              <th className="px-6 py-4 font-medium">Fecha</th>
              <th className="px-6 py-4 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200">
            {items.map((item) => (
              <tr key={item.key}>
                <td className="px-6 py-4">
                  <div className="font-medium text-stone-950">{item.title}</div>
                  <div className="text-xs text-stone-500">
                    {item.legacyId ? `Legacy ID ${item.legacyId}` : "Entrada nueva"}
                  </div>
                </td>
                <td className="px-6 py-4 text-stone-600">{item.slug}</td>
                <td className="px-6 py-4">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${item.statusTone}`}>
                    {item.statusLabel}
                  </span>
                </td>
                <td className="px-6 py-4 text-stone-600">
                  {item.publishedAt
                    ? new Date(item.publishedAt).toLocaleDateString("es-ES")
                    : "Sin fecha"}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={item.actionHref}
                      className="rounded-full border border-stone-300 px-3 py-2 text-xs font-medium text-stone-700 transition hover:border-stone-950 hover:text-stone-950"
                    >
                      Editar
                    </Link>

                    {item.recordId ? (
                      <form action={toggleBlogPostStatusAction}>
                        <input type="hidden" name="recordId" value={item.recordId} />
                        <input
                          type="hidden"
                          name="nextStatus"
                          value={item.statusLabel.includes("publicado") ? "draft" : "published"}
                        />
                        <button
                          type="submit"
                          className="rounded-full border border-stone-300 px-3 py-2 text-xs font-medium text-stone-700 transition hover:border-stone-950 hover:text-stone-950"
                        >
                          {item.statusLabel.includes("publicado") ? "Despublicar" : "Publicar"}
                        </button>
                      </form>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
