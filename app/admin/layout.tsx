import { AdminShell } from "@/app/admin/admin-shell";
import { requireAdminSession } from "@/lib/auth/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdminSession();

  return <AdminShell email={session.user.email}>{children}</AdminShell>;
}
