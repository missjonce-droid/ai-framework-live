// /api/v1/profile — the signed-in member's own AI Page: read + edit.
// Requires migration 0003; fails soft with 503 until it is applied.
import { json, requireDB, getSessionUser } from '../_lib.js';
import { cleanHandle, isNotReady } from '../_profiles.js';

async function authed(request, env) {
  const db = requireDB(env);
  if (!db) return { err: json({ error: 'Accounts are not set up yet.' }, 503) };
  const user = await getSessionUser(request, env);
  if (!user) return { err: json({ error: 'Sign in required.' }, 401) };
  return { db, user };
}

function notReady() {
  return json({ error: 'AI Pages are not switched on yet.', code: 'not_ready' }, 503);
}

export async function onRequestGet({ request, env }) {
  const a = await authed(request, env);
  if (a.err) return a.err;
  try {
    const u = await a.db.prepare(
      'SELECT handle, display_name, bio, ai_about FROM users WHERE id = ?'
    ).bind(a.user.id).first();
    const { results } = await a.db.prepare(
      `SELECT f.id, f.title, f.is_public, f.outcome_note, f.updated_at,
              (SELECT COUNT(*) FROM framework_forks k WHERE k.framework_id = f.id) AS forks
       FROM frameworks f
       JOIN workspaces w ON w.id = f.workspace_id
       LEFT JOIN workspace_members m ON m.workspace_id = w.id AND m.user_id = ?
       WHERE w.owner_id = ? OR m.user_id = ?
       ORDER BY f.updated_at DESC LIMIT 200`
    ).bind(a.user.id, a.user.id, a.user.id).all();
    return json({
      profile: {
        handle: u.handle || '',
        display_name: u.display_name || '',
        bio: u.bio || '',
        ai_about: u.ai_about || '',
        email: a.user.email,
      },
      frameworks: (results || []).map((f) => ({
        id: f.id, title: f.title,
        is_public: Boolean(f.is_public),
        outcome_note: f.outcome_note || '',
        forks: Number(f.forks || 0),
        updated_at: f.updated_at,
      })),
    });
  } catch (e) {
    if (isNotReady(e)) return notReady();
    throw e;
  }
}

export async function onRequestPut({ request, env }) {
  const a = await authed(request, env);
  if (a.err) return a.err;
  let body = {};
  try { body = await request.json(); } catch (e) { /* fall through */ }

  const handle = cleanHandle(body.handle);
  if (!handle) {
    return json({ error: 'Pick a handle: 3–24 characters, lowercase letters, numbers, or _.' }, 400);
  }
  const display_name = String(body.display_name || '').trim().slice(0, 60);
  const bio = String(body.bio || '').trim().slice(0, 280);
  const ai_about = String(body.ai_about || '').trim().slice(0, 500);

  try {
    const clash = await a.db.prepare('SELECT id FROM users WHERE handle = ? AND id <> ?')
      .bind(handle, a.user.id).first();
    if (clash) return json({ error: 'That handle is taken.' }, 409);
    await a.db.prepare(
      'UPDATE users SET handle = ?, display_name = ?, bio = ?, ai_about = ? WHERE id = ?'
    ).bind(handle, display_name, bio, ai_about, a.user.id).run();
    return json({ ok: true, handle });
  } catch (e) {
    if (isNotReady(e)) return notReady();
    throw e;
  }
}
