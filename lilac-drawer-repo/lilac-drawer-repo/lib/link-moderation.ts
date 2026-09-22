import { siteConfig } from "@/lib/site";

/**
 * Common list of generic and country-code top-level domains to accurately
 * detect external links even when written without http:// or https:// (e.g. "bit.ly/xxx" or "amazon.com").
 */
const COMMON_TLDS = [
  // Generic popular TLDs
  "com",
  "org",
  "net",
  "edu",
  "gov",
  "mil",
  "int",
  "io",
  "co",
  "me",
  "ai",
  "ly",
  "to",
  "app",
  "dev",
  "biz",
  "info",
  "xyz",
  "site",
  "online",
  "shop",
  "store",
  "live",
  "club",
  "tech",
  "top",
  "link",
  "vip",
  "pro",
  "mobi",
  "asia",
  "tel",
  "space",
  "blog",
  "news",
  "media",
  "design",
  "fashion",
  // Common Regional & Arabic ccTLDs
  "sa",
  "ae",
  "eg",
  "kw",
  "qa",
  "bh",
  "om",
  "jo",
  "lb",
  "ma",
  "dz",
  "tn",
  "tr",
  "us",
  "uk",
  "ca",
  "de",
  "fr",
  "it",
  "es",
  "nl",
  "ru",
  "cn",
  "jp",
  "in",
  "au",
  "br",
];

const TLD_PATTERN = COMMON_TLDS.join("|");

