import { createServer } from 'node:http';
import { expect, test } from 'vitest';
import { audit } from '../../src/scanner/scanner.js';
import { defaultOptions } from '../fixtures/options.js';
test('never requests an external redirect destination, including redirect chains', async () => {
  let externalRequests = 0;
  const external = createServer((_request, response) => {
    externalRequests++;
    response.writeHead(200, { 'content-type': 'text/html' });
    response.end(
      '<html lang="en"><title>External</title><body><main><h1>External</h1></main></body></html>',
    );
  });
  await new Promise<void>((resolve) =>
    external.listen(0, '127.0.0.1', resolve),
  );
  const externalAddress = external.address();
  if (!externalAddress || typeof externalAddress === 'string')
    throw new Error('Missing address');
  const internal = createServer((request, response) => {
    response.writeHead(302, {
      location:
        request.url === '/'
          ? '/hop'
          : `http://127.0.0.1:${externalAddress.port}/`,
    });
    response.end();
  });
  await new Promise<void>((resolve) =>
    internal.listen(0, '127.0.0.1', resolve),
  );
  const address = internal.address();
  if (!address || typeof address === 'string')
    throw new Error('Missing address');
  try {
    const result = await audit({
      ...defaultOptions,
      url: `http://127.0.0.1:${address.port}/`,
      maxPages: 1,
    });
    expect(result.scanErrors).toHaveLength(1);
    expect(externalRequests).toBe(0);
  } finally {
    await Promise.all(
      [internal, external].map(
        (server) =>
          new Promise<void>((resolve) => server.close(() => resolve())),
      ),
    );
  }
});
