import { env } from "@/lib/env";

export function getSiteUrl() {
  return env.NEXT_PUBLIC_SITE_URL || env.NEXT_PUBLIC_APP_URL;
}

export function absoluteUrl(path: string, siteUrl = getSiteUrl()) {
  if (/^https?:\/\//.test(path)) {
    return path;
  }

  return new URL(path, siteUrl).toString();
}
