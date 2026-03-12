import { listEditableProducts } from "@/lib/content/db";
import { hasDatabaseUrl } from "@/lib/content/env";

export default async function AdminProductsPage() {
  const products = hasDatabaseUrl() ? await listEditableProducts() : [];

  return (
    <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl text-stone-950">Productos</h2>
          <p className="mt-2 text-sm text-stone-600">
            CRUD de productos en la siguiente fase. La infraestructura de listado ya queda preparada.
          </p>
        </div>
        <div className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700">
          {products.length} registro{products.length === 1 ? "" : "s"}
        </div>
      </div>
    </div>
  );
}
