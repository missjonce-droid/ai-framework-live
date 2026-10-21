#!/usr/bin/env node
/**
 * Generate the site's redirect layer.
 *
 * History: outbound /go/<slug> links used to be static rules in _redirects,
 * but Cloudflare Pages caps static rules at 2,000 total and the catalog is
 * now 11k+ tools. Outbound redirects are served by functions/go/[slug].js
 * reading data/go-map.json. This script regenerates BOTH:
 *   - data/go-map.json  (slug -> destination, affiliate URL preferred)
 *   - _redirects        (hand-written rules + SPA dynamic rules only)
 *
 * Run from the repo root: node scripts/generate-redirects.mjs
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const rootDir = path.resolve(path.dirname(__filename), "..");

function extractArray(source, assignmentName) {
  const marker = new RegExp(`const\\s+${assignmentName}\\s*=\\s*\\[`, "g");
  const match = marker.exec(source);
  if (!match) throw new Error(`Could not find array assignment for ${assignmentName}`);
  const start = source.indexOf("[", match.index);
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'" || char === "`") { quote = char; continue; }
    if (char === "[") depth += 1;
    if (char === "]") {
      depth -= 1;
      if (depth === 0) return { literal: source.slice(start, index + 1), end: index + 1 };
    }
  }
  throw new Error(`Could not find end of array for ${assignmentName}`);
}

function getBundleRecords() {
  const manifest = JSON.parse(fs.readFileSync(path.join(rootDir, "asset-manifest.json"), "utf8"));
  const bundleRel = String(manifest.js || "static/js/main.js").replace(/^\//, "");
  const source = fs.readFileSync(path.join(rootDir, bundleRel), "utf8");
  const { literal } = extractArray(source, "El");
  return vm.runInNewContext(`(${literal})`, Object.create(null), { timeout: 5000 });
}

// A destination is only usable in a Location header if it is an absolute
// http(s) URL or a root-relative path on this site.
function normalizedDestination(candidate) {
  const cleaned = String(candidate ?? "").trim();
  if (!cleaned) return null;
  if (cleaned.startsWith("/")) return cleaned;
  try {
    const url = new URL(cleaned);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

// Records whose go target must be overridden for safety/correctness,
// independent of the destination they carry in compiled app data.
const destinationOverrides = {
  "the-charley-project": "https://charleyproject.org/",
  "creator-riley-brown": "https://www.tiktok.com/@rileybrown.ai",
  "ai-framework-tutorials": "/tutorials/",
};

function buildGoMap(records) {
  const map = {};
  for (const record of records) {
    if (!record || typeof record !== "object") continue;
    if (record.status !== "active") continue;
    if (!record.slug) continue;
    if (record.type_code !== "tool") continue;
    const dest = normalizedDestination(
      destinationOverrides[record.slug] ?? record.affiliate_url ?? record.website_url
    );
    if (dest) map[record.slug] = dest;
  }
  return map;
}

const REDIRECTS = `# GENERATED FILE - do not edit by hand.
# Regenerate with: node scripts/generate-redirects.mjs
# Outbound /go/<slug> redirects live in data/go-map.json (served by
# functions/go/[slug].js) because Pages caps static rules at 2,000.

# Legacy hostnames
http://ai-framework.com/*        https://ai-framework.io/:splat        301!
https://www.ai-framework.io/*    https://ai-framework.io/:splat        301!
http://ai-framework.io/*         https://ai-framework.io/:splat        301!

# Legacy/vanity paths
/cv        /build-my-framework/        301
/build     /build-my-framework/        301
/sports    /sports-research/           301

# Dynamic routes handled by the app shell
/alternatives/*        /app.html                             200
/tool/*                /app.html                             200
`;

function main() {
  const records = getBundleRecords();
  const map = buildGoMap(records);
  fs.writeFileSync(path.join(rootDir, "data/go-map.json"), JSON.stringify(map) + "\n");
  fs.writeFileSync(path.join(rootDir, "_redirects"), REDIRECTS);
  console.log(`go-map entries: ${Object.keys(map).length}`);
}

main();
