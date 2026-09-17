import type { AuditResult } from '../models/auditResult.js';
import { safeMessage } from '../utils/errors.js';
export function consoleReport(
  result: AuditResult,
  paths: string[] = [],
): string {
  const { summary } = result;
  return (
    safeMessage(`Target: ${result.targetUrl}`) +
    '\n' +
    [
      `WCAG ${result.options.standard === 'wcag2' ? '2.0' : result.options.standard === 'wcag21' ? '2.1' : '2.2'} / ${result.options.level}`,
      `Pages scanned: ${result.pagesScanned} (${result.pagesAttempted} attempted)`,
      `\nAccessibility findings (unique rules)`,
      ...Object.entries(summary.severity).map(
        ([severity, count]) => `${severity.padEnd(10)} ${count}`,
      ),
      `Total issues: ${summary.totalIssues} | Occurrences: ${summary.totalOccurrences} | Affected pages: ${summary.affectedPages}`,
      `Manual review: ${summary.manualReviewRules} page/rule results | Scan errors: ${result.scanErrors.length}`,
      '\nTop recurring issues:',
      ...result.issues
        .slice(0, 5)
        .map(
          (issue, index) =>
            `${index + 1}. ${issue.title}\n   Severity: ${issue.impact} | Pages: ${issue.affectedPages.length} | Occurrences: ${issue.occurrenceCount}`,
        ),
      ...(paths.length ? ['\nReports written to:', ...paths] : []),
      `\nQuality gate: ${summary.qualityGate.toUpperCase()} (threshold: ${result.options.failOn})`,
      summary.qualityGate === 'incomplete'
        ? 'One or more pages could not be audited. Review scan errors.'
        : summary.qualityGate === 'failed'
          ? 'Findings meet or exceed the configured severity threshold.'
          : 'No findings meet the configured severity threshold.',
      '\n' + result.metadata.disclaimer,
    ].join('\n')
  );
}
