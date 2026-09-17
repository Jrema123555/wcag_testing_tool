import { expect, test } from 'vitest';
import type { Result } from 'axe-core';
import type { PageResult } from '../../src/models/auditResult.js';
import {
  aggregateIssues,
  normalizeImpact,
} from '../../src/accessibility/resultMapper.js';
import {
  failsThreshold,
  exitCode,
} from '../../src/accessibility/qualityGate.js';
import { mapWcag } from '../../src/accessibility/wcagMapper.js';
import { wcagTags } from '../../src/accessibility/axeRunner.js';
import { buildAuditResult } from '../../src/scanner/scanner.js';
import { defaultOptions } from '../fixtures/options.js';
import { htmlReport } from '../../src/reporting/htmlReporter.js';
import { jsonReport } from '../../src/reporting/jsonReporter.js';
import { consoleReport } from '../../src/reporting/consoleReporter.js';
import { safeMessage } from '../../src/utils/errors.js';
const rule: Result = {
  id: 'image-alt',
  impact: 'critical',
  description: 'Images need text alternatives',
  help: 'Images must have alternative text',
  helpUrl: 'https://example.test/help',
  tags: ['wcag2a', 'wcag111'],
  nodes: [
    {
      any: [],
      all: [],
      none: [],
      impact: 'critical',
      target: ['img'],
      html: '<img src="x" onerror="alert(1)">',
      failureSummary: 'Add appropriate alternative text',
    },
  ],
};
export function page(url = defaultOptions.url): PageResult {
  return {
    requestedUrl: url,
    url,
    title: 'Test',
    durationMs: 1,
    scannedAt: new Date().toISOString(),
    violations: [structuredClone(rule)],
    incomplete: [],
    passesCount: 0,
    inapplicableCount: 0,
    axe: {
      testEngine: { name: 'axe-core', version: '4' },
      testRunner: { name: 'axe' },
      testEnvironment: {
        userAgent: 'test',
        windowWidth: 1280,
        windowHeight: 720,
        orientationAngle: 0,
        orientationType: 'landscape-primary',
      },
      toolOptions: {},
    },
    failedResourceCount: 0,
  };
}
test('aggregates a rule across pages with node details and worst impact', () => {
  const first = page();
  first.violations[0]!.impact = 'minor';
  const issues = aggregateIssues([first, page('https://example.test/second')]);
  expect(issues).toHaveLength(1);
  expect(issues[0]).toMatchObject({
    impact: 'critical',
    occurrenceCount: 2,
    affectedPages: [defaultOptions.url, 'https://example.test/second'],
    wcagCriteria: [{ criterion: '1.1.1', principle: 'Perceivable' }],
  });
  expect(issues[0]!.nodes[1]!.pageUrl).toBe('https://example.test/second');
  expect(normalizeImpact(null)).toBe('unknown');
  expect(normalizeImpact('unexpected')).toBe('unknown');
});
test('maps criterion tags without assigning guessed conformance levels', () => {
  expect(
    mapWcag(['wcag111', 'wcag2411', 'wcag2aa', 'best-practice', 'wcag999']),
  ).toEqual([
    { criterion: '1.1.1', principle: 'Perceivable' },
    { criterion: '2.4.11', principle: 'Operable' },
  ]);
  expect(wcagTags(defaultOptions)).toEqual([
    'wcag2a',
    'wcag2aa',
    'wcag21a',
    'wcag21aa',
    'wcag22a',
    'wcag22aa',
  ]);
  expect(wcagTags({ standard: 'wcag2', level: 'A' })).toEqual(['wcag2a']);
});
test.each(['minor', 'moderate', 'serious', 'critical'] as const)(
  'threshold %s follows severity order',
  (threshold) => {
    const order = ['minor', 'moderate', 'serious', 'critical'];
    for (const impact of [...order, 'unknown']) {
      const issues = aggregateIssues([page()]);
      issues[0]!.impact = normalizeImpact(impact);
      expect(failsThreshold(issues, threshold)).toBe(
        order.indexOf(impact) >= order.indexOf(threshold),
      );
      expect(failsThreshold(issues, 'none')).toBe(false);
    }
  },
);
test('versioned reports preserve evidence, escape HTML and distinguish execution failure', () => {
  const result = buildAuditResult(
    defaultOptions,
    new Date().toISOString(),
    [page()],
    [],
    1,
  );
  expect(exitCode(result)).toBe(1);
  expect(JSON.parse(jsonReport(result))).toMatchObject({
    schemaVersion: '1.0',
    pagesScanned: 1,
    summary: { totalIssues: 1, totalOccurrences: 1, qualityGate: 'failed' },
  });
  const html = htmlReport(result);
  expect(html).toContain('&lt;img');
  expect(html).not.toContain('<img src="x"');
  expect(html).toContain('Content-Security-Policy');
  expect(html).toContain('Remediation guidance');
  result.issues[0]!.helpUrl = 'javascript:alert(1)';
  expect(htmlReport(result)).not.toContain('href="javascript:');
  expect(consoleReport(result)).toContain('Quality gate: FAILED');
  expect(
    exitCode(
      buildAuditResult(
        { ...defaultOptions, failOn: 'none' },
        result.startTime,
        [page()],
        [],
        1,
      ),
    ),
  ).toBe(0);
  expect(
    exitCode(buildAuditResult(defaultOptions, result.startTime, [], [], 0)),
  ).toBe(2);
  expect(
    exitCode(
      buildAuditResult(
        defaultOptions,
        result.startTime,
        [page()],
        [{ url: defaultOptions.url, message: 'Timeout' }],
        2,
      ),
    ),
  ).toBe(2);
});
test('console redacts URL credentials, queries and control characters', () => {
  const message = safeMessage(
    'https://user:password@example.test/?token=secret\u001b',
  );
  expect(message).not.toMatch(/password|secret/);
  expect(message).not.toContain(String.fromCharCode(27));
});
