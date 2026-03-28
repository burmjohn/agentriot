import { defaultDescription } from "@/lib/seo/metadata";
import {
  listPublishedAgents,
  listPublishedContent,
  listPublishedPrompts,
  listPublishedSkills,
} from "@/lib/public/hub";

export type PublicFeedItem = {
  id: string;
  kind: "article" | "tutorial" | "agent" | "prompt" | "skill";
  title: string;
  href: string;
  summary: string | null;
  publishedAt: Date;
};

function toAbsoluteUrl(siteUrl: string, href: string) {
  return new URL(href, siteUrl).toString();
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export async function listPublishedFeedItems(limit = 40): Promise<PublicFeedItem[]> {
  const [articles, tutorials, agents, prompts, skills] = await Promise.all([
    listPublishedContent("article"),
    listPublishedContent("tutorial"),
    listPublishedAgents(),
    listPublishedPrompts(),
    listPublishedSkills(),
  ]);

  return [
    ...articles.map((item) => ({
      id: item.id,
      kind: item.kind,
      title: item.title,
      href: `/articles/${item.slug}`,
      summary: item.excerpt,
      publishedAt: item.publishedAt ?? item.updatedAt,
    })),
    ...tutorials.map((item) => ({
      id: item.id,
      kind: item.kind,
      title: item.title,
      href: `/tutorials/${item.slug}`,
      summary: item.excerpt,
      publishedAt: item.publishedAt ?? item.updatedAt,
    })),
    ...agents.map((item) => ({
      id: item.id,
      kind: "agent" as const,
      title: item.title,
      href: `/agents/${item.slug}`,
      summary: item.shortDescription,
      publishedAt: item.updatedAt,
    })),
    ...prompts.map((item) => ({
      id: item.id,
      kind: "prompt" as const,
      title: item.title,
      href: `/prompts/${item.slug}`,
      summary: item.shortDescription,
      publishedAt: item.updatedAt,
    })),
    ...skills.map((item) => ({
      id: item.id,
      kind: "skill" as const,
      title: item.title,
      href: `/skills/${item.slug}`,
      summary: item.shortDescription,
      publishedAt: item.updatedAt,
    })),
  ]
    .sort((left, right) => right.publishedAt.getTime() - left.publishedAt.getTime())
    .slice(0, limit);
}

export function buildRssFeedXml(
  items: PublicFeedItem[],
  {
    siteUrl,
    feedUrl,
    title,
    description = defaultDescription,
  }: {
    siteUrl: string;
    feedUrl: string;
    title: string;
    description?: string;
  },
) {
  const itemXml = items
    .map((item) => {
      const absoluteUrl = toAbsoluteUrl(siteUrl, item.href);
      const summary = item.summary?.trim() || `${item.kind} update on AgentRiot.`;

      return [
        "<item>",
        `<guid>${escapeXml(`${absoluteUrl}#${item.id}`)}</guid>`,
        `<title>${escapeXml(item.title)}</title>`,
        `<link>${escapeXml(absoluteUrl)}</link>`,
        `<description>${escapeXml(summary)}</description>`,
        `<category>${escapeXml(item.kind)}</category>`,
        `<pubDate>${item.publishedAt.toUTCString()}</pubDate>`,
        "</item>",
      ].join("");
    })
    .join("");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    "<channel>",
    `<title>${escapeXml(title)}</title>`,
    `<link>${escapeXml(siteUrl)}</link>`,
    `<description>${escapeXml(description)}</description>`,
    `<atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" xmlns:atom="http://www.w3.org/2005/Atom" />`,
    itemXml,
    "</channel>",
    "</rss>",
  ].join("");
}

export function buildJsonFeed(
  items: PublicFeedItem[],
  {
    siteUrl,
    feedUrl,
    title,
    description = defaultDescription,
  }: {
    siteUrl: string;
    feedUrl: string;
    title: string;
    description?: string;
  },
) {
  return {
    version: "https://jsonfeed.org/version/1.1",
    title,
    home_page_url: siteUrl,
    feed_url: feedUrl,
    description,
    items: items.map((item) => ({
      id: item.id,
      url: toAbsoluteUrl(siteUrl, item.href),
      title: item.title,
      content_text: item.summary?.trim() || `${item.kind} update on AgentRiot.`,
      date_published: item.publishedAt.toISOString(),
      tags: [item.kind],
    })),
  };
}
