import { redirect } from "next/navigation";
import { AuthForm } from "@/app/sign-in/auth-form";
import { adminEmailAllowlist } from "@/lib/env";
import { getSession } from "@/lib/auth/server";

export default async function SignInPage() {
  const session = await getSession();
  const createAdminEnabled = adminEmailAllowlist.length > 0;

  if (session) {
    redirect("/admin");
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="panel grid gap-6 rounded-[2rem] p-6 sm:p-8">
          <div className="inline-flex w-fit rounded-full border border-border/80 bg-surface-2/80 px-3 py-1 font-mono text-[0.68rem] uppercase tracking-[0.24em] text-muted">
            AgentRiot // admin access
          </div>
          <div className="space-y-4">
            <h1 className="text-balance text-4xl font-semibold tracking-[-0.06em] text-foreground sm:text-5xl">
              Calm surface. Dense signal. Tight editorial control.
            </h1>
            <p className="max-w-xl text-base leading-8 text-muted sm:text-lg">
              This console is only for AgentRiot admins and editors. Phase 1
              keeps auth intentionally narrow so the shared content graph stays
              simple while the public hub comes online.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              "Admin-only Better Auth foundation",
              createAdminEnabled
                ? "Allowlist-gated account creation"
                : "Allowlist required before bootstrap signup",
              "Drizzle + Postgres auth schema",
              "Protected /admin route shell",
            ].map((item) => (
              <div
                key={item}
                className="rounded-[1.25rem] border border-border/80 bg-background/80 px-4 py-4 font-mono text-xs uppercase tracking-[0.16em] text-muted"
              >
                {item}
              </div>
            ))}
          </div>
        </section>

        <AuthForm createAdminEnabled={createAdminEnabled} />
      </div>
    </main>
  );
}
