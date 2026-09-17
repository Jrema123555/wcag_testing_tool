#!/usr/bin/env node
import { CommanderError } from 'commander';
import { createCommand, commandOptions } from './options.js';
import { audit } from '../scanner/scanner.js';
import { writeReports } from '../reporting/writeReports.js';
import { consoleReport } from '../reporting/consoleReporter.js';
import { exitCode } from '../accessibility/qualityGate.js';
import { createLogger } from '../utils/logger.js';
import { errorMessage, safeMessage } from '../utils/errors.js';
const command = createCommand()
  .exitOverride()
  .configureOutput({
    writeErr: (message) => process.stderr.write(safeMessage(message) + '\n'),
  });
let logger = createLogger();
try {
  command.parse();
  const options = commandOptions(command);
  logger = createLogger(options.verbose);
  logger.info('Accessibility Audit');
  logger.info(`Target: ${options.url}`);
  logger.info('Scanning...');
  const result = await audit(options, (url, error) =>
    error ? logger.warning(`${url}: ${error}`) : logger.info(`Scanned ${url}`),
  );
  const paths = await writeReports(result);
  console.log(consoleReport(result, paths));
  process.exitCode = exitCode(result);
  logger.info(`Exit code: ${process.exitCode}`);
} catch (error) {
  if (error instanceof CommanderError) {
    process.exitCode = error.exitCode === 0 ? 0 : 2;
  } else {
    const message = errorMessage(error);
    logger.error(
      /executable doesn't exist|browser.*not found/i.test(message)
        ? 'Playwright Chromium is missing. Run: npx playwright install chromium'
        : message,
    );
    if (error instanceof Error && error.stack) logger.debug(error.stack);
    process.exitCode = 2;
  }
}
