// POST /api/v1/billing/portal
// Creates a Stripe Customer Portal session so subscribers can
// upgrade, downgrade, or cancel without us touching card data.
import { json, requireDB, getSessionUser, getPrimaryWorkspace } from '../../_lib.js';

export async function onRequestPost({ request, env }) {
  const db = requireDB(env);
  if (!db) return json({ error: 'Accounts are not set up yet.' }, 503);
  if (!env.STRIPE_SECRET_KEY) return json({ error: 'Billing is not configured yet.' }, 503);

  const user = await getSessionUser(request, env);
  if (!user) return json({ error: 'Sign in required.' }, 401);

  const ws = await getPrimaryWorkspace(env, user.id);
  if (!ws.stripe_customer_id) return json({ error: 'No subscription yet.' }, 400);

  const pRes = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      customer: ws.stripe_customer_id,
      return_url: 'https://ai-framework.io/?billing=portal',
    }),
  });
  if (!pRes.ok) return json({ error: 'Could not open the billing portal.' }, 502);
  const portal = await pRes.json();
  if (!portal.url) return json({ error: 'Could not open the billing portal.' }, 502);
  return json({ url: portal.url });
}
