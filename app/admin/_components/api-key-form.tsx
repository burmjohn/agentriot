"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { apiKeyScopeEnum } from "@/db/schema";
import type { ApiKeyActionState } from "@/app/admin/actions";

const initialState: ApiKeyActionState = {
  error: null,
  success: null,
  secret: null,
  recordId: null,
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-12 items-center justify-center rounded-full bg-foreground px-5 text-sm font-medium text-background transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Saving..." : label}
    </button>
  );
}

function formatDateTimeLocal(value?: Date | null) {
  if (!value) {
    return "";
  }

  return value.toISOString().slice(0, 16);
}

export function ApiKeyForm({
  title,
  detail,
  submitLabel,
  action,
  initialValues,
}: {
  title: string;
  detail: string;
  submitLabel: string;
  action: (
    state: ApiKeyActionState,
    payload: FormData,
  ) => Promise<ApiKeyActionState>;
  initialValues?: {
    label?: string | null;
    description?: string | null;
    scopes?: string[];
    expiresAt?: Date | null;
  };
}) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <section className="grid gap-4">
      <div className="space-y-3">
        <h2 className="text-3xl font-semibold tracking-[-0.05em] text-foreground">
          {title}
        </h2>
        <p className="max-w-2xl text-sm leading-7 text-muted">{detail}</p>
      </div>

      <form action={formAction} className="panel grid gap-5 rounded-[1.75rem] p-6">
        <label className="grid gap-2">
          <span className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted">
            Label
          </span>
          <input
            type="text"
            name="label"
            required
            defaultValue={initialValues?.label ?? ""}
            className="min-h-12 rounded-[1.5rem] border border-border bg-background px-4 text-sm text-foreground outline-none transition-colors focus:border-foreground/35"
          />
        </label>

        <label className="grid gap-2">
          <span className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted">
            Description
          </span>
          <textarea
            name="description"
            rows={4}
            defaultValue={initialValues?.description ?? ""}
            className="rounded-[1.5rem] border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-foreground/35"
          />
        </label>

        <label className="grid gap-2">
          <span className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted">
            Expires at
          </span>
          <input
            type="datetime-local"
            name="expiresAt"
            defaultValue={formatDateTimeLocal(initialValues?.expiresAt)}
            className="min-h-12 rounded-[1.5rem] border border-border bg-background px-4 text-sm text-foreground outline-none transition-colors focus:border-foreground/35"
          />
        </label>

        <fieldset className="grid gap-3 rounded-[1.5rem] border border-border bg-background/80 p-4">
          <legend className="px-2 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted">
            Scopes
          </legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {apiKeyScopeEnum.enumValues.map((scope) => (
              <label
                key={scope}
                className="flex items-center gap-3 rounded-[1.25rem] border border-border/80 px-4 py-3 text-sm text-foreground"
              >
                <input
                  type="checkbox"
                  name="scopes"
                  value={scope}
                  defaultChecked={initialValues?.scopes?.includes(scope)}
                />
                <span>{scope}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {state.error ? (
          <p className="rounded-[1.25rem] border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {state.error}
          </p>
        ) : null}

        {state.success ? (
          <div className="grid gap-3 rounded-[1.5rem] border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
            <p>{state.success}</p>
            {state.secret ? (
              <div className="grid gap-2">
                <p className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-emerald-200/80">
                  Revealed secret
                </p>
                <pre
                  data-testid="api-key-secret"
                  className="overflow-x-auto rounded-[1.25rem] border border-emerald-500/20 bg-background/70 px-4 py-3 text-xs text-foreground"
                >
                  {state.secret}
                </pre>
              </div>
            ) : null}
            {state.recordId ? (
              <Link
                href={`/admin/api-keys/${state.recordId}`}
                className="inline-flex min-h-11 items-center rounded-full border border-emerald-500/30 px-4 text-sm font-medium text-emerald-100 transition-transform hover:-translate-y-0.5"
              >
                Open key detail
              </Link>
            ) : null}
          </div>
        ) : null}

        <div className="flex justify-start">
          <SubmitButton label={submitLabel} />
        </div>
      </form>
    </section>
  );
}
