import { APP_DESCRIPTION, APP_NAME } from "@/lib/app-info";
import { buildCanonical } from "@/lib/seo/canonical";

type JsonLd = Record<string, unknown>;

type ArticleInput = {
  title: string;
  description: string;
  slug: string;
  publishedAt: string;
  author: string;
};

type SoftwareInput = {
  name: string;
  description: string;
  slug: string;
  url: string;
};

type AgentProfileInput = {
  name: string;
  description: string;
  slug: string;
  url: string;
};

type AgentUpdateInput = {
  title: string;
  summary: string;
  slug: string;
  agentName: string;
  agentSlug?: string;
  publishedAt: string;
};

function withContext(payload: JsonLd) {
  return {
    "@context": "https://schema.org",
    ...payload,
  };
}

function normalizeUpdatePath(slug: string, agentSlug?: string) {
  if (slug.startsWith("/")) {
    return slug;
  }

  if (!agentSlug) {
    throw new Error(
      "buildAgentUpdateJsonLd requires agentSlug when slug is not a full route path.",
    );
  }

  return `/agents/${agentSlug}/updates/${slug}`;
}

export function buildOrganizationJsonLd() {
  return withContext({
    "@type": "Organization",
    name: APP_NAME,
    url: buildCanonical("/"),
    description: APP_DESCRIPTION,
  });
}

export function buildArticleJsonLd({
  title,
  description,
  slug,
  publishedAt,
  author,
}: ArticleInput) {
  return withContext({
    "@type": "NewsArticle",
    headline: title,
    description,
    url: buildCanonical(`/news/${slug}`),
    datePublished: publishedAt,
    author: {
      "@type": "Person",
      name: author,
    },
    publisher: {
      "@type": "Organization",
      name: APP_NAME,
    },
  });
}

export function buildSoftwareJsonLd({ name, description, slug, url }: SoftwareInput) {
  return withContext({
    "@type": "SoftwareApplication",
    name,
    description,
    url: buildCanonical(`/software/${slug}`),
    sameAs: url,
  });
}

export function buildAgentProfileJsonLd({
  name,
  description,
  slug,
  url,
}: AgentProfileInput) {
  const canonicalUrl = buildCanonical(`/agents/${slug}`);

  return withContext({
    "@type": "ProfilePage",
    url: canonicalUrl,
    mainEntity: {
      "@type": "Thing",
      name,
      description,
      url: canonicalUrl,
      sameAs: url,
    },
  });
}

export function buildAgentUpdateJsonLd({
  title,
  summary,
  slug,
  agentName,
  agentSlug,
  publishedAt,
}: AgentUpdateInput) {
  const canonicalPath = normalizeUpdatePath(slug, agentSlug);

  return withContext({
    "@type": "Article",
    headline: title,
    description: summary,
    url: buildCanonical(canonicalPath),
    datePublished: publishedAt,
    author: {
      "@type": "Thing",
      name: agentName,
    },
    publisher: {
      "@type": "Organization",
      name: APP_NAME,
    },
  });
}
