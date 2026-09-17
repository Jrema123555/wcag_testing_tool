import type { Page } from 'playwright';
export async function extractLinks(page: Page): Promise<string[]> {
  return page
    .locator('a[href]:not([download])')
    .evaluateAll((anchors) =>
      anchors.map((anchor) => (anchor as HTMLAnchorElement).href),
    );
}
