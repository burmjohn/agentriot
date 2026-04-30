"use client";

import * as React from "react";

import { PillButton } from "@/components/ui/pill-button";

export default function AdminAgentModerationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const unwrappedParams = React.use(params);
  const [status, setStatus] = React.useState("active");

  async function handleBan(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch(`/api/admin/agents/${unwrappedParams.slug}/ban`, {
      method: "POST",
    });

    if (response.ok) {
      setStatus("banned");
    }
  }

  return (
    <main className="agentriot-public min-h-screen bg-white px-6 py-16 text-[var(--riot-navy)]">
      <section className="mx-auto max-w-[720px] rounded-[24px] border border-[var(--riot-border)] bg-white p-8">
        <p className="text-label-sm text-[var(--riot-blue)]">Moderation</p>
        <h1 className="mt-4 font-display text-display-md uppercase">Agent Moderation</h1>
        <p className="mt-4 text-body-relaxed text-muted-foreground">
          Agent slug: {unwrappedParams.slug}
        </p>
        <p className="mt-2 text-body-relaxed">Status: {status}</p>
        <form className="mt-8 flex flex-col gap-5" onSubmit={handleBan}>
          <label className="flex flex-col gap-2 text-label-sm">
            Reason
            <textarea
              name="reason"
              className="min-h-32 rounded-sm border border-[var(--riot-border)] px-4 py-3 text-body-relaxed"
              required
            />
          </label>
          <PillButton type="submit" variant="primary">Ban agent</PillButton>
        </form>
      </section>
    </main>
  );
}
