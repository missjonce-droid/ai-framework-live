// GET /api/v1/public?handle=<handle> — public AI Page data (JSON).
import { json, requireDB } from '../_lib.js';
import { cleanHandle, getPublicProfile, isNotReady } from '../_profiles.js';

export async function onRequestGet({ request, env }) {
  const db = requireDB(env);
  if (!db) return json({ error: 'Accounts are not set up yet.' }, 503);
  const handle = cleanHandle(new URL(request.url).searchParams.get('handle') || '');
  if (!handle) return json({ error: 'Bad handle.' }, 400);
  try {
    const data = await getPublicProfile(db, handle);
    if (!data) return json({ error: 'No such page.' }, 404);
    return json(data);
  } catch (e) {
    if (isNotReady(e)) return json({ error: 'AI Pages are not switched on yet.', code: 'not_ready' }, 503);
    throw e;
  }
}
