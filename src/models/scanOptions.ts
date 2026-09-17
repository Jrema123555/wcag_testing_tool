export const impacts = ['minor', 'moderate', 'serious', 'critical'] as const;
export type Impact = (typeof impacts)[number] | 'unknown';
export interface ScanOptions {
  url: string;
  maxPages: number;
  level: 'A' | 'AA' | 'AAA';
  standard: 'wcag2' | 'wcag21' | 'wcag22';
  output: string;
  format: 'html' | 'json' | 'all';
  failOn: Exclude<Impact, 'unknown'> | 'none';
  timeout: number;
  headless: boolean;
  include: string[];
  exclude: string[];
  verbose: boolean;
  ignoreHttpsErrors: boolean;
}
