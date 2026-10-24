// /tool/<slug> for tools without a static SEO shell (imported catalog entries).
// Existing tools keep their static shells. Note: this site's asset pipeline
// answers unknown paths with the homepage at 200 (soft-404), so "asset exists"
// is detected by comparing the response body with the homepage itself, not by
// status alone. Redirects (trailing-slash canonicalization) pass through.
let homeBody = null;
let appBody = null;

export async function onRequest({ request, env }) {
  const asset = await env.ASSETS.fetch(request);
  if (asset.status >= 300 && asset.status < 400) return asset;

  const body = await asset.text();
  if (!homeBody) {
    homeBody = await (await env.ASSETS.fetch(new URL("/index.html", request.url))).text();
  }
  if (body !== homeBody) {
    return new Response(body, { status: asset.status, headers: asset.headers });
  }
  if (!appBody) {
    appBody = await (await env.ASSETS.fetch(new URL("/app.html", request.url))).text();
  }
  return new Response(appBody, {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
