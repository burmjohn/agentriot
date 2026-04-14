import Link from "next/link";
import {
  getPublicTaxonomyHref,
  groupTaxonomyTermsByKind,
  type PublicTaxonomyTerm,
} from "@/lib/public/presentation";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/agents", label: "Agents" },
  { href: "/prompts", label: "Prompts" },
  { href: "/skills", label: "Skills" },
  { href: "/tutorials", label: "Tutorials" },
  { href: "/articles", label: "Articles" },
  { href: "/about", label: "About" },
  { href: "/api", label: "API" },
];

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen pb-20">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <header className="panel sticky top-3 z-30 rounded-[1.75rem] px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link
              href="/"
              className="flex items-center gap-3 text-sm font-medium tracking-[0.18em]"
            >
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-accent" />
              <span className="font-mono uppercase text-muted">{"AgentRiot //"}</span>
            </Link>
            <nav className="hidden items-center gap-6 text-sm text-muted md:flex">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  className="transition-colors hover:text-foreground"
                  href={item.href}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <Link
              href="/search"
              className="chip inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium text-foreground transition-transform hover:-translate-y-0.5"
            >
              Search
            </Link>
          </div>
          <div className="-mx-1 mt-4 overflow-x-auto md:hidden">
            <div className="flex min-w-max gap-2 px-1 pb-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  className="chip rounded-full px-3 py-2 font-mono text-xs uppercase tracking-[0.18em] text-muted"
                  href={item.href}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </header>

        {children}
      </div>
    </main>
  );
}

export function PublicPageHeader({
  eyebrow,
  title,
  detail,
}: {
  eyebrow: string;
  title: string;
  detail: string;
}) {
  return (
    <section className="panel grid gap-4 rounded-[2rem] px-5 py-7 sm:px-7">
      <p className="font-mono text-[0.7rem] uppercase tracking-[0.26em] text-muted">
        {eyebrow}
      </p>
      <div className="grid gap-3 lg:grid-cols-[1.3fr_0.7fr] lg:items-end">
        <h1 className="text-balance text-4xl font-semibold tracking-[-0.06em] text-foreground sm:text-5xl">
          {title}
        </h1>
        <p className="max-w-xl text-sm leading-7 text-muted lg:justify-self-end lg:text-right">
          {detail}
        </p>
      </div>
    </section>
  );
}

export function PublicEmptyState({
  title,
  detail,
  actions,
}: {
  title: string;
  detail: string;
  actions?: React.ReactNode;
}) {
  return (
    <section className="panel rounded-[1.75rem] px-6 py-8">
      <div className="grid gap-3">
        <h2 className="text-2xl font-semibold tracking-[-0.05em] text-foreground">
          {title}
        </h2>
        <p className="max-w-2xl text-sm leading-7 text-muted">{detail}</p>
        {actions ? <div className="flex flex-wrap gap-3 pt-2">{actions}</div> : null}
      </div>
    </section>
  );
}

export function PublicCollectionGrid({
  items,
}: {
  items: Array<{
    href: string;
    title: string;
    summary: string | null;
    meta: string[];
  }>;
}) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="panel grid gap-4 rounded-[1.75rem] p-5 transition-transform hover:-translate-y-0.5"
        >
          <div className="flex flex-wrap gap-2">
            {item.meta.map((meta) => (
              <span
                key={meta}
                className="chip rounded-full px-3 py-1 font-mono text-[0.66rem] uppercase tracking-[0.16em] text-muted"
              >
                {meta}
              </span>
            ))}
          </div>
          <div className="grid gap-2">
            <h2 className="text-2xl font-semibold tracking-[-0.05em] text-foreground">
              {item.title}
            </h2>
            {item.summary ? (
              <p className="text-sm leading-7 text-muted">{item.summary}</p>
            ) : null}
          </div>
        </Link>
      ))}
    </section>
  );
}

