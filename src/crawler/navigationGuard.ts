import type { Page } from 'playwright';

// Playwright route handlers only see the first request in an HTTP redirect chain.
// Chromium Fetch interception checks every hop before the request reaches the wire.
export async function guardNavigation(
  page: Page,
  allowed: (url: string) => boolean,
): Promise<void> {
  const session = await page.context().newCDPSession(page);
  const { frameTree } = (await session.send('Page.getFrameTree')) as {
    frameTree: { frame: { id: string } };
  };
  session.on(
    'Fetch.requestPaused',
    (event: {
      requestId: string;
      frameId: string;
      request: { url: string };
    }) => {
      const blocked =
        event.frameId === frameTree.frame.id && !allowed(event.request.url);
      const action = blocked
        ? session.send('Fetch.failRequest', {
            requestId: event.requestId,
            errorReason: 'BlockedByClient',
          })
        : session.send('Fetch.continueRequest', { requestId: event.requestId });
      // A page deadline can close the target while a paused request is being handled.
      void action.catch(() => page.close().catch(() => undefined));
    },
  );
  await session.send('Fetch.enable', {
    patterns: [{ resourceType: 'Document', requestStage: 'Request' }],
  });
}
