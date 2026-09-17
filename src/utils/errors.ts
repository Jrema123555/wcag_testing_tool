export function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'An unexpected error occurred';
}
// Browser errors may contain request URLs. Console output omits query values.
export function safeMessage(message: string): string {
  return (
    message
      .replace(/https?:\/\/[^\s"'<>]+/g, (value) => {
        try {
          const url = new URL(value);
          url.username = '';
          url.password = '';
          if (url.search) url.search = '?[redacted]';
          url.hash = '';
          return url.href;
        } catch {
          return '[URL]';
        }
      })
      // eslint-disable-next-line no-control-regex -- Remove terminal control characters from untrusted output.
      .replace(/[\u0000-\u001f\u007f-\u009f]/g, ' ')
  );
}
