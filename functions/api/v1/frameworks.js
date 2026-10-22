// /api/v1/frameworks — list + create saved frameworks.
import { json, requireDB, getSessionUser, getPrimaryWorkspace, entitlements } from '../_lib.js';

async function authed(request, env) {
  const db = requireDB(env);
  if (!db) return { err: json({ error: 'Accounts are not set up yet.' }, 503) };
  const user = await getSessionUser(request, env);
  if (!user) return { err: json({ error: 'Sign in required.' }, 401) };
  return { db, user };
}

export async function onRequestGet({ request, env }) {
  const a = await authed(request, env);
  if (a.err) return a.err;
  const base = `FROM frameworks f
     JOIN workspaces w ON w.id = f.workspace_id
     LEFT JOIN workspace_members m ON m.workspace_id = w.id AND m.user_id = ?
     WHERE w.owner_id = ? OR m.user_id = ?
     ORDER BY f.updated_at DESC LIMIT 200`;
  try {
    // Includes AI Pages publish state once migration 0003 is applied.
    const { results } = await a.db.prepare(
      `SELECT f.id, f.title, f.created_at, f.updated_at, f.workspace_id, f.is_public, f.outcome_note ${base}`
    ).bind(a.user.id, a.user.id, a.user.id).all();
    return json({ frameworks: (results || []).map((f) => Object.assign(f, { is_public: Boolean(f.is_public) })) });
  } catch (e) {
    const { results } = await a.db.prepare(
      `SELECT f.id, f.title, f.created_at, f.updated_at, f.workspace_id ${base}`
    ).bind(a.user.id, a.user.id, a.user.id).all();
    return json({ frameworks: results || [] });
  }
}

export async function onRequestPost({ request, env }) {
  const a = await authed(request, env);
  if (a.err) return a.err;

  let body = {};
  try { body = await request.json(); } catch (e) { /* fall through */ }
  const title = String(body.title || 'Untitled framework').slice(0, 120);
  const input = body.input || {};
  const output = body.output || {};
  if (!output || typeof output !== 'object') return json({ error: 'Nothing to save.' }, 400);

  const ws = await getPrimaryWorkspace(env, a.user.id);
  const limits = entitlements(ws.plan);
  const count = await a.db.prepare('SELECT COUNT(*) AS n FROM frameworks WHERE workspace_id = ?')
    .bind(ws.id).first();
  if (limits.maxFrameworks !== -1 && count.n >= limits.maxFrameworks) {
    return json({ error: `Your plan allows ${limits.maxFrameworks} saved frameworks.` }, 403);
  }

  const id = crypto.randomUUID();
  await a.db.prepare(
    'INSERT INTO frameworks (id, workspace_id, title, input_json, output_json) VALUES (?, ?, ?, ?, ?)'
  ).bind(id, ws.id, title, JSON.stringify(input).slice(0, 200000), JSON.stringify(output).slice(0, 2000000)).run();

  return json({ ok: true, id }, 201);
}
