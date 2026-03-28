import type { RelationOption } from "@/lib/admin/cms";

export function AdminRelationEditor({
  title,
  detail,
  action,
  options,
  selectedIds,
  submitLabel = "Save relations",
  emptyMessage = "No related records exist yet for this section.",
}: {
  title: string;
  detail: string;
  action: (formData: FormData) => void | Promise<void>;
  options: RelationOption[];
  selectedIds: string[];
  submitLabel?: string;
  emptyMessage?: string;
}) {
  return (
    <section className="panel grid gap-4 rounded-[1.75rem] p-6">
      <div className="space-y-2">
        <h3 className="text-2xl font-semibold tracking-[-0.04em] text-foreground">
          {title}
        </h3>
        <p className="text-sm leading-7 text-muted">{detail}</p>
      </div>

      <form action={action} className="grid gap-3">
        <div className="grid gap-2">
          {options.length === 0 ? (
            <p className="rounded-[1.25rem] border border-border/80 bg-background/80 px-4 py-4 text-sm text-muted">
              {emptyMessage}
            </p>
          ) : (
            options.map((option) => (
              <label
                key={option.id}
                className="flex items-start gap-3 rounded-[1.25rem] border border-border/80 bg-background/80 px-4 py-3"
              >
                <input
                  type="checkbox"
                  name="relatedIds"
                  value={option.id}
                  defaultChecked={selectedIds.includes(option.id)}
                  className="mt-1 h-4 w-4 accent-[var(--accent-strong)]"
                />
                <span className="grid gap-1">
                  <span className="text-sm font-medium text-foreground">
                    {option.title}
                  </span>
                  {option.meta ? (
                    <span className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-muted">
                      {option.meta}
                    </span>
                  ) : null}
                </span>
              </label>
            ))
          )}
        </div>

        <div>
          <button
            type="submit"
            className="inline-flex min-h-11 items-center rounded-full bg-foreground px-4 text-sm font-medium text-background transition-transform hover:-translate-y-0.5"
          >
            {submitLabel}
          </button>
        </div>
      </form>
    </section>
  );
}
