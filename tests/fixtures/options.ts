import type { ScanOptions } from '../../src/models/scanOptions.js';
export const defaultOptions: ScanOptions = {
  url: 'https://example.test/',
  maxPages: 20,
  standard: 'wcag22',
  level: 'AA',
  output: './accessibility-reports',
  format: 'all',
  failOn: 'serious',
  timeout: 30000,
  headless: true,
  include: [],
  exclude: [],
  verbose: false,
  ignoreHttpsErrors: false,
};
