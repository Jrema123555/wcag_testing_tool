export function normalizeUrl(value: string, base?: string): string | null {
  try {
    const url = new URL(value, base);
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      url.username ||
      url.password
    )
      return null;
    url.hash = '';
    // Preserve path slashes and query order: servers can assign them different meanings.
    return url.href;
  } catch {
    return null;
  }
}
