const EDITABLE_TEXT_KEYS = new Set([
  'hero-announcement', 'hero-names', 'welcome-label', 'welcome-heading', 'weekend-label', 'weekend-heading', 'weekend-intro',
  'travel-heading', 'travel-copy', 'stay-heading', 'stay-copy', 'engagement-names', 'engagement-date', 'engagement-address',
  'registry-label', 'registry-heading', 'registry-copy', 'things-heading', 'things-intro', 'zoo-title', 'zoo-copy',
  'funk-title', 'funk-copy', 'state-title', 'state-copy', 'bike-title', 'bike-copy', 'beach-title', 'beach-copy',
  'mission-title', 'mission-copy', 'faq-heading', 'rsvp-heading', 'rsvp-copy', 'footer-copy'
]);
const EDITABLE_IMAGE_KEYS = new Set(['hero', 'venue', 'travel', 'zoo', 'funk', 'state', 'bike', 'beach', 'mission', ...Array.from({ length: 31 }, (_, index) => `engagement-${String(index + 1).padStart(2, '0')}`)]);
const CONTENT_KEY = 'site:editable:content:v1';
const IMAGE_INDEX_KEY = 'site:editable:images:v1';
const encoder = new TextEncoder();

function json(data, status = 200, headers = {}) {
  return Response.json(data, { status, headers: { 'cache-control': 'no-store', ...headers } });
}

function base64Url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

function fromBase64Url(value) {
  const base64 = value.replaceAll('-', '+').replaceAll('_', '/') + '='.repeat((4 - value.length % 4) % 4);
  return Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
}

async function hmac(value, secret) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(value)));
}

async function validSession(request, env) {
  if (!env.ADMIN_PIN) return false;
  const cookies = request.headers.get('Cookie') || '';
  const token = cookies.split(';').map((item) => item.trim()).find((item) => item.startsWith('lanja_admin='))?.slice('lanja_admin='.length);
  if (!token) return false;
  const [expires, signature, ...rest] = token.split('.');
  if (rest.length || !/^\d{13}$/.test(expires || '') || Number(expires) < Date.now()) return false;
  try {
    const expected = await hmac(expires, env.ADMIN_PIN);
    const provided = fromBase64Url(signature || '');
    return provided.length === expected.length && crypto.subtle.timingSafeEqual(provided, expected);
  } catch { return false; }
}

async function checkLoginLimit(request, env) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const ipHash = new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(ip)));
  const key = `admin:login:${base64Url(ipHash)}`;
  const attempts = Number(await env.EVENTS.get(key) || 0);
  return { key, attempts };
}

async function adminLogin(request, env) {
  if (!env.ADMIN_PIN) return json({ error: 'Admin PIN is not configured.' }, 503);
  if (!checkSameOrigin(request, new URL(request.url))) return json({ error: 'Request origin rejected.' }, 403);
  const { key, attempts } = await checkLoginLimit(request, env);
  if (attempts >= 5) return json({ error: 'Too many attempts. Try again in 15 minutes.' }, 429);
  const body = await request.json().catch(() => ({}));
  const supplied = typeof body.pin === 'string' ? body.pin.slice(0, 64) : '';
  const expectedHash = new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(env.ADMIN_PIN)));
  const suppliedHash = new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(supplied)));
  const matches = crypto.subtle.timingSafeEqual(suppliedHash, expectedHash);
  if (!matches) {
    await env.EVENTS.put(key, String(attempts + 1), { expirationTtl: 900 });
    return json({ error: 'That PIN did not match.' }, 401);
  }
  await env.EVENTS.delete(key);
  const expires = String(Date.now() + 8 * 60 * 60 * 1000);
  const signature = base64Url(await hmac(expires, env.ADMIN_PIN));
  return json({ ok: true }, 200, { 'set-cookie': `lanja_admin=${expires}.${signature}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800` });
}

async function readContent(env) {
  const [text, images] = await Promise.all([
    env.EVENTS.get(CONTENT_KEY, 'json'),
    env.EVENTS.get(IMAGE_INDEX_KEY, 'json')
  ]);
  return { text: text || {}, images: images || {} };
}

