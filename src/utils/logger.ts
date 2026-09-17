import { safeMessage } from './errors.js';
export function createLogger(verbose = false) {
  return {
    info: (message: string) => console.log(safeMessage(message)),
    warning: (message: string) =>
      console.warn(`Warning: ${safeMessage(message)}`),
    error: (message: string) => console.error(`Error: ${safeMessage(message)}`),
    debug: (message: string) => {
      if (verbose) console.error(`Debug: ${safeMessage(message)}`);
    },
  };
}
