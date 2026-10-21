// /go/<slug> outbound redirect, served from data/go-map.json.
// Replaces 11k static _redirects rules (Pages caps static rules at 2,000).
let cache = null;

export async function onRequestGet({ params, env, request }) {
  if (!cache) {
    const res = await env.ASSETS.fetch(new URL("/data/go-map.json", request.url));
    cache = await res.json();
  }
  const dest = cache[params.slug];
  if (!dest) {
    return Response.redirect(new URL("/directory/", request.url), 302);
  }
  return Response.redirect(dest, 302);
}
