import type { Metadata } from "next";

import { APP_NAME } from "@/lib/app-info";
import { buildCanonical, type RedirectLookup } from "@/lib/seo/canonical";

type SupportedOpenGraphType = "article" | "website";

type BuildMetadataInput = {
  title: string;
  description: string;
  canonical: string;
  type: SupportedOpenGraphType;
  redirectLookup?: RedirectLookup;
};

function buildTitle(title: string) {
  return `${title} | ${APP_NAME}`;
}

export function buildMetadata({
  title,
  description,
  canonical,
  type,
  redirectLookup,
}: BuildMetadataInput): Metadata {
  const canonicalUrl = buildCanonical(canonical, { redirectLookup });
  const fullTitle = buildTitle(title);

  return {
    title: fullTitle,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: fullTitle,
      description,
      url: canonicalUrl,
      siteName: APP_NAME,
      type,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
  };
}

export function buildNoindexMetadata(): Metadata {
  return {
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
        "max-image-preview": "none",
        "max-snippet": 0,
      },
    },
  };
}
