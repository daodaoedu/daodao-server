import { createServer, Server, type RequestListener } from 'node:http';
import request from 'supertest';
import { installSupertestLoopback, loopbackServerUrl } from '../../utils/supertest-loopback';

const close = (server: Server): Promise<void> => new Promise(resolve => server.close(() => resolve()));

async function expectRequestToOwnedIpv6Server(): Promise<void> {
  const ipv4 = createServer((_req, res) => {
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ server: 'owned-ipv4' }));
  });
  const ipv6 = createServer((req, res) => {
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ server: 'owned-ipv6', path: req.url }));
  });
  try {
    await new Promise<void>(resolve => ipv4.listen(0, '127.0.0.1', resolve));
    const address = ipv4.address();
    if (!address || typeof address === 'string') throw new Error('Expected a TCP listener');
    await new Promise<void>((resolve, reject) => {
      ipv6.once('error', reject);
      ipv6.listen({ port: address.port, host: '::', ipv6Only: true }, resolve);
    });
    const response = await request(ipv6).get('/owned-transport-check?source=test');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ server: 'owned-ipv6', path: '/owned-transport-check?source=test' });
  } finally {
    await Promise.all([close(ipv4), close(ipv6)]);
  }
}

test('reaches its own IPv6 server when another owned IPv4 server has the same port', expectRequestToOwnedIpv6Server);

test('keeps explicitly bound IPv4 servers reachable', async () => {
  const server = createServer((_req, res) => res.end('owned-ipv4'));
  try {
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    const response = await request(server).get('/owned-transport-check');
    expect(response.status).toBe(200);
    expect(response.text).toBe('owned-ipv4');
    expect(server.listening).toBe(true);
  } finally {
    await close(server);
  }
});

test('preserves Supertest cleanup for automatically created servers', async () => {
  const app: RequestListener = (_req, res) => res.end('owned-callback');
  const testRequest = request(app).get('/owned-transport-check');
  const response = await testRequest;
  expect(response.text).toBe('owned-callback');
  expect(testRequest.app).toBeInstanceOf(Server);
  if (!(testRequest.app instanceof Server)) throw new Error('Expected Supertest HTTP server');
  expect(testRequest.app.listening).toBe(false);
});

test.each([
  ['http://127.0.0.1:1234/a?b=c', 'IPv6', '::', 'http://[::1]:1234/a?b=c'],
  ['https://127.0.0.1:1234/a', 'IPv6', '::1', 'https://[::1]:1234/a'],
  ['http://127.0.0.1:1234/a', 'IPv4', '127.0.0.1', 'http://127.0.0.1:1234/a'],
  ['http://example.com:1234/a', 'IPv6', '::', 'http://example.com:1234/a'],
  ['http://127.0.0.1:1234/a', 'IPv6', '2001:db8::1', 'http://127.0.0.1:1234/a'],
])('matches only the local server address family for %s', (url, family, listenerAddress, expected) => {
  expect(loopbackServerUrl(url, family, listenerAddress)).toBe(expected);
});

test('still reaches the owned server after repeated installation and mock restoration', async () => {
  installSupertestLoopback();
  jest.restoreAllMocks();
  installSupertestLoopback();
  await expectRequestToOwnedIpv6Server();
});
