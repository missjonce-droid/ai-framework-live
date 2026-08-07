# The Receipt — signature-feature build

## What this is
A free, viral audit tool at `/receipt`: someone types in what they're
paying for (autocomplete against your real 1,559-tool catalog), and gets
an instant printed-receipt-style report — monthly total, redundant tools
flagged (same subcategory, keeps the cheapest, stamps the rest
"OVERLAP"), a cheaper/free catalog swap for each flagged tool, a dollar
figure for what's wasted, and a letter grade. Ends with a CTA into your
paid AI Stack Audit. Built to be shared: "Save as image" renders a
canvas PNG, "Copy shareable link" encodes the whole stack into the URL
hash — no backend, no signup.

It's also now the site's front door: the homepage hero leads with "Get
My Receipt →" as the primary CTA, it's in the nav everywhere with an
amber accent, and it's cross-linked from Prompt Lab and Playbooks.

## Files in this package (repo-relative paths)

| File | Status | What it is |
|---|---|---|
| `receipt.html` | NEW | The Receipt — standalone page, same pattern as promptlab.html |
| `static/data/tools-lite.json` | NEW | 1,559-tool dataset (slug/name/category/subcategory/pricing) that receipt.html's autocomplete and swap-suggestion logic runs against |
| `static/js/site-enhancements.js` | REPLACED | Homepage hero reframed around The Receipt as flagship CTA; Prompt Lab + Receipt added to nav everywhere; amber accent styling for the flagship link |
| `site-enhancements.js` | REPLACED | Identical copy, kept in sync (only `/static/js/` is actually loaded) |
| `_redirects` | REPLACED | Added `/receipt` and `/the-receipt` alias routes |
| `promptlab.html` | REPLACED | Added "The Receipt" to its own nav |
| `playbooks/index.html` | REPLACED | Added "The Receipt" to its own nav |
| `tests/test-receipt.js` | NEW | 23 jsdom tests on the scoring/redundancy/grading logic |
| `tests/test-enhancements.js` | UPDATED | 40 jsdom tests, now covering the flagship hero/nav changes |

## Verified before ship
- `node --check` on every JS file and the extracted inline script in
  `receipt.html` — all clean
- 23/23 jsdom tests on The Receipt's actual logic: add/remove tools,
  redundancy detection (flags the right ones, keeps the cheapest),
  waste math, grading (A–F), clean-stack case, unmatched/manual tools,
  quick-add buttons, shareable-link round-trip, image export, reset
- 40/40 jsdom tests on the homepage/nav integration: Receipt is the
  first + primary hero CTA, Build My Framework correctly demoted to
  secondary, nav ordering, no duplicates on re-apply, plus all the
  prior usability-fix coverage (tool page visit button, back links,
  card click-through) still passing
- Full route matrix (`/`, `/receipt`, `/the-receipt`,
  `/static/data/tools-lite.json`, `/build-my-framework`, `/promptlab`,
  `/playbooks`, `/tool/10web`) returns 200 with correct content through
  a live `netlify dev` server

## Known open item
The upsell CTA on the receipt ("Book the AI Stack Audit →") currently
points at `/contact` — `audit.html` (your dedicated offer page from an
earlier session) wasn't in this repo snapshot, so I couldn't confirm
its real URL. If it's live at a different path, that's a one-line
`href` swap in `receipt.html`.

## Still open, not started
Broader visual identity pass across the rest of the site (category
pages, tool pages, etc.) — The Receipt and the homepage hero got the
distinctive treatment; the 3,000+ generated tool/category pages still
use the existing template.

## To deploy
Commit these files to `main` at the same paths. Netlify auto-deploys.
Hard-refresh after deploy (old JS may be cached), then check: homepage
hero shows "Get My Receipt →", `/receipt` loads and produces a receipt
for 2+ tools, the nav shows "The Receipt" everywhere.
