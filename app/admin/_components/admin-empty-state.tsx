import Link from "next/link";

export function AdminEmptyState({
  title,
  detail,
  actionHref,
  actionLabel,
}: {
  title: string;
  detail: string;
  actionHref: string;
  actionLabel: string;
}) {
  return (
    <div className="panel grid gap-4 rounded-[1.5rem] p-6">
      <div className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-[-0.04em] text-foreground">
          {title}
        </h2>
        <p className="max-w-xl text-sm leading-7 text-muted">{detail}</p>
      </div>
      <div>
        <Link
          href={actionHref}
          className="inline-flex min-h-11 items-center rounded-full bg-foreground px-4 text-sm font-medium text-background transition-transform hover:-translate-y-0.5"
        >
          {actionLabel}
        </Link>
      </div>
    </div>
  );
}
