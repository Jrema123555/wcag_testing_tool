import { AxeBuilder } from '@axe-core/playwright';
import type { Page } from 'playwright';
import type { ScanOptions } from '../models/scanOptions.js';
export function wcagTags(
  options: Pick<ScanOptions, 'standard' | 'level'>,
): string[] {
  const versions = ['wcag2', 'wcag21', 'wcag22'].slice(
    0,
    ['wcag2', 'wcag21', 'wcag22'].indexOf(options.standard) + 1,
  );
  const levels = ['a', 'aa', 'aaa'].slice(
    0,
    ['A', 'AA', 'AAA'].indexOf(options.level) + 1,
  );
  return versions.flatMap((version) =>
    levels.map((level) => `${version}${level}`),
  );
}
export async function runAxe(page: Page, options: ScanOptions) {
  return new AxeBuilder({ page }).withTags(wcagTags(options)).analyze();
}
