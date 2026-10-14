export default {
  async fetch(request, env) {
    const url = new URL(request.url);
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

