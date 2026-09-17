import { expect, test } from 'vitest';
import { audit } from '../../src/scanner/scanner.js';
import { startSite } from '../fixtures/site.js';
import { defaultOptions } from '../fixtures/options.js';
test('crawls, deduplicates and preserves partial failures', async () => {
  const site = await startSite();
  try {
    const result = await audit({
      ...defaultOptions,
      url: site.url + '/',
      maxPages: 10,
    });
    expect(result.pagesScanned).toBe(2);
    expect(result.pagesAttempted).toBe(3);
    expect(result.scanErrors).toHaveLength(1);
    expect(result.scanErrors[0]!.url).toBe(`${site.url}/missing`);
    expect(result.summary.qualityGate).toBe('incomplete');
    expect(
      result.issues.find((issue) => issue.ruleId === 'image-alt')
        ?.occurrenceCount,
    ).toBe(2);
  } finally {
    await site.close();
  }
});
test('page limit and redirects stay within policy', async () => {
  const site = await startSite();
  try {
    const single = await audit({
      ...defaultOptions,
      url: site.url + '/',
      maxPages: 1,
    });
    expect(single.pagesAttempted).toBe(1);
    const redirect = await audit({
      ...defaultOptions,
      url: site.url + '/redirect',
      maxPages: 1,
    });
    expect(redirect.pages[0]!.url).toBe(site.url + '/second');
    const external = await audit({
      ...defaultOptions,
      url: site.url + '/external',
      maxPages: 1,
    });
    expect(external.pagesScanned).toBe(0);
    expect(external.scanErrors).toHaveLength(1);
  } finally {
    await site.close();
  }
});
