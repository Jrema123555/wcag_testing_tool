import { test, expect } from 'vitest';
import { chromium } from 'playwright';
import { startSite } from '../fixtures/site.js';
import { defaultOptions } from '../fixtures/options.js';
import { scanPage } from '../../src/scanner/pageScanner.js';
test('scans real local HTML with axe and closes its page', async () => {
  const site = await startSite();
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext();
    const { result, links } = await scanPage(context, site.url, {
      ...defaultOptions,
      url: site.url + '/',
    });
    expect(result.violations.map((rule) => rule.id)).toEqual(
      expect.arrayContaining(['image-alt', 'button-name', 'label']),
    );
    expect(links).toContain(`${site.url}/second`);
    expect(links).not.toContain(`${site.url}/download`);
    expect(context.pages()).toHaveLength(0);
  } finally {
    await browser.close();
    await site.close();
  }
});
test('timeouts and non-HTML responses close pages and produce useful errors', async () => {
  const site = await startSite();
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext();
    const options = { ...defaultOptions, url: site.url + '/' };
    await expect(
      scanPage(context, site.url + '/slow', { ...options, timeout: 100 }),
    ).rejects.toThrow(/exceeded|Timeout/);
    expect(context.pages()).toHaveLength(0);
    await expect(
      scanPage(context, site.url + '/not-html', options),
    ).rejects.toThrow('not an HTML page');
    expect(context.pages()).toHaveLength(0);
  } finally {
    await browser.close();
    await site.close();
  }
});
