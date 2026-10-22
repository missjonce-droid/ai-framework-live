// Shared helpers for AI Pages (profiles + published frameworks).
// Files starting with "_" are ignored by Pages routing.
// Every query here touches migration-0003 columns/tables; callers must
// catch errors and fail soft until the migration is applied.

export const HANDLE_RE = /^[a-z0-9_]{3,24}$/;

export function cleanHandle(s) {
  const h = String(s || '').trim().toLowerCase().replace(/^@+/, '');
  return HANDLE_RE.test(h) ? h : null;
}

export function isNotReady(err) {
  const msg = String((err && err.message) || err || '');
  return /no such (column|table)|has no column/i.test(msg);
}

// Pull a short, safe public summary out of a framework's stored JSON.
export function summarizeFramework(f) {
  let input = {}, output = {};
  try { input = JSON.parse(f.input_json || '{}'); } catch (e) { /* keep empty */ }
  try { output = JSON.parse(f.output_json || '{}'); } catch (e) { /* keep empty */ }
  const goal = String(
    output.goal || output.summary || input.goal || input.prompt || ''
  ).slice(0, 240);
  let tools = [];
  const rawTools = output.tools || output.stack || output.recommendations || [];
  if (Array.isArray(rawTools)) {
    tools = rawTools
      .map((t) => (typeof t === 'string' ? t : (t && (t.name || t.tool || t.title)) || ''))
      .filter(Boolean)
      .slice(0, 8)
      .map((t) => String(t).slice(0, 40));
  }
  return {
    id: f.id,
    title: f.title,
    goal,
    tools,
    outcome_note: f.outcome_note ? String(f.outcome_note).slice(0, 280) : '',
    forks: Number(f.forks || 0),
    updated_at: f.updated_at,
  };
}

const FW_SELECT = `
  SELECT f.id, f.title, f.input_json, f.output_json, f.outcome_note, f.updated_at,
         (SELECT COUNT(*) FROM framework_forks k WHERE k.framework_id = f.id) AS forks
  FROM frameworks f
  JOIN workspaces w ON w.id = f.workspace_id
  WHERE w.owner_id = ? AND f.is_public = 1
  ORDER BY f.updated_at DESC LIMIT 50`;

export async function getPublicProfile(db, handle) {
  const user = await db.prepare(
    'SELECT id, handle, display_name, bio, ai_about, created_at FROM users WHERE handle = ?'
  ).bind(handle).first();
  if (!user) return null;
  const { results } = await db.prepare(FW_SELECT).bind(user.id).all();
  const favs = await db.prepare('SELECT tool_slug FROM favorites WHERE user_id = ? LIMIT 24')
    .bind(user.id).all();
  return {
    profile: {
      handle: user.handle,
      display_name: user.display_name || user.handle,
      bio: user.bio || '',
      ai_about: user.ai_about || '',
      member_since: user.created_at,
    },
    stack: ((favs && favs.results) || []).map((r) =>
      r.tool_slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())),
    frameworks: (results || []).map(summarizeFramework),
  };
}
