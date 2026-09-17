import { createServer } from 'node:http';
export const brokenHtml = `<!doctype html><html lang="en"><head><title>Fixture</title></head><body><main><h1>Fixture shop</h1><h4>Skipped heading</h4><img src="/pixel.svg"><button></button><input type="text"><a href="/second">Second</a><a href="/second#details">Duplicate</a><a href="/missing">Missing</a><a href="/logout">Logout</a><a href="/file.pdf">PDF</a><a href="/download" download>Download</a></main></body></html>`;
export async function startSite() {
  const server = createServer((req, res) => {
    if (req.url === '/slow') {
      res.writeHead(200, { 'content-type': 'text/html' });
      res.write('<!doctype html><html><head><title>Still loading</title>');
      return;
    }
    if (req.url === '/not-html') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end('{}');
      return;
    }
    if (req.url === '/redirect') {
      res.writeHead(302, { location: '/second' });
      res.end();
      return;
    }
    if (req.url === '/external') {
      res.writeHead(302, { location: 'https://example.org/' });
      res.end();
      return;
    }
    if (req.url === '/missing') {
      res.writeHead(404);
      res.end();
      return;
    }
    if (req.url === '/pixel.svg') {
      res.writeHead(200, { 'content-type': 'image/svg+xml' });
      res.end('<svg xmlns="http://www.w3.org/2000/svg"/>');
      return;
    }
    res.writeHead(200, { 'content-type': 'text/html' });
    res.end(
      req.url === '/clean'
        ? '<!doctype html><html lang="en"><head><title>Clean</title></head><body><main><h1>Welcome</h1><p>Hello world.</p></main></body></html>'
        : brokenHtml,
    );
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string')
    throw new Error('Fixture server failed to bind');
  return {
    url: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      ),
  };
}
