// POST /api/v1/subscribe — email capture for lead magnets / newsletter.
// Body: { email, source?, website? }  (website = honeypot, must be empty)
// Idempotent: re-subscribing the same email returns ok:true.
// Never leaks whether an address was already subscribed.

export async function onRequestPost({ request, env }) {
  const { json, requireDB, validEmail } = await import('../_lib.js');

  let body = null;
  try {
    body = await request.json();
  } catch (e) {
    return json({ error: 'Invalid request.' }, 400);
  }

  // Honeypot: bots fill it, humans don't. Pretend success either way.
  if (body.website) return json({ ok: true });

  const email = String(body.email || '').trim().toLowerCase();
  const source = String(body.source || 'unknown').slice(0, 60);
  if (!validEmail(email)) {
    return json({ error: 'Please enter a valid email address.' }, 400);
  }

  const db = requireDB(env);
  if (!db) return json({ error: 'Service temporarily unavailable.' }, 503);

  try {
    await db
      .prepare('INSERT INTO email_subscribers (id, email, source) VALUES (?, ?, ?)')
      .bind(crypto.randomUUID(), email, source)
      .run();
  } catch (e) {
    // Likely a duplicate email — verify it exists, then treat as success.
    const existing = await db
      .prepare('SELECT id FROM email_subscribers WHERE email = ?')
      .bind(email)
      .first();
    if (!existing) return json({ error: 'Could not save. Please try again.' }, 500);
  }

  return json({ ok: true });
}
