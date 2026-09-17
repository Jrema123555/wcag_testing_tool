import type { AccessibilityIssue, PageResult } from '../models/auditResult.js';
import { impacts, type Impact } from '../models/scanOptions.js';
import { mapWcag } from './wcagMapper.js';
export function normalizeImpact(value: string | null | undefined): Impact {
  return impacts.find((impact) => impact === value) ?? 'unknown';
}
export function rank(value: Impact): number {
  return value === 'unknown' ? -1 : impacts.indexOf(value);
}
export function aggregateIssues(pages: PageResult[]): AccessibilityIssue[] {
  const grouped = new Map<string, AccessibilityIssue>();
  for (const page of pages)
    for (const violation of page.violations) {
      let issue = grouped.get(violation.id);
      const impact = normalizeImpact(violation.impact);
      if (!issue) {
        issue = {
          ruleId: violation.id,
          title: violation.help,
          description: violation.description,
          helpUrl: violation.helpUrl,
          impact,
          tags: [],
          wcagCriteria: [],
          conformanceTags: [],
          occurrenceCount: 0,
          affectedPages: [],
          nodes: [],
        };
        grouped.set(violation.id, issue);
      }
      if (rank(impact) > rank(issue.impact)) issue.impact = impact;
      issue.tags = [...new Set([...issue.tags, ...violation.tags])];
      issue.wcagCriteria = mapWcag(issue.tags);
      issue.conformanceTags = issue.tags.filter((tag) =>
        /^wcag(?:2|21|22)a{1,3}$/.test(tag),
      );
      if (!issue.affectedPages.includes(page.url))
        issue.affectedPages.push(page.url);
      issue.nodes.push(
        ...violation.nodes.map((node) => ({
          pageUrl: page.url,
          target: node.target,
          html: node.html,
          failureSummary: node.failureSummary ?? null,
        })),
      );
      issue.occurrenceCount += violation.nodes.length;
    }
  return [...grouped.values()].sort(
    (a, b) =>
      rank(b.impact) - rank(a.impact) ||
      b.occurrenceCount - a.occurrenceCount ||
      a.ruleId.localeCompare(b.ruleId),
  );
}
