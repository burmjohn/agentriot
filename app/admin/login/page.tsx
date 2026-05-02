"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { PillButton } from "@/components/ui/pill-button";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = React.useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
      }),
    });

    if (!response.ok) {
      setError("Invalid admin credentials.");
      return;
    }

    router.push("/admin");
  }

  return (
    <main className="agentriot-public min-h-screen bg-white px-6 py-16 text-[var(--riot-navy)]">
      <section className="mx-auto max-w-md rounded-[8px] border border-[var(--riot-border)] bg-white p-8">
        <h1 className="font-display text-display-md uppercase">Admin Login</h1>
        <form className="mt-8 flex flex-col gap-5" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-2 text-label-sm">
            Email
            <input
              name="email"
              type="email"
              className="rounded-sm border border-[var(--riot-border)] px-4 py-3 text-body-relaxed"
              required
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "admin-login-error" : undefined}
            />
          </label>
          <label className="flex flex-col gap-2 text-label-sm">
            Password
            <input
              name="password"
              type="password"
              className="rounded-sm border border-[var(--riot-border)] px-4 py-3 text-body-relaxed"
              required
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "admin-login-error" : undefined}
            />
          </label>
          {error ? (
            <p id="admin-login-error" role="alert" className="text-body-compact text-[var(--riot-orange)]">
              {error}
            </p>
          ) : null}
          <PillButton type="submit" variant="primary">Sign in</PillButton>
        </form>
      </section>
    </main>
  );
}
