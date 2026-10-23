// POST /api/v1/frameworks/:id/fork — copy a published framework into
// the signed-in member's own workspace. Copies the system (tools, steps,
// prompts) — never the owner's private account data.
import { json, requireDB, getSessionUser, getPrimaryWorkspace, entitlements } from '../../../_lib.js';
import { isNotReady } from '../../../_profiles.js';

export async function onRequestPost({ request, env, params }) {
  const db = requireDB(env);
  if (!db) return json({ error: 'Accounts are not set up yet.' }, 503);
  const user = await getSessionUser(request, env);
  if (!user) return json({ error: 'Sign in to steel this system.' }, 401);

  try {
    const src = await db.prepare(
      `SELECT f.*, w.owner_id FROM frameworks f
       JOIN workspaces w ON w.id = f.workspace_id
       WHERE f.id = ? AND f.is_public = 1`
    ).bind(params.id).first();
    if (!src) return json({ error: 'That framework is not public.' }, 404);
    if (src.owner_id === user.id) return json({ error: 'This one is already yours.' }, 400);

    const already = await db.prepare(
      'SELECT framework_id FROM framework_forks WHERE framework_id = ? AND forker_user_id = ?'
    ).bind(params.id, user.id).first();
    if (already) return json({ error: 'You already steeled this system.' }, 409);

    const ws = await getPrimaryWorkspace(env, user.id);
    const limits = entitlements(ws.plan);
    const count = await db.prepare('SELECT COUNT(*) AS n FROM frameworks WHERE workspace_id = ?')
      .bind(ws.id).first();
    if (limits.maxFrameworks !== -1 && count.n >= limits.maxFrameworks) {
      return json({ error: `Your plan allows ${limits.maxFrameworks} saved frameworks.` }, 403);
    }

    const id = crypto.randomUUID();
    await db.prepare(
      'INSERT INTO frameworks (id, workspace_id, title, input_json, output_json) VALUES (?, ?, ?, ?, ?)'
    ).bind(id, ws.id, src.title, src.input_json, src.output_json).run();
    await db.prepare(
      'INSERT INTO framework_forks (framework_id, forker_user_id, new_framework_id) VALUES (?, ?, ?)'
    ).bind(params.id, user.id, id).run();
    return json({ ok: true, id }, 201);
  } catch (e) {
    if (isNotReady(e)) return json({ error: 'AI Pages are not switched on yet.', code: 'not_ready' }, 503);
    throw e;
  }
}
