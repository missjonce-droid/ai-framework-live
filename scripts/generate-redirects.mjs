// Regenerates _redirects from the directory data embedded in the compiled
// bundle.
//
// Why this script exists: every resource page links out through
// /go/<slug>, and /alternatives/<slug> for the comparison view. Neither
// path has a file of its own, so both used to be resolved by the React
// router after the SPA catch-all served the shell. index.html is now a
// hand-written static homepage with no #root and no bundle, so those
// 3,000+ links silently rendered the homepage instead of going anywhere.
//
// /go/<slug> is an edge redirect straight to the tool's own site, which is
// faster than booting the bundle to call location.replace and works with
// JavaScript disabled. /alternatives/<slug> still needs the router, so it
// rewrites to app.html, the SPA shell.
//
// Run: node scripts/generate-redirects.mjs

import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..");

// Destinations the directory data cannot supply on its own. Both are
// verified against the resource's own page, not guessed: Riley Brown has
// no website_url at all and is reached through the TikTok account stored
// in attributes.socials, and the tutorials entry points at an internal
// route rather than an absolute URL.
const destinationOverrides = {
  "the-charley-project": "https://charleyproject.org/",
  "creator-riley-brown": "https://www.tiktok.com/@rileybrown.ai",
  "ai-framework-tutorials": "/tutorials/",
};

function extractArray(source) {
  const marker = /const\s+El\s*=\s*\[/g;
  const match = marker.exec(source);
  if (!match) {
    throw new Error("Could not locate the embedded directory data.");
  }

  const start = source.indexOf("[", match.index);
  let depth = 0;
  let quote = null;
  let escaped = false;

  for (let index = start; index < source.length; index += 1) {
    const character = source[index];

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === quote) {
        quote = null;
      }
      continue;
    }

    if (character === '"' || character === "'" || character === "`") {
      quote = character;
      continue;
    }

    if (character === "[") depth += 1;
    if (character === "]") {
      depth -= 1;
      if (depth === 0) {
        const literal = source.slice(start, index + 1);
        return vm.runInNewContext(`(${literal})`, Object.create(null), {
          timeout: 10_000,
        });
      }
    }
  }

  throw new Error("The embedded directory data did not contain a complete array.");
}

// A destination is only usable if it is an absolute http(s) URL or an
// internal absolute path. Anything else would send a visitor to a broken
// address, so it is reported instead of written out.
function normaliseDestination(value) {
  const candidate = String(value || "").trim();
  if (!candidate) return null;
  if (candidate.startsWith("/")) return candidate;
  try {
    const url = new URL(candidate);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

function destinationFor(resource) {
  return normaliseDestination(
    destinationOverrides[resource.slug] ||
      resource.affiliate_url ||
      resource.website_url,
  );
}

const assetManifest = JSON.parse(
  fs.readFileSync(path.join(root, "asset-manifest.json"), "utf8"),
);
const bundle = fs.readFileSync(
  path.join(root, assetManifest.files["main.js"].replace(/^\/+/, "")),
  "utf8",
);
const resources = extractArray(bundle).filter(
  (resource) => resource && resource.slug && resource.status === "active",
);

const outboundRules = [];
const unresolved = [];
for (const resource of [...resources].sort((left, right) =>
  left.slug.localeCompare(right.slug),
)) {
  const destination = destinationFor(resource);
  if (!destination) {
    unresolved.push(resource.slug);
    continue;
  }
  outboundRules.push([`/go/${encodeURIComponent(resource.slug)}`, destination]);
}

// Pad to a single column so the generated block stays readable next to the
// hand-written rules above it.
const width = outboundRules.reduce(
  (widest, [from]) => Math.max(widest, from.length),
  0,
);
const outboundLines = outboundRules
  .map(([from, to]) => `${from.padEnd(width)}  ${to}  302`);
const outboundBlock = outboundLines.join("\n");

const header = `# Cloudflare Pages redirects for AI Framework.
#
# GENERATED FILE - edit scripts/generate-redirects.mjs and re-run
#   node scripts/generate-redirects.mjs
#
# Pages Functions under functions/api handle /api/* directly.
# Static files are served by Pages; these rules provide URL aliases and
# rewrites for paths that do not have a corresponding file.

# Directory index pages use Cloudflare Pages automatic clean-URL routing.
# Do not proxy /tutorials (or any existing directory) to its index.html: the
# automatic index.html -> directory redirect can feed back into that proxy.

# Aliases for the two standalone tools, which ship under shorter filenames.
/promptlab             /promptlab.html                       200
/prompt-lab            /promptlab.html                       200
/prompt-lab/           /promptlab.html                       200
/prompt-lab.html       /promptlab.html                       200
/receipt               /receipt.html                         200
/the-receipt           /receipt.html                         200
/the-receipt/          /receipt.html                         200
/the-receipt.html      /receipt.html                         200
/news                  /news.html                            200
/sports-matchup        /sports-matchup.html                  200
# Static client-side route aliases rewrite to app.html, the SPA shell,
# because index.html is a static homepage and carries neither #root nor the
# bundle, so the router cannot start there.
/alternatives          /app.html                             200
/tree                  /app.html                             200

# Outbound links for every resource in the directory, generated from the
# affiliate_url / website_url fields. 302 rather than 301 so a destination
# can be corrected without a cached permanent redirect getting in the way.
`;

const dynamicRules = `

# Dynamic routes must follow static routes in Cloudflare Pages.
/alternatives/*        /app.html                             200
`;

function rulesFrom(contents) {
  return contents
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
}

const staticRuleCount = rulesFrom(header).length + outboundRules.length;
const dynamicRuleCount = rulesFrom(dynamicRules).length;
const overlongRule = [
  ...rulesFrom(header),
  ...outboundLines,
  ...rulesFrom(dynamicRules),
].find((line) => line.length > 1000);

if (staticRuleCount > 2000 || dynamicRuleCount > 100) {
  throw new Error(
    `Generated redirects exceed Cloudflare Pages limits (${staticRuleCount} static, ${dynamicRuleCount} dynamic; maximum 2000 static and 100 dynamic).`,
  );
}
if (overlongRule) {
  throw new Error("A generated redirect exceeds Cloudflare Pages' 1000-character limit.");
}

fs.writeFileSync(
  path.join(root, "_redirects"),
  `${header}${outboundBlock}${dynamicRules}`,
);

console.log(
  JSON.stringify(
    {
      resources: resources.length,
      outboundRules: outboundRules.length,
      unresolved,
    },
    null,
    2,
  ),
);

