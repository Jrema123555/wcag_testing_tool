import type { WcagCriterion } from '../models/auditResult.js';
export function mapWcag(tags: string[]): WcagCriterion[] {
  const principles = [
    'Perceivable',
    'Operable',
    'Understandable',
    'Robust',
  ] as const;
  return [...new Set(tags)].flatMap((tag) => {
    const match = /^wcag([1-4])([1-9])(\d{1,2})$/.exec(tag);
    if (!match) return [];
    return [
      {
        criterion: `${match[1]}.${match[2]}.${Number(match[3])}`,
        principle: principles[Number(match[1]) - 1]!,
      },
    ];
  });
}
