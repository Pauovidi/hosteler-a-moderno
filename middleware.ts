import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Legacy URL support
 * - /c<ID>-<slug>.html  -> /legacy-category/<ID>?slug=<slug>
 * - /p<ID>-<slug>.html  -> /legacy-product/<ID>?slug=<slug>
 */
export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Fast exit for internal assets / endpoints
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  ) {
    return NextResponse.next();
  }

  // Match legacy category/product URLs
  const match = pathname.match(/^\/([pc])(\d+)(?:-([^?#]+))?\.html$/i);
  if (!match) return NextResponse.next();

  const type = match[1].toLowerCase();
  const id = match[2];
  let slug = match[3] || "";

  try {
    slug = decodeURIComponent(slug);
  } catch {
    // ignore
  }

  const url = req.nextUrl.clone();
  url.pathname = type === "p" ? `/legacy-product/${id}` : `/legacy-category/${id}`;
  if (slug) url.searchParams.set("slug", slug);

  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next).*)"],
};
