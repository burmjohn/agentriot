export type RelatedSoftwareLink = {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
};

export type RelatedAgentLink = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
};

export type NewsArticleRecord = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  tags: string[];
  featured: boolean;
  publishedAt: Date;
  author: string;
  metaTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
};

export type NewsArticleDetail = NewsArticleRecord & {
  relatedSoftware: RelatedSoftwareLink[];
  relatedAgents: RelatedAgentLink[];
};