export function PublicFilterChips({
  basePath,
  activeSlug,
  terms,
}: {
  basePath: string;
  activeSlug?: string;
  terms: PublicTaxonomyTerm[];
}) {
  if (terms.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={basePath}
        className={`rounded-full px-3 py-2 font-mono text-xs uppercase tracking-[0.18em] transition-colors ${
          !activeSlug
            ? "bg-foreground text-background"
            : "chip text-muted hover:text-foreground"
        }`}
      >
        All
      </Link>
      {terms.map((term) => {
        const href = `${basePath}?term=${encodeURIComponent(term.slug)}`;
        const isActive = term.slug === activeSlug;

        return (
          <Link
            key={term.id}
            href={href}
            className={`rounded-full px-3 py-2 font-mono text-xs uppercase tracking-[0.18em] transition-colors ${
              isActive
                ? "bg-foreground text-background"
                : "chip text-muted hover:text-foreground"
            }`}
          >
            {term.label}
          </Link>
        );
      })}
    </div>
  );
}

export function PublicDetailHero({
  eyebrow,
  title,
  summary,
  meta,
  actions,
}: {
  eyebrow: string;
  title: string;
  summary: string | null;
  meta: string[];
  actions?: React.ReactNode;
}) {
  return (
    <section className="panel grid gap-6 rounded-[2rem] px-5 py-7 sm:px-7">
      <div className="grid gap-3">
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.24em] text-muted">
          {eyebrow}
        </p>
        <h1 className="max-w-4xl text-balance text-4xl font-semibold tracking-[-0.06em] text-foreground sm:text-5xl">
          {title}
        </h1>
        {summary ? (
          <p className="max-w-3xl text-lg leading-8 text-muted">{summary}</p>
        ) : null}
      </div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {meta.map((item) => (
            <span
              key={item}
              className="chip rounded-full px-3 py-1 font-mono text-[0.66rem] uppercase tracking-[0.16em] text-muted"
            >
              {item}
            </span>
          ))}
        </div>
        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>
    </section>
  );
}

export function PublicPanel({
  title,
  detail,
  children,
}: {
  title: string;
  detail?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="panel grid gap-4 rounded-[1.75rem] p-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-[-0.05em] text-foreground">
          {title}
        </h2>
        {detail ? <p className="text-sm leading-7 text-muted">{detail}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function PublicHeroMedia({
  imageUrl,
  title,
}: {
  imageUrl: string;
  title: string;
}) {
  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-border/80 bg-surface-2/70">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt={`${title} hero`}
        className="h-full max-h-[28rem] w-full object-cover"
      />
    </div>
  );
}

export function PublicBody({ body }: { body: string | null }) {
  if (!body) {
    return (
      <p className="text-sm leading-7 text-muted">
        No description available for this record yet.
      </p>
    );
  }

  return (
    <div className="whitespace-pre-wrap text-sm leading-7 text-foreground/92">
      {body}
    </div>
  );
}

export function PublicTaxonomyGroups({
  terms,
}: {
  terms: PublicTaxonomyTerm[];
}) {
  const groups = groupTaxonomyTermsByKind(terms);

  if (groups.length === 0) {
    return (
      <p className="text-sm leading-7 text-muted">
        No topics tagged yet.
      </p>
    );
  }

  return (
    <div className="grid gap-4">
      {groups.map((group) => (
        <div key={group.kind} className="grid gap-2">
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted">
            {group.label}
          </p>
          <div className="flex flex-wrap gap-2">
            {group.terms.map((term) => (
              <Link
                key={term.id}
                href={getPublicTaxonomyHref(term)}
                className="chip rounded-full px-3 py-1 text-sm text-foreground"
              >
                {term.label}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function PublicRelatedList({
  items,
  emptyMessage,
}: {
  items: Array<{
    id: string;
    title: string;
    href: string;
    meta: string | null;
  }>;
  emptyMessage: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm leading-7 text-muted">{emptyMessage}</p>;
  }

  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          className="rounded-[1.25rem] border border-border/80 bg-background/85 px-4 py-4 transition-colors hover:bg-surface"
        >
          <div className="grid gap-1">
            <p className="text-sm font-medium text-foreground">{item.title}</p>
            {item.meta ? (
              <p className="text-sm leading-6 text-muted">{item.meta}</p>
            ) : null}
          </div>
        </Link>
      ))}
    </div>
  );
}
