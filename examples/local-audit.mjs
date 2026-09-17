import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const server = createServer((_request, response) => {
  response.writeHead(200, { 'content-type': 'text/html' });
  response.end(
    '<!doctype html><html lang="en"><head><title>Local audit fixture</title></head><body><main><h1>Example shop</h1><button></button><input type="text"><a href="/products">Products</a></main></body></html>',
  );
});
server.listen(0, '127.0.0.1', () => {
  const address = server.address();
  const child = spawn(
    process.execPath,
    [
      fileURLToPath(new URL('../dist/cli/index.js', import.meta.url)),
      `http://127.0.0.1:${address.port}`,
      '--max-pages',
      '2',
    ],
    { stdio: 'inherit', windowsHide: true },
  );
  child.on('error', (error) => {
    console.error(error.message);
    server.close();
    process.exitCode = 2;
  });
  child.on('close', (code) => {
    server.close();
    process.exitCode = code ?? 2;
  });
});
