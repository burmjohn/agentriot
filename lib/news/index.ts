import { cache } from "react";

import {
  getFeaturedNewsArticle as getFeaturedNewsArticleFromRepository,
  getNewsArticleBySlug as getNewsArticleBySlugFromRepository,
  listPublishedNewsArticles,
} from "./repository";

export type { NewsArticleDetail, NewsArticleRecord, RelatedAgentLink, RelatedSoftwareLink } from "./types";

export const getPublishedNewsArticles = cache(listPublishedNewsArticles);
export const getFeaturedNewsArticle = cache(getFeaturedNewsArticleFromRepository);
export const getNewsArticleBySlug = cache(getNewsArticleBySlugFromRepository);
