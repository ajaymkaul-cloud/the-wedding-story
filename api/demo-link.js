// Makes a private demo link. Only works with the admin passcode.
import { signToken } from '../lib/demo-token.js';

const DAY = 24 * 60 * 60 * 1000;
const ALLOWED_DAYS = [1, 3, 7];

function same(a, b) {
  // constant-time comparison so the passcode can't be guessed by timing
  const x = new TextEncoder().encode(String(a));
  const y = new TextEncoder().encode(String(b));
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] || 0) ^ (y[i] || 0);
  return diff === 0;
}

export async function POST(request) {
  const secret = process.env.DEMO_SECRET;
  const admin = process.env.DEMO_ADMIN_KEY;
  if (!secret || !admin) return Response.json({ error: 'Demo links are not set up yet.' }, { status: 500 });

  let body;
  try { body = await request.json(); } catch { body = {}; }
  if (!same(body.key || '', admin)) {
    await new Promise((r) => setTimeout(r, 600));
    return Response.json({ error: 'That passcode is not right.' }, { status: 401 });
  }
  const days = ALLOWED_DAYS.includes(Number(body.days)) ? Number(body.days) : 3;
  const note = String(body.note || '').slice(0, 60);
  const now = Date.now();
  const expires = now + days * DAY;
  const token = await signToken({ e: expires, n: note, i: now }, secret);
  const origin = new URL(request.url).origin;
  return Response.json({
    link: `${origin}/demo/aditi-ishaan/?k=${token}`,
    expires,
  }, { headers: { 'Cache-Control': 'no-store' } });
}
