import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { HEADLESS_CACHE_TAGS } from "@/lib/headless/constants";
import { getNextRevalidateSecret } from "@/lib/headless/env";

type RevalidatePayload = {
  secret?: string;
  paths?: string[];
  tags?: string[];
};

function normalizeList(values: unknown): string[] {
  return Array.isArray(values)
    ? values.map((value) => String(value || "").trim()).filter(Boolean)
    : [];
}

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => ({}))) as RevalidatePayload;
  const secret = String(payload.secret || request.nextUrl.searchParams.get("secret") || "").trim();
  const expectedSecret = getNextRevalidateSecret();

  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const paths = normalizeList(payload.paths);
  const tags = normalizeList(payload.tags);
  const effectiveTags = tags.length > 0 ? tags : Object.values(HEADLESS_CACHE_TAGS);

  for (const path of paths) {
    revalidatePath(path);
  }

  for (const tag of effectiveTags) {
    revalidateTag(tag);
  }

  return NextResponse.json({
    ok: true,
    revalidated: {
      paths,
      tags: effectiveTags,
    },
  });
}
