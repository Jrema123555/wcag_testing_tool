import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import type { AuditResult } from '../models/auditResult.js';
import { htmlReport } from './htmlReporter.js';
import { jsonReport } from './jsonReporter.js';
export async function writeReports(result: AuditResult): Promise<string[]> {
  const directory = resolve(result.options.output);
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const paths: string[] = [];
  for (const format of ['json', 'html'] as const) {
    if (result.options.format !== 'all' && result.options.format !== format)
      continue;
    const path = join(directory, `report.${format}`);
    await writeFile(
      path,
      format === 'html' ? htmlReport(result) : jsonReport(result),
      { encoding: 'utf8', mode: 0o600 },
    );
    paths.push(path);
  }
  return paths;
}
