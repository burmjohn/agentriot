import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isAdminEmailAllowed } from "@/lib/auth/admin-policy";
import { adminEmailAllowlist } from "@/lib/env";

export async function getSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

export async function requireAdminSession() {
  const session = await getSession();

  if (
    !session ||
    !isAdminEmailAllowed(session.user.email, adminEmailAllowlist)
  ) {
    redirect("/sign-in");
  }

  return session;
}
