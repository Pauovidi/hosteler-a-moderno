import { listEditableBlogPosts } from "@/lib/content/db";
import { hasDatabaseUrl } from "@/lib/content/env";

export default async function AdminBlogPage() {
  const posts = hasDatabaseUrl() ? await listEditableBlogPosts() : [];

  return (
    <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl text-stone-950">Blog</h2>
          <p className="mt-2 text-sm text-stone-600">
            CRUD de entradas en la siguiente fase. La infraestructura de listado ya queda preparada.
          </p>
        </div>
        <div className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700">
          {posts.length} entrada{posts.length === 1 ? "" : "s"}
        </div>
      </div>
    </div>
  );
}
