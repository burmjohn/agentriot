"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { ApiKeyActionState } from "@/app/admin/actions";
import { getApiKeyStatus } from "@/lib/admin/api-key-status";
import { ApiKeyForm } from "@/app/admin/_components/api-key-form";

const initialState: ApiKeyActionState = {
  error: null,
  success: null,
  secret: null,
  recordId: null,
};

function ActionButton({
  label,
  tone = "default",
}: {
  label: string;
  tone?: "default" | "danger";
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={
        tone === "danger"
          ? "inline-flex min-h-11 items-center rounded-full border border-red-500/30 px-4 text-sm font-medium text-red-200 disabled:opacity-60"
          : "inline-flex min-h-11 items-center rounded-full border border-border px-4 text-sm font-medium text-foreground disabled:opacity-60"
      }
    >
      {pending ? "Working..." : label}
    </button>
  );
}

export function ApiKeyRecordView({
  record,
  saveAction,
  revealAction,
  revokeAction,
  reactivateAction,
}: {
  record: {
    id: string;
    label: string;
    description: string | null;
    scopes: string[];
    expiresAt: Date | null;
    revokedAt: Date | null;
    lastUsedAt: Date | null;
    lastUsedIp: string | null;
    keyPrefix: string;
  };
  saveAction: (
    state: ApiKeyActionState,
    payload: FormData,
  ) => Promise<ApiKeyActionState>;
  revealAction: (
    state: ApiKeyActionState,
    payload: FormData,
  ) => Promise<ApiKeyActionState>;
  revokeAction: (
    state: ApiKeyActionState,
    payload: FormData,
  ) => Promise<ApiKeyActionState>;
  reactivateAction: (
    state: ApiKeyActionState,
    payload: FormData,
  ) => Promise<ApiKeyActionState>;
}) {
  const [revealState, revealFormAction] = useActionState(revealAction, initialState);
  const [revokeState, revokeFormAction] = useActionState(revokeAction, initialState);
  const [reactivateState, reactivateFormAction] = useActionState(
    reactivateAction,
    initialState,
  );
  const revokedAt =
    reactivateState.success === "API key reactivated."
        ? null
      : revokeState.success === "API key revoked."
        ? new Date()
        : record.revokedAt;
  const status = getApiKeyStatus({
    revokedAt,
    expiresAt: record.expiresAt,
  });
  const feedback =
    reactivateState.success ?? revokeState.success ?? revealState.success;
  const error = reactivateState.error ?? revokeState.error ?? revealState.error;

  return (
    <div className="grid gap-6">
      <ApiKeyForm
        title={`Edit API key: ${record.label}`}
        detail="Manage trusted publisher and operator credentials. `admin:*` keys should stay rare and intentional."
        submitLabel="Save key"
        action={saveAction}
        initialValues={{
          label: record.label,
          description: record.description,
          scopes: record.scopes,
          expiresAt: record.expiresAt,
        }}
      />

      <section className="panel grid gap-4 rounded-[1.75rem] p-6">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold tracking-[-0.04em] text-foreground">
            Key operations
          </h3>
          <p className="text-sm leading-7 text-muted">
            Prefix: <span className="font-mono">{record.keyPrefix}</span>
          </p>
          <p className="text-sm leading-7 text-muted">
            Status: <span className="font-mono uppercase">{status}</span>
          </p>
          <p className="text-sm leading-7 text-muted">
            Last used:{" "}
            <span className="font-mono">
              {record.lastUsedAt ? record.lastUsedAt.toISOString() : "Never"}
            </span>
          </p>
          <p className="text-sm leading-7 text-muted">
            Last used IP: <span className="font-mono">{record.lastUsedIp ?? "Unknown"}</span>
          </p>
        </div>

        {feedback ? (
          <p className="rounded-[1.25rem] border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            {feedback}
          </p>
        ) : null}

        {error ? (
          <p className="rounded-[1.25rem] border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        ) : null}

        {revealState.secret ? (
          <pre
            data-testid="api-key-secret"
            className="overflow-x-auto rounded-[1.25rem] border border-border bg-background px-4 py-3 text-xs text-foreground"
          >
            {revealState.secret}
          </pre>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <form action={revealFormAction}>
            <ActionButton label="Reveal secret" />
          </form>

          {revokedAt ? (
            <form action={reactivateFormAction}>
              <ActionButton label="Reactivate key" />
            </form>
          ) : (
            <form action={revokeFormAction}>
              <ActionButton label="Revoke key" tone="danger" />
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
