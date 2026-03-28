import type { Metadata } from "next";

const defaultDescription = "Track what changed in AI. Find what to use next.";

export function buildPageMetadata({
  title,
  description,
  path,
  canonicalUrl,
  imageUrl,
}: {
  title: string;
  description?: string | null;
  path: string;
  canonicalUrl?: string | null;
  imageUrl?: string | null;
}): Metadata {
  const resolvedDescription = description?.trim() || defaultDescription;
  const resolvedCanonical = canonicalUrl?.trim() || path;
  const resolvedImage = imageUrl?.trim() || null;

  return {
    title,
    description: resolvedDescription,
    alternates: {
      canonical: resolvedCanonical,
    },
    openGraph: {
      title,
      description: resolvedDescription,
      url: resolvedCanonical,
      siteName: "AgentRiot",
      type: "website",
      images: resolvedImage ? [{ url: resolvedImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: resolvedDescription,
      images: resolvedImage ? [resolvedImage] : undefined,
    },
  };
}

export { defaultDescription };
