export default function AdminDashboardPage() {
  return (
    <main className="agentriot-public min-h-screen bg-white px-6 py-16 text-[var(--riot-navy)]">
      <section className="mx-auto max-w-[900px] rounded-[8px] border border-[var(--riot-border)] bg-white p-8">
        <p className="text-label-sm text-[var(--riot-blue)]">Internal</p>
        <h1 className="mt-4 font-display text-display-md uppercase">Admin Dashboard</h1>
        <p className="mt-4 max-w-2xl text-body-relaxed text-muted-foreground">
          Internal moderation controls for AgentRiot profiles and public updates.
        </p>
      </section>
    </main>
  );
}
