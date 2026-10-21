// /tool/<slug> for tools without a static SEO shell (imported catalog entries).
// Existing tools keep their static shells: whatever the asset pipeline returns
// for them (including the trailing-slash redirect) is passed through untouched.
// Only a genuine 404 falls back to the SPA shell, served at the original URL
// so the router can read the slug from the path.
export async function onRequest({ request, env }) {
  const asset = await env.ASSETS.fetch(request);
  if (asset.status !== 404) return asset;
  const shell = await env.ASSETS.fetch(new URL("/app.html", request.url));
  return new Response(shell.body, {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
