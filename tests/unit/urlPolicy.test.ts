import { describe, expect, test } from 'vitest';
import { normalizeUrl } from '../../src/crawler/urlNormalizer.js';
import {
  createCrawlPolicy,
  matchesPath,
} from '../../src/crawler/crawlPolicy.js';
import { defaultOptions } from '../fixtures/options.js';
describe('URL normalization', () => {
  test.each([
    ['HTTPS://EXAMPLE.test:443#top', undefined, 'https://example.test/'],
    [
      '../products#item',
      'https://example.test/shop/',
      'https://example.test/products',
    ],
    [
      '/products/?b=2&a=1&a=3#x',
      'https://example.test/',
      'https://example.test/products/?b=2&a=1&a=3',
    ],
    ['mailto:a@example.test', undefined, null],
    ['tel:123', undefined, null],
    ['javascript:alert(1)', undefined, null],
    ['https://user:secret@example.test', undefined, null],
    ['not a url', undefined, null],
  ])('%s normalizes conservatively', (value, base, expected) =>
    expect(normalizeUrl(value, base)).toBe(expected),
  );
  test('does not collapse slash or query variants', () => {
    expect(normalizeUrl('https://example.test/a')).not.toBe(
      normalizeUrl('https://example.test/a/'),
    );
    expect(normalizeUrl('https://example.test/?page=1')).not.toBe(
      normalizeUrl('https://example.test/?page=2'),
    );
  });
});
describe('crawl policy', () => {
  const allowed = createCrawlPolicy(defaultOptions);
  test.each([
    'https://other.test/',
    'http://example.test/',
    'https://example.test:8443/',
    'https://example.test/logout',
    'https://example.test/%6Cogout',
    'https://example.test/?action=logout',
    'https://example.test/a.PDF',
    'https://example.test/file.zip',
    'javascript:void(0)',
  ])('rejects %s', (url) => expect(allowed(url)).toBe(false));
  test('filters path segments; seed bypasses include, never exclude', () => {
    const policy = createCrawlPolicy({
      ...defaultOptions,
      include: ['/products'],
      exclude: ['/products/admin'],
    });
    expect(policy(defaultOptions.url)).toBe(true);
    expect(policy('https://example.test/products/one')).toBe(true);
    expect(policy('https://example.test/products/admin/a')).toBe(false);
    expect(policy('https://example.test/products-old')).toBe(false);
    expect(
      createCrawlPolicy({ ...defaultOptions, exclude: ['/'] })(
        defaultOptions.url,
      ),
    ).toBe(false);
    expect(matchesPath('/a/b', '/a/')).toBe(true);
  });
});
