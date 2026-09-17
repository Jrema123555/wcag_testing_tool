import { chromium } from 'playwright';
import { crawl } from '../crawler/crawler.js';
import { aggregateIssues } from '../accessibility/resultMapper.js';
import { failsThreshold } from '../accessibility/qualityGate.js';
import type {
  AuditResult,
  PageResult,
  ScanError,
} from '../models/auditResult.js';
import type { ScanOptions } from '../models/scanOptions.js';
export const disclaimer =
  'Automatically detects accessibility issues associated with WCAG criteria and identifies areas that may require manual accessibility review. Automated scanning does not prove full WCAG conformance.';
export function buildAuditResult(
  options: ScanOptions,
  startTime: string,
  pages: PageResult[],
  scanErrors: ScanError[],
  pagesAttempted: number,
): AuditResult {
  const issues = aggregateIssues(pages);
  const endTime = new Date().toISOString();
  const severity = {
    critical: 0,
    serious: 0,
    moderate: 0,
    minor: 0,
    unknown: 0,
  };
  for (const issue of issues) severity[issue.impact]++;
  return {
    schemaVersion: '1.0',
    metadata: { tool: 'accessibility-audit', version: '0.1.0', disclaimer },
    targetUrl: options.url,
    startTime,
    endTime,
    durationMs: Date.parse(endTime) - Date.parse(startTime),
    options,
    pagesScanned: pages.length,
    pagesAttempted,
    scanErrors,
    issues,
    pages,
    summary: {
      totalIssues: issues.length,
      totalOccurrences: issues.reduce(
        (sum, issue) => sum + issue.occurrenceCount,
        0,
      ),
      affectedPages: new Set(issues.flatMap((issue) => issue.affectedPages))
        .size,
      severity,
      manualReviewRules: pages.reduce(
        (sum, page) => sum + page.incomplete.length,
        0,
      ),
      qualityGate:
        scanErrors.length || !pages.length
          ? 'incomplete'
          : failsThreshold(issues, options.failOn)
            ? 'failed'
            : 'passed',
    },
  };
}
export async function audit(
  options: ScanOptions,
  onPage?: (url: string, error?: string) => void,
): Promise<AuditResult> {
  const startTime = new Date().toISOString();
  const browser = await chromium.launch({ headless: options.headless });
  try {
    const context = await browser.newContext({
      ignoreHTTPSErrors: options.ignoreHttpsErrors,
      serviceWorkers: 'block',
      acceptDownloads: false,
      viewport: { width: 1280, height: 720 },
    });
    const { pages, scanErrors, pagesAttempted } = await crawl(
      context,
      options,
      onPage,
    );
    return buildAuditResult(
      options,
      startTime,
      pages,
      scanErrors,
      pagesAttempted,
    );
  } finally {
    await browser.close();
  }
}
