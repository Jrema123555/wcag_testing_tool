export const reportSchemaVersion = '1.0';
export { audit } from './scanner/scanner.js';
export { exitCode } from './accessibility/qualityGate.js';
export { htmlReport } from './reporting/htmlReporter.js';
export { jsonReport } from './reporting/jsonReporter.js';
export type {
  AuditResult,
  AccessibilityIssue,
  PageResult,
  NodeFinding,
} from './models/auditResult.js';
export type { ScanOptions, Impact } from './models/scanOptions.js';
