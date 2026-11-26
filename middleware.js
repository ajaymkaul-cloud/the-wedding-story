// Demo access.
// 1. Signed links (?k=...) open /demo/* on any address until the link expires.
// 2. The short link theweddingstorydemo.pixelandink.in/demo opens with no code,
//    but only until DEMO_OPEN_UNTIL (ms since epoch, set in Vercel). After that it shows the closed page.
//    /demo/khatamband and /demo/dejhoor open those looks; /demo opens Marigold.
import { next } from '@vercel/functions';
import { signToken, verifyToken } from './lib/demo-token.js';

export const config = { matcher: ['/demo', '/demo/:path*'] };

const COOKIE = 'ws_demo';
const SHORT_HOST = 'theweddingstorydemo.pixelandink.in';
const MAIN = 'https://theweddingstory.pixelandink.in';

const LOOKS = {
  marigold: { bg: '#FFF6E8', img: 'og-marigold.jpg', alt: 'Strings of marigold flowers on ivory', name: 'Marigold' },
  khatamband: { bg: '#0B2529', img: 'og-khatamband.jpg', alt: 'A carved geometric ceiling rosette in gold on deep teal', name: 'Khatamband' },
  dejhoor: { bg: '#2B1D16', img: 'og-v2.jpg', alt: 'A gold Dejhoor on walnut', name: 'Dejhoor' },
};

function readCookie(request, name) {
  const raw = request.headers.get('cookie') || '';
  for (const part of raw.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}

function cookieHeader(token, expiresAt) {
  const maxAge = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
  return `${COOKIE}=${encodeURIComponent(token)}; Path=/demo; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;
}

function entryPage(look) {
  const L = LOOKS[look];
  const dest = `/demo/aditi-ishaan/?theme=${look}`;
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>The Wedding Story by Pixel &amp; Ink</title>
<meta name="description" content="A personalised digital invitation and guest guide. Every guest sees their own functions and the meaning of every rite.">
<meta property="og:title" content="Your wedding story. From invite to bidai.">
<meta property="og:description" content="A personalised digital invitation and guest guide. Every guest sees their own functions and the meaning of every rite.">
<meta property="og:type" content="website">
<meta property="og:url" content="https://${SHORT_HOST}/demo/">
<meta property="og:site_name" content="The Wedding Story by Pixel &amp; Ink">
<meta property="og:image" content="${MAIN}/${L.img}">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${L.alt}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="${L.bg}">
<script>location.replace(${JSON.stringify(dest)}+(location.hash||"#g-shri-ravi-kaul-ji-and-family"));</script>
</head><body style="margin:0;background:${L.bg}"><noscript><a href="${dest}#g-shri-ravi-kaul-ji-and-family">Open the demo</a></noscript></body></html>`;
}

export default async function middleware(request) {
  const secret = process.env.DEMO_SECRET;
  const url = new URL(request.url);
  const expired = new URL('/demo-expired/', request.url);
  if (!secret) return Response.redirect(expired, 302);

  // Short link: /demo, /demo/khatamband, /demo/dejhoor on the demo address.
  if (url.hostname === SHORT_HOST) {
    const seg = url.pathname.replace(/^\/demo\/?/, '').replace(/\/$/, '');
    const look = seg === '' ? 'marigold' : LOOKS[seg] ? seg : null;
    if (look) {
      const until = Number(process.env.DEMO_OPEN_UNTIL || 0);
      if (!until || until < Date.now()) return Response.redirect(expired, 302);
      const token = await signToken({ e: until, n: 'open-link', i: Date.now() }, secret);
      return new Response(entryPage(look), {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Set-Cookie': cookieHeader(token, until),
          'Cache-Control': 'no-store',
          'X-Robots-Tag': 'noindex',
        },
      });
    }
  }

  const fromLink = url.searchParams.get('k');
  if (fromLink) {
    const payload = await verifyToken(fromLink, secret);
    if (!payload) return Response.redirect(expired, 302);
    return next({
      headers: {
        'Set-Cookie': cookieHeader(fromLink, payload.e),
        'Cache-Control': 'no-store',
        'X-Robots-Tag': 'noindex',
      },
    });
  }

  const fromCookie = readCookie(request, COOKIE);
  if (fromCookie && (await verifyToken(fromCookie, secret))) {
    return next({ headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
  }
  return Response.redirect(expired, 302);
}
