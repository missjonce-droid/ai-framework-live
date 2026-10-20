// POST /api/v1/auth/magic-link  { email }
// Creates a one-time login link and emails it via Resend.
// Always returns { ok: true } for a well-formed email (no account enumeration).
export async function onRequestPost({ request, env }) {
  const { json, requireDB, validEmail, sha256Hex } = await import('../../_lib.js');
  const db = requireDB(env);
  if (!db) return json({ error: 'Accounts are not set up yet.' }, 503);

  let body = {};
  try { body = await request.json(); } catch (e) { /* fall through */ }
  const email = String(body.email || '').trim().toLowerCase();
  if (!validEmail(email)) return json({ error: 'Enter a valid email address.' }, 400);

  // Light rate limit: max 5 links per email per hour.
  const recent = await db.prepare(
    "SELECT COUNT(*) AS n FROM magic_links WHERE email = ? AND created_at > datetime('now','-1 hour')"
  ).bind(email).first();
  if (recent && recent.n >= 5) {
    return json({ ok: true }); // fail silently, don't reveal the limit
  }

  const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
  const tokenHash = await sha256Hex(token);
  await db.prepare(
    "INSERT INTO magic_links (token_hash, email, expires_at) VALUES (?, ?, datetime('now','+15 minutes'))"
  ).bind(tokenHash, email).run();

  const link = `https://ai-framework.io/api/v1/auth/verify?token=${token}`;

  if (env.RESEND_API_KEY) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'AI Framework <hello@ai-framework.io>',
          to: email,
          subject: 'Your AI Framework sign-in link',
          text: `Click to sign in to AI Framework (expires in 15 minutes):\n\n${link}\n\nIf you didn't request this, ignore the email.`,
        }),
      });
    } catch (e) {
      // Email send failed; the link is still valid — surface a generic message.
      return json({ error: 'Could not send the email. Try again in a minute.' }, 502);
    }
  }
  return json({ ok: true });
}
