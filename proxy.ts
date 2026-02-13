import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Legacy URL support (Palbin)
 * - /c<ID>-<slug>.html  -> /legacy-category/<ID>?slug=<slug>
 * - /p<ID>-<slug>.html  -> /legacy-product/<ID>?slug=<slug>
 */
export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow Next internals & static assets through.
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  ) {
    return NextResponse.next();
  }

  const match = pathname.match(/^\/([pc])(\d+)(?:-([^?#]+))?\.html$/i);
  if (!match) return NextResponse.next();

  const type = match[1].toLowerCase();
  const id = match[2];
  let slug = match[3] || "";

  try { slug = decodeURIComponent(slug); } catch {}

  const url = req.nextUrl.clone();
  url.pathname = type === "p" ? `/legacy-product/${id}` : `/legacy-category/${id}`;
  url.searchParams.delete("slug");
  if (slug) url.searchParams.set("slug", slug);

  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)$).*)"],
};
