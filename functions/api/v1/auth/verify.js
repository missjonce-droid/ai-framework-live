// GET /api/v1/auth/verify?token=...
// Validates the magic link, creates the user + session, sets the cookie.
export async function onRequestGet({ request, env }) {
  const { json, requireDB, sessionCookie, sha256Hex, getPrimaryWorkspace } = await import('../../_lib.js');
  const db = requireDB(env);
  if (!db) return json({ error: 'Accounts are not set up yet.' }, 503);

  const url = new URL(request.url);
  const token = url.searchParams.get('token') || '';
  const fail = () => Response.redirect('https://ai-framework.io/?login=expired', 302);

  if (!token) return fail();
  const tokenHash = await sha256Hex(token);
  const row = await db.prepare('SELECT email, expires_at FROM magic_links WHERE token_hash = ?')
    .bind(tokenHash).first();
  if (!row) return fail();
  await db.prepare('DELETE FROM magic_links WHERE token_hash = ?').bind(tokenHash).run();
  if (!(Date.parse(String(row.expires_at).replace(' ', 'T')) > Date.now())) return fail();

  let user = await db.prepare('SELECT id, email FROM users WHERE email = ?').bind(row.email).first();
  if (!user) {
    const id = crypto.randomUUID();
    await db.prepare('INSERT INTO users (id, email) VALUES (?, ?)').bind(id, row.email).run();
    user = { id, email: row.email };
  }
  await getPrimaryWorkspace(env, user.id);

  const sid = crypto.randomUUID();
  await db.prepare("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, datetime('now','+30 days'))")
    .bind(sid, user.id).run();

  return new Response(null, {
    status: 302,
    headers: {
      Location: 'https://ai-framework.io/build-my-framework/?welcome=1',
      'Set-Cookie': sessionCookie(sid),
      'Cache-Control': 'no-store',
    },
  });
}
