import type { AxeResults, Result, NodeResult } from 'axe-core';
import type { Impact, ScanOptions } from './scanOptions.js';
export interface WcagCriterion {
  criterion: string;
  principle: 'Perceivable' | 'Operable' | 'Understandable' | 'Robust';
}
export interface NodeFinding {
  pageUrl: string;
  target: NodeResult['target'];
  html: string;
  failureSummary: string | null;
}
export interface AccessibilityIssue {
  ruleId: string;
  title: string;
  description: string;
  helpUrl: string;
  impact: Impact;
  tags: string[];
  wcagCriteria: WcagCriterion[];
  conformanceTags: string[];
  occurrenceCount: number;
  affectedPages: string[];
  nodes: NodeFinding[];
}
export interface PageResult {
  requestedUrl: string;
  url: string;
  title: string;
  durationMs: number;
  scannedAt: string;
  violations: Result[];
  incomplete: Result[];
  passesCount: number;
  inapplicableCount: number;
  axe: Pick<
    AxeResults,
    'testEngine' | 'testRunner' | 'testEnvironment' | 'toolOptions'
  >;
  failedResourceCount: number;
}
export interface ScanError {
  url: string;
  message: string;
}
export interface AuditResult {
  schemaVersion: '1.0';
  metadata: { tool: string; version: string; disclaimer: string };
  targetUrl: string;
  startTime: string;
  endTime: string;
  durationMs: number;
  options: ScanOptions;
  pagesScanned: number;
  pagesAttempted: number;
  scanErrors: ScanError[];
  summary: {
    totalIssues: number;
    totalOccurrences: number;
    affectedPages: number;
    severity: Record<Impact, number>;
    manualReviewRules: number;
    qualityGate: 'passed' | 'failed' | 'incomplete';
  };
  issues: AccessibilityIssue[];
  pages: PageResult[];
}
