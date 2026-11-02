import request from 'supertest';

const installed = Symbol.for('daodao.tests.supertest-loopback');

export function loopbackServerUrl(url: string, addressFamily: string, listenerAddress: string): string {
  return addressFamily === 'IPv6' && (listenerAddress === '::' || listenerAddress === '::1')
    ? url.replace(/^(https?:\/\/)127\.0\.0\.1:/, '$1[::1]:')
    : url;
}

export function installSupertestLoopback(): void {
  const prototype = request.Test.prototype;
  if (Reflect.get(prototype, installed)) return;
  const serverAddress = prototype.serverAddress;
  prototype.serverAddress = function (app, path): string {
    // Supertest starts wildcard IPv6 listeners but hardcodes an IPv4 client URL.
    // On macOS a different IPv4 listener can own that same numeric port.
    const url = serverAddress.call(this, app, path);
    if (typeof app === 'string' || typeof app === 'function') return url;
    const address = app.address();
    return address && typeof address !== 'string'
      ? loopbackServerUrl(url, address.family, address.address)
      : url;
  };
  Object.defineProperty(prototype, installed, { value: true });
}
