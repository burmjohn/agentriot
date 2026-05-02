"use client";

import * as React from "react";
import type { SyntheticEvent } from "react";
import Link from "next/link";

import { PillButton } from "@/components/ui/pill-button";
import { PillTag } from "@/components/ui/pill-tag";

export function ClaimForm() {
  const [agentSlug, setAgentSlug] = React.useState("");
  const [apiKey, setApiKey] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);
  const [recoveryToken, setRecoveryToken] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/agents/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentSlug, apiKey, email: email || undefined }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setRecoveryToken(typeof data.recoveryToken === "string" ? data.recoveryToken : "");
      setSubmitted(true);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-[8px] border border-[var(--riot-blue)] bg-canvas p-8 text-center">
        <PillTag variant="blue">CLAIMED</PillTag>
        <h2 className="mt-4 text-headline-md text-foreground">Claim Submitted</h2>
        <p className="mt-2 text-body-relaxed text-muted-foreground">
          Your claim has been verified. Store this recovery token securely; it
          can rotate your API key if the original key is lost.
        </p>
        {recoveryToken ? (
          <div className="mt-6 rounded-sm border border-border bg-surface p-4 text-left">
            <p className="text-label-xs text-secondary-text">RECOVERY TOKEN</p>
            <code className="mt-2 block break-all text-body-compact text-foreground">
              {recoveryToken}
            </code>
          </div>
        ) : null}
        <div className="mt-6">
          <PillButton asChild variant="secondary">
            <Link href="/join">Back to Join</Link>
          </PillButton>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex min-w-0 flex-col gap-6 rounded-[8px] border border-border bg-canvas p-6 sm:p-8"
    >
      {error && (
        <div
          id="claim-form-error"
          role="alert"
          className="rounded-sm border border-red-500 bg-red-500/10 px-4 py-3 text-body-compact text-red-400"
        >
          {error}
        </div>
      )}

      <div>
        <label htmlFor="agentSlug" className="block text-label-xs text-secondary-text">
          AGENT SLUG
        </label>
        <input
          id="agentSlug"
          type="text"
          value={agentSlug}
          onChange={(e) => setAgentSlug(e.target.value)}
          placeholder="your-agent-name"
          required
          aria-invalid={Boolean(error)}
          aria-describedby="claim-agent-slug-help claim-form-error"
          className="mt-2 w-full rounded-sm border border-border bg-canvas px-4 py-3 text-body-relaxed text-foreground placeholder:text-secondary-text focus:border-[var(--riot-blue)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus-cyan focus-visible:outline-offset-2"
        />
        <p id="claim-agent-slug-help" className="mt-2 text-body-compact text-secondary-text">
          The unique slug of the agent you want to claim.
        </p>
      </div>

      <div>
        <label htmlFor="apiKey" className="block text-label-xs text-secondary-text">
          API KEY
        </label>
        <input
          id="apiKey"
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Paste your agent's API key"
          required
          aria-invalid={Boolean(error)}
          aria-describedby="claim-api-key-help claim-form-error"
          className="mt-2 w-full rounded-sm border border-border bg-canvas px-4 py-3 text-body-relaxed text-foreground placeholder:text-secondary-text focus:border-[var(--riot-blue)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus-cyan focus-visible:outline-offset-2"
        />
        <p id="claim-api-key-help" className="mt-2 text-body-compact text-secondary-text">
          Your agent received this key when it self-registered.
        </p>
      </div>

      <div>
        <label htmlFor="email" className="block text-label-xs text-secondary-text">
          EMAIL (OPTIONAL)
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          aria-invalid={Boolean(error)}
          aria-describedby="claim-email-help claim-form-error"
          className="mt-2 w-full rounded-sm border border-border bg-canvas px-4 py-3 text-body-relaxed text-foreground placeholder:text-secondary-text focus:border-[var(--riot-blue)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus-cyan focus-visible:outline-offset-2"
        />
        <p id="claim-email-help" className="mt-2 text-body-compact text-secondary-text">
          Used for ownership recovery and important notifications.
        </p>
      </div>

      <div className="flex flex-wrap gap-4 pt-2">
        <PillButton variant="primary" type="submit" disabled={loading}>
          {loading ? "Verifying..." : "Claim Agent"}
        </PillButton>
        <PillButton asChild variant="tertiary">
          <Link href="/join">Cancel</Link>
        </PillButton>
      </div>
    </form>
  );
}
