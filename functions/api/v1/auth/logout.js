// POST /api/v1/auth/logout — destroys the session cookie.
export async function onRequestPost({ request, env }) {
  const { json, getCookie, clearSessionCookie } = await import('../../_lib.js');
  const sid = getCookie(request, 'af_session');
  if (sid && env.DB) {
    await env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(sid).run();
  }
  return json({ ok: true }, 200, { 'Set-Cookie': clearSessionCookie() });
}
