// Demo access: /demo/* opens only with a signed link that hasn't expired.
// A valid link (?k=...) is swapped for a cookie, so reloading and moving around keep working.
import { next } from '@vercel/functions';
import { verifyToken } from './lib/demo-token.js';

export const config = { matcher: ['/demo/:path*'] };

const COOKIE = 'ws_demo';

function readCookie(request, name) {
  const raw = request.headers.get('cookie') || '';
  for (const part of raw.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}

export default async function middleware(request) {
  const secret = process.env.DEMO_SECRET;
  const url = new URL(request.url);
  const expired = new URL('/demo-expired/', request.url);
  if (!secret) return Response.redirect(expired, 302);

  const fromLink = url.searchParams.get('k');
  if (fromLink) {
    const payload = await verifyToken(fromLink, secret);
    if (!payload) return Response.redirect(expired, 302);
    const maxAge = Math.max(0, Math.floor((payload.e - Date.now()) / 1000));
    url.searchParams.delete('k');
    return new Response(null, {
      status: 302,
      headers: {
        Location: url.pathname + (url.search || ''),
        'Set-Cookie': `${COOKIE}=${encodeURIComponent(fromLink)}; Path=/demo; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`,
        'Cache-Control': 'no-store',
      },
    });
  }

  const fromCookie = readCookie(request, COOKIE);
  if (fromCookie && (await verifyToken(fromCookie, secret))) {
    return next({ headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
  }
  return Response.redirect(expired, 302);
}
