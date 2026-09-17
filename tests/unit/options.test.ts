import { expect, test } from 'vitest';
import { createCommand, commandOptions } from '../../src/cli/options.js';
function parse(args: string[]) {
  const command = createCommand()
    .exitOverride()
    .configureOutput({ writeErr: () => undefined });
  command.parse(args, { from: 'user' });
  return commandOptions(command);
}
test('CLI defaults and repeatable filters', () => {
  expect(parse(['https://example.test'])).toMatchObject({
    maxPages: 20,
    standard: 'wcag22',
    level: 'AA',
    failOn: 'serious',
    headless: true,
    format: 'all',
  });
  expect(
    parse([
      'https://example.test',
      '--include',
      '/a',
      '--include',
      '/b',
      '--headless',
      'false',
    ]),
  ).toMatchObject({ include: ['/a', '/b'], headless: false });
});
test.each(
  [
    [],
    ['ftp://example.test'],
    ['https://user:secret@example.test'],
    ['https://example.test', '--max-pages', '0'],
    ['https://example.test', '--timeout', '1e3'],
    ['https://example.test', '--level', 'B'],
    ['https://example.test', '--headless', 'yes'],
    ['https://example.test', '--exclude', 'admin'],
    ['https://example.test', '--typo'],
  ].map((args) => ({ args })),
)('rejects invalid arguments $args', ({ args }) =>
  expect(() => parse(args)).toThrow(),
);
