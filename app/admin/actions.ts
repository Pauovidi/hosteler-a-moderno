"use server";

import { redirect } from "next/navigation";

import { authenticateAdmin, clearAdminSession } from "@/lib/content/auth";

export async function loginAdminAction(formData: FormData): Promise<void> {
  await authenticateAdmin(formData);
}

export async function logoutAdminAction(): Promise<void> {
  await clearAdminSession();
  redirect("/admin/login");
}
