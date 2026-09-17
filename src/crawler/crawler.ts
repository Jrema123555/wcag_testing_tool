import type { BrowserContext } from 'playwright';
import type { ScanOptions } from '../models/scanOptions.js';
import type { PageResult, ScanError } from '../models/auditResult.js';
import { scanPage } from '../scanner/pageScanner.js';
import { normalizeUrl } from './urlNormalizer.js';
import { createCrawlPolicy } from './crawlPolicy.js';
import { errorMessage, safeMessage } from '../utils/errors.js';
export async function crawl(
  context: BrowserContext,
  options: ScanOptions,
  onPage?: (url: string, error?: string) => void,
) {
  const allowed = createCrawlPolicy(options);
  if (!allowed(options.url))
    throw new Error('The start URL is excluded by the crawl policy.');
  const queue = [options.url];
  const scheduled = new Set(queue);
  const visited = new Set<string>();
  const pages: PageResult[] = [];
  const scanErrors: ScanError[] = [];
  let pagesAttempted = 0;
  while (queue.length && pagesAttempted < options.maxPages) {
    const url = queue.shift()!;
    if (visited.has(url)) continue;
    visited.add(url);
    pagesAttempted++;
    try {
      const { result, links } = await scanPage(context, url, options);
      const finalUrl = normalizeUrl(result.url);
      if (!finalUrl || !allowed(finalUrl))
        throw new Error('Page navigated outside the crawl policy.');
      visited.add(finalUrl);
      if (!pages.some((page) => page.url === finalUrl)) pages.push(result);
      onPage?.(finalUrl);
      for (const link of links) {
        const normalized = normalizeUrl(link, finalUrl);
        if (
          normalized &&
          !scheduled.has(normalized) &&
          !visited.has(normalized) &&
          allowed(normalized)
        ) {
          if (queue.length >= options.maxPages - pagesAttempted) break;
          scheduled.add(normalized);
          queue.push(normalized);
        }
      }
    } catch (error) {
      const message = safeMessage(errorMessage(error));
      scanErrors.push({ url, message });
      onPage?.(url, message);
    }
  }
  return { pages, scanErrors, pagesAttempted };
}
