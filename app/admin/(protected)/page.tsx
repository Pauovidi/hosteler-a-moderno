import Link from "next/link";

import {
  getEditableBlogPostsCount,
  getEditableProductsCount,
} from "@/lib/content/db";
import {
  hasBlobReadWriteToken,
  hasDatabaseUrl,
  isAdminConfigured,
} from "@/lib/content/env";

function StatCard({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm transition hover:border-stone-950"
    >
      <p className="text-sm font-medium text-stone-500">{label}</p>
      <p className="mt-3 font-display text-4xl text-stone-950">{value}</p>
    </Link>
  );
}

export default async function AdminDashboardPage() {
  const [productCount, blogCount] = hasDatabaseUrl()
    ? await Promise.all([getEditableProductsCount(), getEditableBlogPostsCount()])
    : [0, 0];

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-3">
        <StatCard label="Productos editables" value={String(productCount)} href="/admin/productos" />
        <StatCard label="Entradas editables" value={String(blogCount)} href="/admin/blog" />
        <StatCard
          label="Estado del panel"
          value={hasDatabaseUrl() ? "Activo" : "Setup"}
          href="/admin"
        />
      </section>

      <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="font-display text-2xl text-stone-950">Estado de la instalación</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
            <p className="text-sm font-medium text-stone-500">Autenticación</p>
            <p className="mt-2 text-sm text-stone-950">
              {isAdminConfigured() ? "Configurada" : "Pendiente"}
            </p>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
            <p className="text-sm font-medium text-stone-500">Base de datos</p>
            <p className="mt-2 text-sm text-stone-950">
              {hasDatabaseUrl() ? "Conectable por env" : "Falta DATABASE_URL"}
            </p>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
            <p className="text-sm font-medium text-stone-500">Imágenes</p>
            <p className="mt-2 text-sm text-stone-950">
              {hasBlobReadWriteToken() ? "Vercel Blob listo" : "Falta BLOB_READ_WRITE_TOKEN"}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="font-display text-2xl text-stone-950">Siguiente fase</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-600">
          En la siguiente fase se activan los CRUD de productos y blog, junto con la subida opcional a Blob y la revalidación de rutas públicas para que cada guardado se refleje sin tocar la web existente.
        </p>
      </section>
    </div>
  );
}
