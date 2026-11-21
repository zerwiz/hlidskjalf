import { expect, test } from 'bun:test';
import { isDesktopSeatRequest } from './desktop-seat';

const req = (path: string, headers: Record<string, string> = {}) =>
  new Request(`http://127.0.0.1:3889${path}`, { headers: { host: '127.0.0.1:3889', ...headers } });

test('the header is honoured over loopback', () => {
  expect(isDesktopSeatRequest(req('/api/x', { 'x-ymir-surface': 'desktop' }), '127.0.0.1')).toBe(true);
});
test('the query marker is refused outside the stream', () => {
  expect(isDesktopSeatRequest(req('/api/x?surface=desktop'), '127.0.0.1')).toBe(false);
});
test('the query marker works on the stream, same origin', () => {
  expect(isDesktopSeatRequest(req('/api/stream?surface=desktop'), '127.0.0.1')).toBe(true);
});
test('the query marker is refused with a foreign Origin', () => {
  const r = req('/api/stream?surface=desktop', { origin: 'https://evil.example' });
  expect(isDesktopSeatRequest(r, '127.0.0.1')).toBe(false);
});
test('a non-loopback peer or Host is refused', () => {
  expect(isDesktopSeatRequest(req('/api/x', { 'x-ymir-surface': 'desktop' }), '10.0.0.5')).toBe(false);
  const r = req('/api/x', { 'x-ymir-surface': 'desktop', host: 'tunnel.example' });
  expect(isDesktopSeatRequest(r, '127.0.0.1')).toBe(false);
});
