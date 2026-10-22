// GET /api/v1/discover — newest published frameworks across all AI Pages.
import { json, requireDB } from '../_lib.js';
import { summarizeFramework, isNotReady } from '../_profiles.js';

export async function onRequestGet({ request, env }) {
  const db = requireDB(env);
  if (!db) return json({ error: 'Accounts are not set up yet.' }, 503);
  try {
    const { results } = await db.prepare(
      `SELECT f.id, f.title, f.input_json, f.output_json, f.outcome_note, f.updated_at,
              u.handle AS owner_handle, u.display_name AS owner_name,
              (SELECT COUNT(*) FROM framework_forks k WHERE k.framework_id = f.id) AS forks
       FROM frameworks f
       JOIN workspaces w ON w.id = f.workspace_id
       JOIN users u ON u.id = w.owner_id
       WHERE f.is_public = 1 AND u.handle IS NOT NULL
       ORDER BY f.updated_at DESC LIMIT 30`
    ).all();
    return json({
      frameworks: (results || []).map((f) => Object.assign(summarizeFramework(f), {
        owner_handle: f.owner_handle,
        owner_name: f.owner_name || f.owner_handle,
      })),
    });
  } catch (e) {
    if (isNotReady(e)) return json({ error: 'AI Pages are not switched on yet.', code: 'not_ready' }, 503);
    throw e;
  }
}
