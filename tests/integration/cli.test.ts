import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { expect, test } from 'vitest';
import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';
import { startSite } from '../fixtures/site.js';
function cli(args: string[]) {
  return new Promise<{ code: number | null; output: string }>(
    (resolvePromise, reject) => {
      const child = spawn(
        process.execPath,
        [resolve('dist/cli/index.js'), ...args],
        { windowsHide: true },
      );
      let output = '';
      child.stdout.on('data', (chunk: Buffer) => {
        output += chunk.toString();
      });
      child.stderr.on('data', (chunk: Buffer) => {
        output += chunk.toString();
      });
      child.on('error', reject);
      child.on('close', (code) => resolvePromise({ code, output }));
    },
  );
}
test('CLI exit codes and locally usable, accessible HTML report', async () => {
  const site = await startSite();
  const directory = await mkdtemp(join(tmpdir(), 'accessibility-audit-test-'));
  try {
    const failed = await cli([
      site.url,
      '--max-pages',
      '1',
      '--output',
      directory,
    ]);
    expect(failed.code, failed.output).toBe(1);
    const json: unknown = JSON.parse(
      await readFile(join(directory, 'report.json'), 'utf8'),
    );
    expect(json).toMatchObject({ schemaVersion: '1.0', pagesScanned: 1 });
    const browser = await chromium.launch();
    try {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.setContent(
        await readFile(join(directory, 'report.html'), 'utf8'),
      );
      expect(
        await page
          .getByRole('heading', {
            name: 'Accessibility Audit Report',
            exact: true,
          })
          .count(),
      ).toBe(1);
      await page
        .locator('details')
        .evaluateAll((elements) =>
          elements.forEach((element) => element.setAttribute('open', '')),
        );
      expect(await page.locator('pre').count()).toBeGreaterThan(0);
      const result = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(result.violations.map((rule) => rule.id)).toEqual([]);
    } finally {
      await browser.close();
    }
    expect(
      (
        await cli([
          site.url + '/clean',
          '--max-pages',
          '1',
          '--output',
          directory,
        ])
      ).code,
    ).toBe(0);
    expect(
      (
        await cli([
          site.url,
          '--max-pages',
          '1',
          '--fail-on',
          'none',
          '--output',
          directory,
        ])
      ).code,
    ).toBe(0);
    expect(
      (await cli([site.url + '/missing', '--output', directory])).code,
    ).toBe(2);
    expect((await cli(['not-a-url'])).code).toBe(2);
    expect((await cli(['--help'])).code).toBe(0);
    expect(
      (
        await cli([
          site.url,
          '--max-pages',
          '1',
          '--output',
          join(directory, 'report.json'),
        ])
      ).code,
    ).toBe(2);
  } finally {
    await site.close();
    // mkdtemp creates an isolated directory owned by this test.
    if (
      resolve(directory).startsWith(resolve(tmpdir()) + '\\') ||
      resolve(directory).startsWith(resolve(tmpdir()) + '/')
    )
      await rm(directory, { recursive: true, force: true });
  }
});
