import type { ReactNode } from "react";
import Link from "next/link";

import { hasDatabaseUrl, hasBlobReadWriteToken } from "@/lib/content/env";

const navItems = [
  { href: "/admin", label: "Resumen" },
  { href: "/admin/productos", label: "Productos" },
  { href: "/admin/blog", label: "Blog" },
];

export function AdminShell({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-stone-100 text-stone-900">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 rounded-3xl border border-stone-200 bg-white px-6 py-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
                Panel de gestión
              </p>
              <h1 className="font-display text-2xl text-stone-950">
                Personalizados Hostelería Admin
              </h1>
            </div>

            <nav className="flex flex-wrap gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-stone-950 hover:text-stone-950"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        {!hasDatabaseUrl() ? (
          <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-900">
            `DATABASE_URL` no está configurado. El panel queda en modo seguro: la web pública sigue usando el fallback actual y no habrá persistencia editable hasta completar la conexión.
          </div>
        ) : null}

        {!hasBlobReadWriteToken() ? (
          <div className="mb-6 rounded-2xl border border-sky-300 bg-sky-50 px-5 py-4 text-sm text-sky-950">
            `BLOB_READ_WRITE_TOKEN` no está configurado. El panel podrá funcionar sin nuevas subidas, pero no almacenará imágenes en Vercel Blob.
          </div>
        ) : null}

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
