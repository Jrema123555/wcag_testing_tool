import type { BrowserContext } from 'playwright';
import { runAxe } from '../accessibility/axeRunner.js';
import type { PageResult } from '../models/auditResult.js';
import type { ScanOptions } from '../models/scanOptions.js';
import { extractLinks } from '../crawler/linkExtractor.js';
import { createCrawlPolicy } from '../crawler/crawlPolicy.js';
import { guardNavigation } from '../crawler/navigationGuard.js';
export async function scanPage(
  context: BrowserContext,
  url: string,
  options: ScanOptions,
): Promise<{ result: PageResult; links: string[] }> {
  const started = Date.now();
  const page = await context.newPage();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let failedResourceCount = 0;
  page.on('requestfailed', () => {
    failedResourceCount++;
  });
  const operation = async () => {
    await guardNavigation(page, createCrawlPolicy(options));
    const response = await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: options.timeout,
    });
    if (!response || response.status() >= 400)
      throw new Error(
        `Navigation failed (HTTP ${response?.status() ?? 'unknown'}).`,
      );
    const contentType = response.headers()['content-type'] ?? '';
    if (!/\b(text\/html|application\/xhtml\+xml)\b/i.test(contentType))
      throw new Error('The response is not an HTML page.');
    await page
      .locator('body')
      .waitFor({ state: 'attached', timeout: options.timeout });
    const axe = await runAxe(page, options);
    const links = await extractLinks(page);
    const result: PageResult = {
      requestedUrl: url,
      url: page.url(),
      title: await page.title(),
      durationMs: Date.now() - started,
      scannedAt: axe.timestamp,
      violations: axe.violations,
      incomplete: axe.incomplete,
      passesCount: axe.passes.length,
      inapplicableCount: axe.inapplicable.length,
      axe: {
        testEngine: axe.testEngine,
        testRunner: axe.testRunner,
        testEnvironment: axe.testEnvironment,
        toolOptions: axe.toolOptions,
      },
      failedResourceCount,
    };
    return { result, links };
  };
  try {
    return await Promise.race([
      operation(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`Page scan exceeded ${options.timeout}ms.`)),
          options.timeout,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
    await page.close().catch(() => undefined);
  }
}