function checkSameOrigin(request, url) {
  const origin = request.headers.get('Origin');
  if (!origin) return true;
  try { return new URL(origin).origin === url.origin; }
  catch { return false; }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/admin/login' && request.method === 'POST') return adminLogin(request, env);
    if (url.pathname === '/api/admin/session' && request.method === 'GET') return json({ authenticated: await validSession(request, env) });
    if (url.pathname === '/api/site-content' && request.method === 'GET') return json(await readContent(env));
    if (url.pathname === '/api/lanja-edit-status' && request.method === 'GET') {
      const state = await env.EVENTS.get('lanja-edit-mode', 'json');
      const now = Date.now();
      const startsAt = state?.startsAt ? Date.parse(state.startsAt) : NaN;
      const endsAt = state?.endsAt ? Date.parse(state.endsAt) : NaN;
      const hasWindow = Number.isFinite(startsAt) && Number.isFinite(endsAt) && endsAt > startsAt;
      const active = hasWindow ? now >= startsAt && now < endsAt : Boolean(state?.active);
      return json({ active, scheduled: hasWindow && now < startsAt, startsAt: hasWindow ? state.startsAt : null, endsAt: hasWindow ? state.endsAt : null, activatedAt: state?.activatedAt || null });
    }
    if (url.pathname.startsWith('/api/site-image/') && request.method === 'GET') {
      const key = decodeURIComponent(url.pathname.slice('/api/site-image/'.length));
      if (!EDITABLE_IMAGE_KEYS.has(key)) return new Response('Not found', { status: 404 });
      const [image, imageIndex] = await Promise.all([
        env.EVENTS.get(`site:editable:image:${key}`, { type: 'arrayBuffer' }),
        env.EVENTS.get(IMAGE_INDEX_KEY, 'json')
      ]);
      const contentType = imageIndex?.[key]?.contentType;
      if (!image || !contentType) return new Response('Not found', { status: 404 });
      return new Response(image, { headers: { 'content-type': contentType, 'cache-control': 'public, max-age=300' } });
    }
    if (url.pathname.startsWith('/api/admin/') && url.pathname !== '/api/admin/login') {
      if (!checkSameOrigin(request, url)) return json({ error: 'Request origin rejected.' }, 403);
      if (!(await validSession(request, env))) return json({ error: 'Admin session expired. Sign in again.' }, 401);
      if (url.pathname === '/api/admin/logout' && request.method === 'POST') {
        return json({ ok: true }, 200, { 'set-cookie': 'lanja_admin=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0' });
      }
      if (url.pathname === '/api/admin/text' && request.method === 'PUT') {
        const body = await request.json().catch(() => null);
        if (!body || typeof body !== 'object' || Array.isArray(body)) return json({ error: 'Invalid text payload.' }, 400);
        const current = await env.EVENTS.get(CONTENT_KEY, 'json') || {};
        for (const [key, value] of Object.entries(body)) {
          if (!EDITABLE_TEXT_KEYS.has(key) || typeof value !== 'string' || value.length > 5000) return json({ error: `Invalid text field: ${key}` }, 400);
          current[key] = value;
        }
        await env.EVENTS.put(CONTENT_KEY, JSON.stringify(current), { expirationTtl: 31536000 });
        return json({ ok: true });
      }
      const imageMatch = url.pathname.match(/^\/api\/admin\/image\/([a-z0-9-]+)$/);
      if (imageMatch && ['PUT', 'DELETE'].includes(request.method)) {
        const key = imageMatch[1];
        if (!EDITABLE_IMAGE_KEYS.has(key)) return json({ error: 'Image slot not found.' }, 404);
        const imageIndex = await env.EVENTS.get(IMAGE_INDEX_KEY, 'json') || {};
        if (request.method === 'DELETE') {
          await env.EVENTS.delete(`site:editable:image:${key}`);
          delete imageIndex[key];
        } else {
          const contentType = request.headers.get('Content-Type')?.split(';')[0].trim();
          const length = Number(request.headers.get('Content-Length') || 0);
          if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(contentType) || length > 5 * 1024 * 1024) return json({ error: 'Choose a JPG, PNG, WebP, or AVIF image smaller than 5 MB.' }, 400);
          const image = await request.arrayBuffer();
          if (!image.byteLength || image.byteLength > 5 * 1024 * 1024) return json({ error: 'Image must be smaller than 5 MB.' }, 413);
          await env.EVENTS.put(`site:editable:image:${key}`, image, { expirationTtl: 31536000 });
          imageIndex[key] = { contentType, updatedAt: new Date().toISOString() };
        }
        await env.EVENTS.put(IMAGE_INDEX_KEY, JSON.stringify(imageIndex), { expirationTtl: 31536000 });
        return json({ ok: true, url: request.method === 'PUT' ? `/api/site-image/${key}?v=${Date.now()}` : null });
      }
      if (url.pathname === '/api/admin/mode' && request.method === 'POST') {
        const body = await request.json().catch(() => null);
        if (typeof body?.active !== 'boolean') return json({ error: 'A mode state is required.' }, 400);
        let state;
        if (body.active && body.startsAt && body.endsAt) {
          const startsAt = new Date(body.startsAt);
          const endsAt = new Date(body.endsAt);
          if (!Number.isFinite(startsAt.getTime()) || !Number.isFinite(endsAt.getTime()) || endsAt <= startsAt) return json({ error: 'The activation window is invalid.' }, 400);
          state = { active: false, startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString(), activatedAt: null };
        } else {
          state = { active: body.active, startsAt: null, endsAt: null, activatedAt: body.active ? new Date().toISOString() : null };
        }
        await env.EVENTS.put('lanja-edit-mode', JSON.stringify(state));
        const now = Date.now();
        const active = state.startsAt ? now >= Date.parse(state.startsAt) && now < Date.parse(state.endsAt) : state.active;
        return json({ ok: true, ...state, active, scheduled: Boolean(state.startsAt && now < Date.parse(state.startsAt)) });
      }
    }
    if (request.method === 'POST' && (url.pathname === '/api/rsvp' || url.pathname === '/api/registry-click')) {
      const payload = await request.json().catch(() => ({}));
      const type = url.pathname === '/api/rsvp' ? 'rsvp' : 'registry_click';
      const record = { type, payload, recordedAt: new Date().toISOString() };
      await env.EVENTS.put(`${type}:${Date.now()}:${crypto.randomUUID()}`, JSON.stringify(record), { expirationTtl: 31536000 });
      if (type === 'rsvp' && env.EMAIL) {
        await env.EMAIL.send({ from: { email: 'hello@lanjaandkyle.com', name: 'Lanja & Kyle' }, to: { email: 'hello@lanjaandkyle.com', name: 'Lanja & Kyle' }, subject: 'New wedding RSVP', text: JSON.stringify(payload, null, 2), html: `<pre>${JSON.stringify(payload, null, 2)}</pre>` });
      }
      return Response.json({ ok: true });
    }
    if (url.pathname === '/health') return new Response(JSON.stringify({ ok: true, site: 'lanjaandkyle' }), { headers: { 'content-type': 'application/json' } });
    return env.ASSETS.fetch(request);
  }
};
