"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { type AdminActionState } from "@/app/admin/actions";

const initialActionState: AdminActionState = {
  error: null,
};

type Field =
  | {
      name: string;
      label: string;
      kind: "text" | "url" | "datetime-local";
      placeholder?: string;
      required?: boolean;
    }
  | {
      name: string;
      label: string;
      kind: "textarea";
      placeholder?: string;
      required?: boolean;
      rows?: number;
    }
  | {
      name: string;
      label: string;
      kind: "select";
      required?: boolean;
      options: Array<{ label: string; value: string }>;
    };

type InitialValues = Record<string, string | null | undefined>;

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

function FieldInputWithValue({
  field,
  value,
}: {
  field: Field;
  value?: string | null;
}) {
  if (field.kind === "textarea") {
    return (
      <label className="grid gap-2">
        <span className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted">
          {field.label}
        </span>
        <textarea
          name={field.name}
          required={field.required}
          rows={field.rows ?? 6}
          placeholder={field.placeholder}
          defaultValue={value ?? ""}
          className="rounded-[1.5rem] border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-foreground/35"
        />
      </label>
    );
  }

  if (field.kind === "select") {
    return (
      <label className="grid gap-2">
        <span className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted">
          {field.label}
        </span>
        <select
          name={field.name}
          required={field.required}
          className="min-h-12 rounded-[1.5rem] border border-border bg-background px-4 text-sm text-foreground outline-none transition-colors focus:border-foreground/35"
          defaultValue={value ?? field.options[0]?.value}
        >
          {field.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <label className="grid gap-2">
      <span className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted">
        {field.label}
      </span>
      <input
        type={field.kind}
        name={field.name}
        required={field.required}
        placeholder={field.placeholder}
        defaultValue={value ?? ""}
        className="min-h-12 rounded-[1.5rem] border border-border bg-background px-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-foreground/35"
      />
    </label>
  );
}

export function AdminRecordForm({
  title,
  detail,
  submitLabel,
  action,
  fields,
  initialValues,
}: {
  title: string;
  detail: string;
  submitLabel: string;
  action: (
    state: AdminActionState,
    payload: FormData,
  ) => Promise<AdminActionState>;
  fields: Field[];
  initialValues?: InitialValues;
}) {
  const [state, formAction] = useActionState(action, initialActionState);

  return (
    <section className="grid gap-4">
      <div className="space-y-3">
        <h2 className="text-3xl font-semibold tracking-[-0.05em] text-foreground">
          {title}
        </h2>
        <p className="max-w-2xl text-sm leading-7 text-muted">{detail}</p>
      </div>

      <form action={formAction} className="panel grid gap-5 rounded-[1.75rem] p-6">
        {fields.map((field) => (
          <FieldInputWithValue
            key={field.name}
            field={field}
            value={initialValues?.[field.name]}
          />
        ))}

        {state.error ? (
          <p className="rounded-[1.25rem] border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200 dark:text-red-200">
            {state.error}
          </p>
        ) : null}

        <div className="flex justify-start">
          <SubmitButton label={submitLabel} />
        </div>
      </form>
    </section>
  );
}
