export type RelatedAgentLink = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
};

export type RelatedNewsLink = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  publishedAt: Date;
};

export type SoftwareEntryRecord = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  officialUrl: string;
  githubUrl: string | null;
  docsUrl: string | null;
  downloadUrl: string | null;
  relatedNewsIds: string[];
  metaTitle: string | null;
  metaDescription: string | null;
};

export type SoftwareEntryDetail = SoftwareEntryRecord & {
  relatedAgents: RelatedAgentLink[];
  relatedNews: RelatedNewsLink[];
};
