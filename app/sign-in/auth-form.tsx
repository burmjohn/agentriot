"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

type AuthMode = "sign-in" | "create-admin";

const modeCopy: Record<
  AuthMode,
  {
    heading: string;
    description: string;
    action: string;
  }
> = {
  "sign-in": {
    heading: "Sign in to the admin console",
    description:
      "Use your allowlisted AgentRiot admin account to manage content, prompts, skills, and related graph links.",
    action: "Sign in",
  },
  "create-admin": {
    heading: "Create the first admin account",
    description:
      "Account creation is restricted to emails listed in the admin allowlist. Use this once on a fresh database, then sign in normally.",
    action: "Create admin account",
  },
};

export function AuthForm({ createAdminEnabled }: { createAdminEnabled: boolean }) {
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const copy = modeCopy[mode];

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setErrorMessage(null);

    const callbackURL = "/admin";

    const result =
      mode === "sign-in"
        ? await authClient.signIn.email({
            email,
            password,
            callbackURL,
            rememberMe: true,
          })
        : await authClient.signUp.email({
            name: name.trim() || "AgentRiot Admin",
            email,
            password,
            callbackURL,
          });

    if (result.error) {
      setErrorMessage(result.error.message ?? "Authentication failed.");
      setIsPending(false);
      return;
    }

    if (mode === "create-admin") {
      const signInResult = await authClient.signIn.email({
        email,
        password,
        callbackURL,
        rememberMe: true,
      });

      if (signInResult.error) {
        setErrorMessage(
          signInResult.error.message ??
            "Admin account was created, but sign-in still needs to complete.",
        );
        setIsPending(false);
        return;
      }
    }

    window.location.assign(callbackURL);
  }

  return (
    <div className="panel grid gap-6 rounded-[1.75rem] p-5 sm:p-7">
      <div className="flex flex-wrap gap-2">
        {(["sign-in", "create-admin"] as const)
          .filter((nextMode) => createAdminEnabled || nextMode === "sign-in")
          .map((nextMode) => (
            <button
              key={nextMode}
              type="button"
              onClick={() => {
                setMode(nextMode);
                setErrorMessage(null);
              }}
              className={`rounded-full px-4 py-2 font-mono text-xs uppercase tracking-[0.18em] transition-colors ${
                mode === nextMode
                  ? "bg-foreground text-background"
                  : "chip text-muted hover:text-foreground"
              }`}
            >
              {nextMode === "sign-in" ? "Sign in" : "Create admin"}
            </button>
          ))}
      </div>

      <div className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-[-0.04em] text-foreground">
          {copy.heading}
        </h2>
        <p className="max-w-xl text-sm leading-7 text-muted">
          {copy.description}
        </p>
        {!createAdminEnabled ? (
          <p className="rounded-[1.25rem] border border-border/80 bg-background/80 px-4 py-3 text-sm leading-7 text-muted">
            Admin account creation is currently disabled because
            `ADMIN_EMAIL_ALLOWLIST` is empty. Set an allowlisted email first,
            then reload this page to enable bootstrap signup.
          </p>
        ) : null}
      </div>

      <form className="grid gap-4" onSubmit={handleSubmit}>
        {mode === "create-admin" ? (
          <label className="grid gap-2">
            <span className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted">
              Name
            </span>
            <input
              className="min-h-12 rounded-2xl border border-border bg-background px-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-foreground/35"
              name="name"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="AgentRiot Editor"
            />
          </label>
        ) : null}

        <label className="grid gap-2">
          <span className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted">
            Email
          </span>
          <input
            className="min-h-12 rounded-2xl border border-border bg-background px-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-foreground/35"
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="admin@agentriot.com"
          />
        </label>

        <label className="grid gap-2">
          <span className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted">
            Password
          </span>
          <input
            className="min-h-12 rounded-2xl border border-border bg-background px-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-foreground/35"
            type="password"
            name="password"
            autoComplete={
              mode === "sign-in" ? "current-password" : "new-password"
            }
            minLength={12}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 12 characters"
          />
        </label>

        {errorMessage ? (
          <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200 dark:text-red-200">
            {errorMessage}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-foreground px-5 text-sm font-medium text-background transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Working..." : copy.action}
        </button>
      </form>
    </div>
  );
}
