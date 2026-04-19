import { cache } from "react";

import {
  getSoftwareEntryBySlug as getSoftwareEntryBySlugFromRepository,
  listSoftwareCategories,
  listSoftwareEntries,
  listSoftwareEntriesByCategory,
} from "./repository";

export type { RelatedAgentLink, RelatedNewsLink, SoftwareEntryDetail, SoftwareEntryRecord } from "./types";

export const getSoftwareEntries = cache(listSoftwareEntries);
export const getSoftwareEntriesByCategory = cache(listSoftwareEntriesByCategory);
export const getSoftwareCategories = cache(listSoftwareCategories);
export const getSoftwareEntryBySlug = cache(getSoftwareEntryBySlugFromRepository);
