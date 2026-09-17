import type { ScanOptions } from '../models/scanOptions.js';
import { normalizeUrl } from './urlNormalizer.js';
const asset =
  /\.(?:pdf|zip|gz|tar|7z|rar|png|jpe?g|gif|svg|webp|ico|avif|mp[34]|wav|ogg|webm|mov|avi|woff2?|ttf|eot|css|js|json|xml|txt|csv|docx?|xlsx?|pptx?|exe|dmg|iso)$/i;
export function matchesPath(path: string, prefix: string): boolean {
  const normalized = prefix.replace(/\/+$/, '') || '/';
  return (
    normalized === '/' ||
    path === normalized ||
    path.startsWith(`${normalized}/`)
  );
}
export function createCrawlPolicy(
  options: ScanOptions,
): (value: string) => boolean {
  const origin = new URL(options.url).origin;
  return (value) => {
    const normalized = normalizeUrl(value);
    if (!normalized) return false;
    const url = new URL(normalized);
    let path: string;
    try {
      path = decodeURIComponent(url.pathname);
    } catch {
      return false;
    }
    if (url.origin !== origin || asset.test(path)) return false;
    if (/(?:^|\/)(?:logout|log-out|signout|sign-out)(?:\/|$)/i.test(path))
      return false;
    if (
      [...url.searchParams].some(
        ([key, val]) =>
          /^(?:logout|signout)$/i.test(key) ||
          /^(?:logout|signout)$/i.test(val),
      )
    )
      return false;
    if (options.exclude.some((prefix) => matchesPath(path, prefix)))
      return false;
    // The seed is allowed outside include prefixes so it can discover matching links.
    return (
      normalized === options.url ||
      options.include.length === 0 ||
      options.include.some((prefix) => matchesPath(path, prefix))
    );
  };
}
