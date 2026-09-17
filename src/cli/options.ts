import { Command, InvalidArgumentError, Option } from 'commander';
import { normalizeUrl } from '../crawler/urlNormalizer.js';
import type { ScanOptions } from '../models/scanOptions.js';
export function positiveInteger(value: string): number {
  if (
    !/^[1-9]\d*$/.test(value) ||
    !Number.isSafeInteger(Number(value)) ||
    Number(value) > 2147483647
  ) {
    throw new InvalidArgumentError(
      'Expected a positive integer no greater than 2147483647.',
    );
  }
  return Number(value);
}
function boolean(value: string): boolean {
  if (value !== 'true' && value !== 'false')
    throw new InvalidArgumentError('Expected true or false.');
  return value === 'true';
}
function pathPrefix(value: string, previous: string[]): string[] {
  if (!value.startsWith('/') || /[?#]/.test(value))
    throw new InvalidArgumentError(
      'Use a path prefix beginning with /, without query or fragment.',
    );
  return [...previous, value];
}
export function createCommand(): Command {
  return new Command('accessibility-audit')
    .description(
      'Audit a website with Playwright and axe. Automated checks do not prove WCAG conformance.',
    )
    .version('0.1.0')
    .argument(
      '<url>',
      'HTTP(S) URL without embedded credentials',
      (value: string) => {
        const url = normalizeUrl(value);
        if (!url)
          throw new InvalidArgumentError(
            'Provide an absolute http:// or https:// URL without embedded credentials.',
          );
        return url;
      },
    )
    .option(
      '--max-pages <number>',
      'Maximum attempted pages',
      positiveInteger,
      20,
    )
    .addOption(
      new Option('--level <level>', 'Target conformance level')
        .choices(['A', 'AA', 'AAA'])
        .default('AA'),
    )
    .addOption(
      new Option('--standard <standard>', 'WCAG version')
        .choices(['wcag2', 'wcag21', 'wcag22'])
        .default('wcag22'),
    )
    .option(
      '--output <directory>',
      'Report directory (existing reports are replaced)',
      './accessibility-reports',
    )
    .addOption(
      new Option('--format <format>', 'Report format')
        .choices(['html', 'json', 'all'])
        .default('all'),
    )
    .addOption(
      new Option('--fail-on <severity>', 'Minimum failing severity')
        .choices(['critical', 'serious', 'moderate', 'minor', 'none'])
        .default('serious'),
    )
    .option(
      '--timeout <milliseconds>',
      'Whole-page scan deadline',
      positiveInteger,
      30000,
    )
    .option(
      '--headless <boolean>',
      'Run without a browser window',
      boolean,
      true,
    )
    .option(
      '--include <path>',
      'Allowed path prefix; repeatable',
      pathPrefix,
      [],
    )
    .option(
      '--exclude <path>',
      'Excluded path prefix; repeatable',
      pathPrefix,
      [],
    )
    .option(
      '--ignore-https-errors',
      'Explicitly allow invalid TLS certificates',
      false,
    )
    .option('--verbose', 'Show diagnostic information', false)
    .showHelpAfterError();
}
export function commandOptions(command: Command): ScanOptions {
  const options = command.opts<Omit<ScanOptions, 'url'>>();
  if (!options.output.trim())
    throw new InvalidArgumentError('Output directory must not be empty.');
  return { ...options, url: command.args[0]! };
}
