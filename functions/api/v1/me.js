// GET /api/v1/me — current user, workspaces, and entitlements.
export async function onRequestGet({ request, env }) {
  const { json, requireDB, getSessionUser, userWorkspaces, entitlements } = await import('../_lib.js');
  const db = requireDB(env);
  if (!db) return json({ error: 'Accounts are not set up yet.' }, 503);

  const user = await getSessionUser(request, env);
  // Signed-out visitors still need to know whether paid checkout is live,
  // so the pricing buttons can say "Subscribe" instead of "Notify me".
  // The 401 stays: no user, no workspaces, no entitlements leak.
  if (!user) return json({ user: null, billing_ready: Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_PRICE_PRO) }, 401);

  const workspaces = await userWorkspaces(env, user.id);
  const primary = workspaces[0] || null;
  return json({
    user: { id: user.id, email: user.email },
    workspaces: workspaces.map((w) => ({
      id: w.id, name: w.name, plan: w.plan,
      entitlements: entitlements(w.plan),
    })),
    plan: primary ? primary.plan : 'free',
    entitlements: entitlements(primary ? primary.plan : 'free'),
    billing_ready: Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_PRICE_PRO),
  });
}
