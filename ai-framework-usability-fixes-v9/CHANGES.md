# Usability fixes — friend-test work order (v9)

## The root cause, first
The live `/static/js/site-enhancements.js` (loaded by all 1,602 pages)
had a **syntax error** — two versions of the file were merged badly, leaving
mismatched braces and a reference to a variable that doesn't exist. A file
that doesn't parse runs zero lines, so **none** of the previously shipped
enhancements ever executed: no hero CTA, no Prompt Lab links, no visit
button, no back links. That one bug is why every friend-test finding existed.

The v9 rebuild wraps every enhancement in its own try/catch, so a single
failing step can never silently disable the rest again.

## Files in this package (repo-relative paths)

| File | Status | What changed |
|---|---|---|
| `static/js/site-enhancements.js` | REPLACED | v9 rebuild — all fixes below |
| `site-enhancements.js` | REPLACED | identical copy (kept in sync; only /static/js is loaded) |
| `_redirects` | REPLACED | the whole rule block was duplicated; now one clean block |
| `links.json` | NEW | 1,558 slug → outbound URL map extracted from the app data — the same set `/go/<slug>` resolves against (only `creator-riley-brown` has no URL and is excluded) |
| `promptlab.html` | REPLACED | one line: its own nav link `/prompt-lab` → canonical `/promptlab` |
| `tests/test-enhancements.js` | NEW | 34 jsdom behavior tests (optional to commit; `npm i jsdom && node tests/test-enhancements.js`) |

Note: `BUY_URL` in promptlab.html was **already** `'/playbooks/'` in the
repo, so that work-order item was done before this pass.

## What v9 ships

**Fix 1 — dead "create a framework" CTA.** The homepage hero now gets a
real `<a href="/build-my-framework/">Build My Framework →</a>` as the
primary action (middle-clickable, keyboard reachable), and a delegated
click fallback catches ANY non-link element labeled "create/build a
framework" and navigates it to the builder.

**Fix 2 — outbound clicks on tool pages.** Each tool page gets a prominent
primary button at the top of the header card — "Visit [ToolName] →" with an
external-link icon — routed through `/go/<slug>?ref=/tool/<slug>` in a new
tab. The old easy-to-miss "Visit website" button is hidden once the new one
is in. The **entire header card** is also clickable (clicks on inner
links/buttons are untouched) and opens the tool site in a new tab. Both
paths fire the `outbound_tool_click` GTM event with a `via` field
(`visit_button` / `tool_card` / `link`) so you can see which UI earns the
clicks.

**Fix 3 — the way back.** The homepage title (the one header where the logo
wasn't a link) is wrapped in `<a href="/">`; directory-style pages already
had a linked brand. Every tool detail page gets "← All tools" (→ `/browse`)
directly above the header card.

**Prompt Lab wiring.** "Prompt Lab" nav item → `/promptlab` (sits next to
Playbooks), plus the under-search hint on the homepage: "Not sure what to
type? Fix your prompt free →".

## Verified locally before ship

1. `netlify dev` (netlify-cli 27) against this folder with the new
   `_redirects` — all 15 routes 200 with the right content, including
   `/build-my-framework` → the builder page, `/promptlab` + `/prompt-lab`
   alias, `/go/10web` → SPA redirect shell, `/links.json`, static tool and
   category pages.
2. `node --check` on both JS copies (this is the check that would have
   caught the original bug).
3. 34/34 jsdom behavior tests against replicas of the real React markup:
   hero CTA, dead-CTA fallback, nav placement, search hint, back link,
   visit button (label/icon/target/rel/href), whole-card click-through,
   inner-link safety, GTM events, and idempotency on re-apply.

## To deploy
Commit these files to `main` (same paths). Netlify auto-deploys. After
deploy, hard-refresh (the old broken JS may be cached) and re-run the
friend test: homepage CTA click, tool page → visit, and "find your way
back" are the three things to watch.
