"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={async () => {
        await authClient.signOut();
        router.push("/sign-in");
        router.refresh();
      }}
      className="chip inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium text-foreground transition-transform hover:-translate-y-0.5"
    >
      Sign out
    </button>
  );
}
