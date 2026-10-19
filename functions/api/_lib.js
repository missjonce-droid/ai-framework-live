// Shared helpers for /api/v1 (Cloudflare Pages Functions).
// Files/dirs starting with "_" are ignored by Pages routing, so this never becomes a route.

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: Object.assign(
      { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      headers
    ),
  });
}

export function requireDB(env) {
  return env.DB || null;
}

export function getCookie(request, name) {
  const h = request.headers.get('Cookie') || '';
  const m = h.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : null;
}

export function sessionCookie(id) {
  return `af_session=${encodeURIComponent(id)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=2592000`;
}

export function clearSessionCookie() {
  return 'af_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0';
}

export async function sha256Hex(s) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function validEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim().slice(0, 160));
}

// Approved plan limits (Nicole, 2026-10-19). -1 = unlimited.
export const PLANS = {
  free:     { generationsPerMonth: 3,   maxFrameworks: 3,   favoritesSync: false, workspaces: 1, seats: 1,  aiCap: 0 },
  pro:      { generationsPerMonth: -1,  maxFrameworks: 25,  favoritesSync: true,  workspaces: 1, seats: 1,  aiCap: 100 },
  business: { generationsPerMonth: -1,  maxFrameworks: 250, favoritesSync: true,  workspaces: 1, seats: 5,  aiCap: 500 },
  agency:   { generationsPerMonth: -1,  maxFrameworks: -1,  favoritesSync: true,  workspaces: 5, seats: 25, aiCap: 2000 },
};

export function entitlements(plan) {
  return PLANS[plan] || PLANS.free;
}

export async function getSessionUser(request, env) {
  const sid = getCookie(request, 'af_session');
  if (!sid || !env.DB) return null;
  const row = await env.DB.prepare(
    `SELECT s.user_id, u.email FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.id = ? AND s.expires_at > strftime('%Y-%m-%dT%H:%M:%fZ','now')`
  ).bind(sid).first();
  return row ? { id: row.user_id, email: row.email, sessionId: sid } : null;
}

export async function getPrimaryWorkspace(env, userId) {
  let ws = await env.DB.prepare(
    'SELECT * FROM workspaces WHERE owner_id = ? ORDER BY created_at LIMIT 1'
  ).bind(userId).first();
  if (!ws) {
    const id = crypto.randomUUID();
    await env.DB.prepare('INSERT INTO workspaces (id, owner_id, name) VALUES (?, ?, ?)')
      .bind(id, userId, 'My workspace').run();
    ws = await env.DB.prepare('SELECT * FROM workspaces WHERE id = ?').bind(id).first();
  }
  return ws;
}

export async function userWorkspaces(env, userId) {
  const { results } = await env.DB.prepare(
    `SELECT w.* FROM workspaces w
     LEFT JOIN workspace_members m ON m.workspace_id = w.id AND m.user_id = ?
     WHERE w.owner_id = ? OR m.user_id = ?
     ORDER BY w.created_at`
  ).bind(userId, userId, userId).all();
  return results || [];
}
