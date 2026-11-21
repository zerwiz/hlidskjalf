/**
 * The desktop seat (Electron) is local and trusted, so it is never asked to log in.
 * Its preload marks every request with the `x-ymir-surface: desktop` header. A web
 * page cannot set that header cross-origin without a preflight the server refuses,
 * so the header is the only marker honoured everywhere.
 *
 * EventSource cannot set headers, so the live stream alone also accepts the
 * `?surface=desktop` query marker, and only when the request has no foreign Origin.
 *
 * Both markers count only when the peer is loopback AND the Host header names
 * loopback, which keeps out a local reverse proxy, a tunnel and DNS rebinding.
 */
const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '[::1]', '::1']);

function hostName(hostHeader: string): string {
  if (hostHeader.startsWith('[')) return hostHeader.slice(0, hostHeader.indexOf(']') + 1);
  return hostHeader.split(':')[0] ?? '';
}

export function isLoopbackPeer(ip: string): boolean {
  const bare = ip.startsWith('::ffff:') ? ip.slice('::ffff:'.length) : ip;
  return bare === '127.0.0.1' || bare === '::1';
}

export function isDesktopSeatRequest(req: Request, peerIp: string): boolean {
  const url = new URL(req.url);
  const hasHeader = (req.headers.get('x-ymir-surface') ?? '') === 'desktop';
  const origin = req.headers.get('origin');
  const ownOrigin = origin === null || new URL(origin).host === (req.headers.get('host') ?? '');
  const hasQuery =
    url.pathname === '/api/stream' && url.searchParams.get('surface') === 'desktop' && ownOrigin;
  if (!hasHeader && !hasQuery) return false;
  if (!isLoopbackPeer(peerIp)) return false;
  return LOOPBACK_HOSTS.has(hostName(req.headers.get('host') ?? url.host));
}
