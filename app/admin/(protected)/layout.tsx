import type { ReactNode } from "react";

import { logoutAdminAction } from "@/app/admin/actions";
import { AdminShell } from "@/components/admin/shell";
import { SignOutForm } from "@/components/admin/sign-out-form";
import { requireAdminSession } from "@/lib/content/auth";

export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAdminSession();

  return (
    <AdminShell>
      <div className="mb-6 flex justify-end">
        <SignOutForm action={logoutAdminAction} />
      </div>
      {children}
    </AdminShell>
  );
}
