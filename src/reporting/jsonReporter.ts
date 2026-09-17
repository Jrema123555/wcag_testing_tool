import type { AuditResult } from '../models/auditResult.js';
export function jsonReport(result: AuditResult): string {
  return JSON.stringify(result, null, 2) + '\n';
}
