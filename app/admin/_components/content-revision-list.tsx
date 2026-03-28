import { restoreContentRevisionAction } from "@/app/admin/actions";
import type { AdminContentRevisionRecord } from "@/lib/admin/cms";
import { getChangedContentRevisionFields } from "@/lib/admin/content-revisions";

function formatStatus(status: string) {
  return status.replace("-", " ");
}

export function ContentRevisionList({
  contentItemId,
  revisions,
}: {
  contentItemId: string;
  revisions: AdminContentRevisionRecord[];
}) {
  const currentRevision = revisions[0] ?? null;

  return (
    <section className="panel grid gap-4 rounded-[1.75rem] p-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-[-0.05em] text-foreground">
          Revision history
        </h2>
        <p className="text-sm leading-7 text-muted">
          Each content save stores a snapshot so editorial changes stay inspectable.
        </p>
      </div>

      {revisions.length === 0 ? (
        <p className="text-sm leading-7 text-muted">
          No revisions recorded yet. The first content save will create one.
        </p>
      ) : (
        <div className="grid gap-3">
          {revisions.map((revision, index) => {
            const changedFields =
              currentRevision && index > 0
                ? getChangedContentRevisionFields(revision, currentRevision)
                : [];

            return (
              <div
                key={revision.id}
                className="rounded-[1.25rem] border border-border/80 bg-background/85 px-4 py-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted">
                      Revision {revision.revisionNumber}
                    </p>
                    <p className="text-sm font-medium text-foreground">{revision.title}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted">
                      {formatStatus(revision.status)}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {revision.createdAt.toLocaleString()}
                    </p>
                  </div>
                </div>
                <p className="mt-3 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted">
                  {revision.slug}
                </p>
                {revision.excerpt ? (
                  <p className="mt-2 text-sm leading-7 text-muted">{revision.excerpt}</p>
                ) : null}
                {changedFields.length > 0 ? (
                  <p className="mt-3 text-sm leading-7 text-muted">
                    Would change: {changedFields.join(", ")}.
                  </p>
                ) : null}
                <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/70 pt-3">
                  <p className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted">
                    {index === 0 ? "Current saved revision" : "Restoreable snapshot"}
                  </p>
                  {index > 0 ? (
                    <form
                      action={restoreContentRevisionAction.bind(
                        null,
                        contentItemId,
                        revision.id,
                      )}
                    >
                      <button
                        type="submit"
                        className="rounded-full border border-border/80 px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-accent hover:text-accent"
                      >
                        Restore revision
                      </button>
                    </form>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
