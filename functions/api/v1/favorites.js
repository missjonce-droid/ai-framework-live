// /api/v1/favorites — sync favorite tools (replaces localStorage when signed in).
import { json, requireDB, getSessionUser } from '../_lib.js';

export async function onRequestGet({ request, env }) {
  const db = requireDB(env);
  if (!db) return json({ error: 'Accounts are not set up yet.' }, 503);
  const user = await getSessionUser(request, env);
  if (!user) return json({ error: 'Sign in required.' }, 401);
  const { results } = await db.prepare('SELECT tool_slug FROM favorites WHERE user_id = ?')
    .bind(user.id).all();
  return json({ slugs: (results || []).map((r) => r.tool_slug) });
}

export async function onRequestPut({ request, env }) {
  const db = requireDB(env);
  if (!db) return json({ error: 'Accounts are not set up yet.' }, 503);
  const user = await getSessionUser(request, env);
  if (!user) return json({ error: 'Sign in required.' }, 401);

  let body = {};
  try { body = await request.json(); } catch (e) { /* fall through */ }
  const slugs = Array.isArray(body.slugs)
    ? [...new Set(body.slugs.map((s) => String(s).slice(0, 80)).filter((s) => /^[a-z0-9-]+$/.test(s)))].slice(0, 500)
    : [];

  const batch = [db.prepare('DELETE FROM favorites WHERE user_id = ?').bind(user.id)];
  for (const slug of slugs) {
    batch.push(db.prepare('INSERT OR IGNORE INTO favorites (user_id, tool_slug) VALUES (?, ?)').bind(user.id, slug));
  }
  await db.batch(batch);
  return json({ ok: true, count: slugs.length });
}
