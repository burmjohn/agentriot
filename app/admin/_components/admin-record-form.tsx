"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { type AdminActionState } from "@/app/admin/actions";
import { getAutoSlugValue, isSlugCustomized } from "@/lib/admin/slug-draft";

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
  controlledValue,
  onValueChange,
}: {
  field: Field;
  value?: string | null;
  controlledValue?: string;
  onValueChange?: (nextValue: string) => void;
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
          {...(controlledValue !== undefined
            ? {
                value: controlledValue,
                onChange: (
                  event: React.ChangeEvent<HTMLTextAreaElement>,
                ) => onValueChange?.(event.target.value),
              }
            : { defaultValue: value ?? "" })}
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
        {...(controlledValue !== undefined
          ? {
              value: controlledValue,
              onChange: (
                event: React.ChangeEvent<HTMLInputElement>,
              ) => onValueChange?.(event.target.value),
            }
          : { defaultValue: value ?? "" })}
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
  mediaPreview,
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
  mediaPreview?: {
    imageUrl?: string | null;
    alt: string;
    detail?: string;
  };
}) {
  const [state, formAction] = useActionState(action, initialActionState);
  const sourceFieldName = fields.some((field) => field.name === "title")
    ? "title"
    : fields.some((field) => field.name === "label")
      ? "label"
      : null;
  const hasSlugField = fields.some((field) => field.name === "slug");
  const managedSourceEnabled = Boolean(sourceFieldName && hasSlugField);
  const initialSourceValue = sourceFieldName
    ? String(initialValues?.[sourceFieldName] ?? "")
    : "";
  const initialSlugValue = String(initialValues?.slug ?? "");
  const [sourceValue, setSourceValue] = useState(initialSourceValue);
  const [slugValue, setSlugValue] = useState(
    initialSlugValue || getAutoSlugValue(initialSourceValue),
  );
  const [slugCustomized, setSlugCustomized] = useState(
    isSlugCustomized(initialSourceValue, initialSlugValue),
  );

  function handleSourceValueChange(nextValue: string) {
    setSourceValue(nextValue);

    if (!slugCustomized) {
      setSlugValue(getAutoSlugValue(nextValue));
    }
  }

  function handleSlugValueChange(nextValue: string) {
    setSlugValue(nextValue);
    setSlugCustomized(isSlugCustomized(sourceValue, nextValue));
  }

  return (
    <section className="grid gap-4">
      <div className="space-y-3">
        <h2 className="text-3xl font-semibold tracking-[-0.05em] text-foreground">
          {title}
        </h2>
        <p className="max-w-2xl text-sm leading-7 text-muted">{detail}</p>
      </div>

      <form action={formAction} className="panel grid gap-5 rounded-[1.75rem] p-6">
        {mediaPreview?.imageUrl ? (
          <div className="grid gap-3 rounded-[1.5rem] border border-border/80 bg-background/80 p-4">
            <div className="space-y-1">
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted">
                Current hero media
              </p>
              {mediaPreview.detail ? (
                <p className="text-sm leading-6 text-muted">{mediaPreview.detail}</p>
              ) : null}
            </div>
            <div className="overflow-hidden rounded-[1.25rem] border border-border/80 bg-surface-2/70">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mediaPreview.imageUrl}
                alt={mediaPreview.alt}
                className="h-full max-h-80 w-full object-cover"
              />
            </div>
          </div>
        ) : null}

        {fields.map((field) => (
          <FieldInputWithValue
            key={field.name}
            field={field}
            value={initialValues?.[field.name]}
            controlledValue={
              managedSourceEnabled && sourceFieldName === field.name
                ? sourceValue
                : managedSourceEnabled && field.name === "slug"
                  ? slugValue
                  : undefined
            }
            onValueChange={
              managedSourceEnabled && sourceFieldName === field.name
                ? handleSourceValueChange
                : managedSourceEnabled && field.name === "slug"
                  ? handleSlugValueChange
                  : undefined
            }
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
