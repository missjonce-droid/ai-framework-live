// POST /api/v1/billing/checkout  { plan: "pro" | "business" | "agency" }
// Creates a Stripe Checkout Session (subscription mode). Returns { url }.
// Price IDs come from env (STRIPE_PRICE_PRO / _BUSINESS / _AGENCY) —
// set after creating the products in the Stripe dashboard.
import { json, requireDB, getSessionUser, getPrimaryWorkspace } from '../../_lib.js';

const PRICE_ENV = { pro: 'STRIPE_PRICE_PRO', business: 'STRIPE_PRICE_BUSINESS', agency: 'STRIPE_PRICE_AGENCY' };

export async function onRequestPost({ request, env }) {
  const db = requireDB(env);
  if (!db) return json({ error: 'Accounts are not set up yet.' }, 503);
  if (!env.STRIPE_SECRET_KEY) return json({ error: 'Billing is not configured yet.' }, 503);

  const user = await getSessionUser(request, env);
  if (!user) return json({ error: 'Sign in required.' }, 401);

  let body = {};
  try { body = await request.json(); } catch (e) { /* fall through */ }
  const plan = String(body.plan || '');
  const priceId = PRICE_ENV[plan] ? env[PRICE_ENV[plan]] : null;
  if (!priceId) return json({ error: 'That plan is not available yet.' }, 400);

  const ws = await getPrimaryWorkspace(env, user.id);
  let customerId = ws.stripe_customer_id;
  if (!customerId) {
    const cRes = await fetch('https://api.stripe.com/v1/customers', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: user.email,
        'metadata[user_id]': user.id,
        'metadata[workspace_id]': ws.id,
      }),
    });
    if (!cRes.ok) return json({ error: 'Could not start checkout.' }, 502);
    customerId = (await cRes.json()).id;
    await db.prepare('UPDATE workspaces SET stripe_customer_id = ? WHERE id = ?')
      .bind(customerId, ws.id).run();
  }

  const sRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      mode: 'subscription',
      customer: customerId,
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
      success_url: 'https://ai-framework.io/?billing=success',
      cancel_url: 'https://ai-framework.io/?billing=cancelled',
      'metadata[user_id]': user.id,
      'metadata[workspace_id]': ws.id,
      'metadata[plan]': plan,
    }),
  });
  if (!sRes.ok) return json({ error: 'Could not start checkout.' }, 502);
  const session = await sRes.json();
  if (!session.url) return json({ error: 'Could not start checkout.' }, 502);
  return json({ url: session.url });
}