// Regex 1: Matches explicit protocol URLs: http://... or https://...
const PROTOCOL_URL_REGEX = /https?:\/\/[^\s<>"]+/gi;

// Regex 2: Matches URLs starting with www.
const WWW_URL_REGEX = /\bwww\.[a-z0-9][a-z0-9.-]*\.[a-z]{2,}(?::[0-9]+)?(?:\/[^\s<>"]*)?/gi;

// Regex 3: Matches naked domain URLs with common TLDs (e.g. amazon.com, bit.ly/abc)
const NAKED_DOMAIN_REGEX = new RegExp(
  `\\b[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\\.(?:${TLD_PATTERN})(?::[0-9]+)?(?:\\/[^\\s<>"]*)?`,
  "gi"
);

/**
 * Returns the list of approved internal domains for Lilac Drawer.
 */
export function getAllowedHosts(): string[] {
  const hosts = new Set<string>();

  // 1. Default site domain
  hosts.add("lilacdrawer.com");
  hosts.add("www.lilacdrawer.com");

  // 2. Extracted host from siteConfig.url
  if (siteConfig?.url) {
    try {
      const parsed = new URL(siteConfig.url);
      if (parsed.hostname) {
        hosts.add(parsed.hostname.toLowerCase());
      }
    } catch {
      // ignore
    }
  }

  // 3. Localhost and development IPs
  hosts.add("localhost");
  hosts.add("127.0.0.1");

  // 4. Environment variable site URLs if defined
  if (typeof process !== "undefined" && process.env) {
    const envUrls = [
      process.env.NEXT_PUBLIC_SITE_URL,
      process.env.BETTER_AUTH_URL,
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    ].filter(Boolean);

    for (const raw of envUrls) {
      if (!raw) continue;
      try {
        const u = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
        if (u.hostname) {
          hosts.add(u.hostname.toLowerCase());
        }
      } catch {
        // ignore
      }
    }
  }

  return Array.from(hosts);
}

/**
 * Checks whether a given hostname belongs to the allowed site domains.
 */
export function isAllowedHost(host: string, allowedHosts?: string[]): boolean {
  const cleanHost = host.toLowerCase().trim();
  const hosts = allowedHosts || getAllowedHosts();

  for (const allowed of hosts) {
    const cleanAllowed = allowed.toLowerCase().trim();
    if (cleanHost === cleanAllowed || cleanHost.endsWith(`.${cleanAllowed}`)) {
      return true;
    }
  }

  return false;
}

/**
 * Strips trailing punctuation (such as dots, commas, exclamation marks, Arabic commas)
 * that commonly stick to the end of a URL in natural sentences.
 */
export function cleanTrailingPunctuation(str: string): { clean: string; trailing: string } {
  const match = str.match(/([.,!?:;)\]،؛]+)$/);
  if (match) {
    return {
      clean: str.slice(0, -match[1].length),
      trailing: match[1],
    };
  }
  return { clean: str, trailing: "" };
}

/**
 * Cleans extracted URL token from trailing punctuation like dots, commas, parentheses.
 */
function cleanUrlToken(raw: string): string {
  return cleanTrailingPunctuation(raw).clean;
}

export interface LinkCheckResult {
  hasExternalLink: boolean;
  blockedUrl?: string;
  errorMessage?: string;
}

/**
 * Analyzes any text (post, comment, bio, quote) to detect external links.
 * Returns { hasExternalLink: true, blockedUrl: "...", errorMessage: "..." } if an external link is found.
 */
export function checkExternalLinks(text: string): LinkCheckResult {
  if (!text || typeof text !== "string") {
    return { hasExternalLink: false };
  }

  const allowedHosts = getAllowedHosts();
  const candidates: string[] = [];

  // Find all protocol URLs
  const protocolMatches = text.match(PROTOCOL_URL_REGEX) || [];
  for (const m of protocolMatches) {
    candidates.push(cleanUrlToken(m));
  }

  // Find all www URLs
  const wwwMatches = text.match(WWW_URL_REGEX) || [];
  for (const m of wwwMatches) {
    candidates.push(cleanUrlToken(m));
  }

  // Find all naked domain URLs
  const nakedMatches = text.match(NAKED_DOMAIN_REGEX) || [];
  for (const m of nakedMatches) {
    candidates.push(cleanUrlToken(m));
  }

  // Deduplicate candidates
  const uniqueCandidates = Array.from(new Set(candidates));

  for (const candidate of uniqueCandidates) {
    let parsed: URL | null = null;
    try {
      const urlToParse = candidate.startsWith("http://") || candidate.startsWith("https://")
        ? candidate
        : `https://${candidate}`;
      parsed = new URL(urlToParse);
    } catch {
      continue;
    }

    if (parsed && parsed.hostname) {
      if (!isAllowedHost(parsed.hostname, allowedHosts)) {
        return {
          hasExternalLink: true,
          blockedUrl: candidate,
          errorMessage:
            "External links are not allowed in the community. Only internal links from lilacdrawer.com are permitted.",
        };
      }
    }
  }

  return { hasExternalLink: false };
}

/**
 * Server-side assertion: throws an error if the text contains any external link.
 */
export function assertNoExternalLinks(text: string, context = "this content"): void {
  const result = checkExternalLinks(text);
  if (result.hasExternalLink) {
    throw new Error(
      `External links are not allowed in ${context}. Please remove the link (${result.blockedUrl}) and try again.`
    );
  }
}

export type CommunityTextSegment =
  | { type: "text"; content: string }
  | { type: "link"; content: string; href: string };

export const VALID_INTERNAL_SECTIONS = new Set([
  "deals",
  "blog",
  "category",
  "community",
  "fashion-collage",
  "explore",
  "search",
  "products",
  "profile",
  "notifications",
  "login",
  "signup",
]);

/**
 * Validates whether a candidate link belongs to internal site routes and returns
 * the relative internal href for Next.js navigation (or null if not a valid internal site link).
 */
export function getInternalHref(rawCandidate: string, allowedHosts?: string[]): string | null {
  if (!rawCandidate) return null;
  const { clean } = cleanTrailingPunctuation(rawCandidate);
  if (!clean) return null;

  // 1. Relative internal paths: /deals, /blog/xyz, etc.
  if (clean.startsWith("/")) {
    const section = clean.slice(1).split(/[/?#]/)[0].toLowerCase();
    if (VALID_INTERNAL_SECTIONS.has(section)) {
      return clean;
    }
    return null;
  }

  // 2. Full or naked URLs
  let urlToParse = clean;
  if (!clean.startsWith("http://") && !clean.startsWith("https://")) {
    urlToParse = `https://${clean}`;
  }

  try {
    const parsed = new URL(urlToParse);
    if (isAllowedHost(parsed.hostname, allowedHosts)) {
      // Return relative pathname + search + hash
      const pathWithQuery = `${parsed.pathname || "/"}${parsed.search || ""}${parsed.hash || ""}`;
      return pathWithQuery;
    }
  } catch {
    return null;
  }

  return null;
}

const CANDIDATE_LINK_REGEX =
  /(https?:\/\/[^\s<>"]+|\bwww\.[^\s<>"]+|\b(?:[a-zA-Z0-9-]+\.)*lilacdrawer\.com(?::\d+)?(?:\/[^\s<>"]*)?|\blocalhost(?::\d+)?(?:\/[^\s<>"]*)?|\b127\.0\.0\.1(?::\d+)?(?:\/[^\s<>"]*)?|\/(?:deals|blog|category|community|fashion-collage|explore|search|products|profile|notifications|login|signup)(?:\/[^\s<>"]*)?)/gi;

/**
 * Parses user text and returns structured segments of plain text and clickable internal links.
 * External links or unrecognized paths remain plain text.
 */
export function parseCommunityText(text: string): CommunityTextSegment[] {
  if (!text || typeof text !== "string") return [];

  const segments: CommunityTextSegment[] = [];
  let lastIndex = 0;

  CANDIDATE_LINK_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = CANDIDATE_LINK_REGEX.exec(text)) !== null) {
    const matchIndex = match.index;
    const matchStr = match[0];

    // For relative paths starting with '/', verify it's preceded by whitespace or at start of text
    if (matchStr.startsWith("/")) {
      if (matchIndex > 0 && !/\s/.test(text[matchIndex - 1])) {
        // Not a standalone path (e.g. part of word or fraction)
        continue;
      }
    }

    // Push preceding text if any
    if (matchIndex > lastIndex) {
      segments.push({
        type: "text",
        content: text.slice(lastIndex, matchIndex),
      });
    }

    const { clean, trailing } = cleanTrailingPunctuation(matchStr);
    const href = getInternalHref(clean);

    if (href) {
      segments.push({
        type: "link",
        content: clean,
        href,
      });
      if (trailing) {
        segments.push({
          type: "text",
          content: trailing,
        });
      }
    } else {
      segments.push({
        type: "text",
        content: matchStr,
      });
    }

    lastIndex = matchIndex + matchStr.length;
  }

  if (lastIndex < text.length) {
    segments.push({
      type: "text",
      content: text.slice(lastIndex),
    });
  }

  // Merge adjacent plain text segments
  const merged: CommunityTextSegment[] = [];
  for (const seg of segments) {
    if (merged.length > 0 && merged[merged.length - 1].type === "text" && seg.type === "text") {
      merged[merged.length - 1].content += seg.content;
    } else {
      merged.push({ ...seg });
    }
  }

  return merged;
}

