import type { AdminActionFeedback } from "@/lib/admin/action-feedback";

export function AdminFeedbackBanner({
  feedback,
}: {
  feedback: AdminActionFeedback;
}) {
  const toneClass =
    feedback.tone === "error"
      ? "border-red-500/40 bg-red-500/10 text-red-100"
      : "border-emerald-500/30 bg-emerald-500/10 text-emerald-50";

  return (
    <div className={`rounded-[1.25rem] border px-4 py-3 text-sm leading-7 ${toneClass}`}>
      {feedback.message}
    </div>
  );
}
