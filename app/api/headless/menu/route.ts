import { NextResponse } from "next/server";

import { getProductCategories } from "@/lib/headless/catalog";

function toMenuItems(categories: Awaited<ReturnType<typeof getProductCategories>>) {
  return categories.map((category) => ({
    label: category.name,
    href: category.path,
    children: category.children.map((child) => ({
      label: child.name,
      href: child.path,
    })),
  }));
}

export async function GET() {
  const categories = await getProductCategories();
  return NextResponse.json({
    items: toMenuItems(categories),
  });
}
