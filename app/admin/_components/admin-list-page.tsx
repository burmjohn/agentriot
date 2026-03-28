import Link from "next/link";
import { AdminFeedbackBanner } from "@/app/admin/_components/admin-feedback-banner";
import { AdminEmptyState } from "@/app/admin/_components/admin-empty-state";
import type { AdminActionFeedback } from "@/lib/admin/action-feedback";
import type { AdminEntitySummary } from "@/lib/admin/cms";

function formatStatus(status: string) {
  return status.replace("-", " ");
}

export function AdminListPage({
  eyebrow,
  title,
  detail,
  createHref,
  createLabel,
  items,
  feedback,
}: {
  eyebrow: string;
  title: string;
  detail: string;
  createHref: string;
  createLabel: string;
  items: AdminEntitySummary[];
  feedback?: AdminActionFeedback | null;
}) {
  if (items.length === 0) {
    return (
      <div className="grid gap-4">
        {feedback ? <AdminFeedbackBanner feedback={feedback} /> : null}
        <AdminEmptyState
          title={`No ${title.toLowerCase()} yet`}
          detail={detail}
          actionHref={createHref}
          actionLabel={createLabel}
        />
      </div>
    );
  }

  return (
    <section className="grid gap-4">
      {feedback ? <AdminFeedbackBanner feedback={feedback} /> : null}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-muted">
            {eyebrow}
          </p>
          <h2 className="text-3xl font-semibold tracking-[-0.05em] text-foreground">
            {title}
          </h2>
          <p className="max-w-2xl text-sm leading-7 text-muted">{detail}</p>
        </div>

        <Link
          href={createHref}
          className="inline-flex min-h-11 items-center rounded-full bg-foreground px-4 text-sm font-medium text-background transition-transform hover:-translate-y-0.5"
        >
          {createLabel}
        </Link>
      </div>

      <div className="panel overflow-hidden rounded-[1.75rem]">
        <div className="grid gap-px bg-border/70">
          {items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="grid gap-3 bg-background/95 px-5 py-5 transition-colors hover:bg-surface sm:grid-cols-[1.5fr_0.7fr_0.7fr]"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted">
                    {item.slug}
                  </span>
                </div>
                <p className="text-base font-medium text-foreground">{item.title}</p>
                {item.meta ? (
                  <p className="max-w-xl text-sm leading-6 text-muted">{item.meta}</p>
                ) : null}
              </div>
              <div className="font-mono text-xs uppercase tracking-[0.16em] text-muted sm:self-center">
                {formatStatus(item.status)}
              </div>
              <div className="font-mono text-xs uppercase tracking-[0.16em] text-muted sm:self-center sm:text-right">
                {item.updatedAt.toLocaleDateString()}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
