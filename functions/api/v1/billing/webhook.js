// POST /api/v1/billing/webhook — Stripe webhook receiver.
// Verifies the Stripe signature (5-minute tolerance), then applies
// subscription events to workspace plans. Never trust the body unverified.
import { json, requireDB } from '../../_lib.js';

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

async function verifySignature(rawBody, header, secret) {
  const parts = {};
  for (const p of String(header || '').split(',')) {
    const i = p.indexOf('=');
    if (i > 0) parts[p.slice(0, i)] = p.slice(i + 1);
  }
  if (!parts.t || !parts.v1) return false;
  const age = Date.now() / 1000 - Number(parts.t);
  if (!Number.isFinite(age) || Math.abs(age) > 300) return false;
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${parts.t}.${rawBody}`));
  const hex = [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return timingSafeEqual(hex, parts.v1);
}

const KNOWN_PLANS = new Set(['pro', 'business', 'agency']);

export async function onRequestPost({ request, env }) {
  const db = requireDB(env);
  if (!db) return json({ error: 'Accounts are not set up yet.' }, 503);
  if (!env.STRIPE_WEBHOOK_SECRET) return json({ error: 'Webhook not configured.' }, 503);

  const raw = await request.text();
  const ok = await verifySignature(raw, request.headers.get('stripe-signature'), env.STRIPE_WEBHOOK_SECRET);
  if (!ok) return json({ error: 'Invalid signature.' }, 400);

  let event;
  try { event = JSON.parse(raw); } catch (e) { return json({ error: 'Bad payload.' }, 400); }

  const priceToPlan = {};
  if (env.STRIPE_PRICE_PRO) priceToPlan[env.STRIPE_PRICE_PRO] = 'pro';
  if (env.STRIPE_PRICE_BUSINESS) priceToPlan[env.STRIPE_PRICE_BUSINESS] = 'business';
  if (env.STRIPE_PRICE_AGENCY) priceToPlan[env.STRIPE_PRICE_AGENCY] = 'agency';

  if (event.type === 'checkout.session.completed') {
    const s = event.data.object || {};
    const plan = s.metadata && s.metadata.plan;
    const wsId = s.metadata && s.metadata.workspace_id;
    if (wsId && KNOWN_PLANS.has(plan)) {
      await db.prepare(
        'UPDATE workspaces SET plan = ?, stripe_customer_id = ?, stripe_subscription_id = ? WHERE id = ?'
      ).bind(plan, s.customer || null, s.subscription || null, wsId).run();
    }
  } else if (event.type === 'customer.subscription.updated') {
    const sub = event.data.object || {};
    const item = sub.items && sub.items.data && sub.items.data[0];
    const priceId = item && item.price && item.price.id;
    if ((sub.status === 'active' || sub.status === 'trialing') && priceToPlan[priceId]) {
      await db.prepare('UPDATE workspaces SET plan = ? WHERE stripe_subscription_id = ?')
        .bind(priceToPlan[priceId], sub.id).run();
    }
  } else if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object || {};
    if (sub.id) {
      await db.prepare("UPDATE workspaces SET plan = 'free', stripe_subscription_id = NULL WHERE stripe_subscription_id = ?")
        .bind(sub.id).run();
    }
  }

  return json({ received: true });
}
