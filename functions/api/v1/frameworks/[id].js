// /api/v1/frameworks/:id — read / update / delete one saved framework.
import { json, requireDB, getSessionUser } from '../../_lib.js';
import { isNotReady } from '../../_profiles.js';

async function owned(db, userId, id) {
  return db.prepare(
    `SELECT f.* FROM frameworks f
     JOIN workspaces w ON w.id = f.workspace_id
     LEFT JOIN workspace_members m ON m.workspace_id = w.id AND m.user_id = ?
     WHERE f.id = ? AND (w.owner_id = ? OR m.user_id = ?)`
  ).bind(userId, id, userId, userId).first();
}

async function authed(request, env) {
  const db = requireDB(env);
  if (!db) return { err: json({ error: 'Accounts are not set up yet.' }, 503) };
  const user = await getSessionUser(request, env);
  if (!user) return { err: json({ error: 'Sign in required.' }, 401) };
  return { db, user };
}

export async function onRequestGet({ request, env, params }) {
  const a = await authed(request, env);
  if (a.err) return a.err;
  const f = await owned(a.db, a.user.id, params.id);
  if (!f) return json({ error: 'Not found.' }, 404);
  return json({
    id: f.id, title: f.title,
    input: JSON.parse(f.input_json || '{}'),
    output: JSON.parse(f.output_json || '{}'),
    is_public: Boolean(f.is_public),
    outcome_note: f.outcome_note || '',
    created_at: f.created_at, updated_at: f.updated_at,
  });
}

export async function onRequestPut({ request, env, params }) {
  const a = await authed(request, env);
  if (a.err) return a.err;
  const f = await owned(a.db, a.user.id, params.id);
  if (!f) return json({ error: 'Not found.' }, 404);
  let body = {};
  try { body = await request.json(); } catch (e) { /* fall through */ }
  const title = String(body.title || f.title).slice(0, 120);
  await a.db.prepare("UPDATE frameworks SET title = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?")
    .bind(title, params.id).run();
  // AI Pages publish state (migration 0003) — optional fields, fail soft.
  if (body.is_public !== undefined || body.outcome_note !== undefined) {
    try {
      const isPublic = body.is_public === undefined ? (f.is_public ? 1 : 0) : (body.is_public ? 1 : 0);
      const note = body.outcome_note === undefined
        ? (f.outcome_note || null)
        : (String(body.outcome_note).trim().slice(0, 280) || null);
      await a.db.prepare('UPDATE frameworks SET is_public = ?, outcome_note = ? WHERE id = ?')
        .bind(isPublic, note, params.id).run();
    } catch (e) {
      if (isNotReady(e)) return json({ error: 'AI Pages are not switched on yet.', code: 'not_ready' }, 503);
      throw e;
    }
  }
  return json({ ok: true });
}

export async function onRequestDelete({ request, env, params }) {
  const a = await authed(request, env);
  if (a.err) return a.err;
  const f = await owned(a.db, a.user.id, params.id);
  if (!f) return json({ error: 'Not found.' }, 404);
  await a.db.prepare('DELETE FROM frameworks WHERE id = ?').bind(params.id).run();
  return json({ ok: true });
}
