import type { AccessibilityIssue, AuditResult } from '../models/auditResult.js';
import type { ScanOptions } from '../models/scanOptions.js';
import { rank } from './resultMapper.js';
export function failsThreshold(
  issues: AccessibilityIssue[],
  threshold: ScanOptions['failOn'],
): boolean {
  return (
    threshold !== 'none' &&
    issues.some((issue) => rank(issue.impact) >= rank(threshold))
  );
}
export function exitCode(result: AuditResult): 0 | 1 | 2 {
  if (result.scanErrors.length || result.pagesScanned === 0) return 2;
  return failsThreshold(result.issues, result.options.failOn) ? 1 : 0;
}
