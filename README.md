[README-START-HERE.md](https://github.com/user-attachments/files/30883443/README-START-HERE.md)
# Everything outstanding, in one package

This replaces site-update-4, -5, -6, -7, -8, and buddy-fix. Those never got
uploaded during the Netlify move. Nothing here needs those older zips — this
is complete on its own.

Built for **Cloudflare Pages** (the `_redirects` here has no `/api/*` lines,
because Cloudflare routes functions by file path automatically).

---

## What this adds

**The Receipt** (`/receipt`) — free audit tool. Someone lists the AI tools
they pay for and gets a receipt-style report: monthly total, redundant
subscriptions flagged, cheaper swaps from your catalog, dollars wasted, and
a letter grade. Shareable. No signup, no backend.

**The AI Wire** (`/news`) — daily newspaper-style page pulling real AI
headlines from TechCrunch, VentureBeat, MIT Tech Review, The Verge, and Ars
Technica. Free to run (publishers' own RSS feeds, cached 30 min at the edge).

**Prompt Lab actually uses AI** — it currently matches your text with regex
and fills one of ~8 templates. Now it sends your rough idea to Claude and
returns a real rewrite. The old template engine stays as a fallback, so the
button still works if the API is down or the daily cap is hit.

**Builder Buddy removed** — the cartoon robot that peeked over the text box
and got in the way on mobile. Replaced with a plain helper that just rotates
example prompts through the placeholder.

**Nav that actually appears** — the homepage had no `<nav>` element, so nav
links silently never rendered there. Now one is created when none exists.

**Real tool logos** — 1,557 tools show their company favicon instead of a
letter-in-a-circle.

**Copy fix** — "Stop collecting AI tools" (which argued against your own
directory) is now "Stop guessing. Start building."

---

## Files: 11 total

### NEW — create these (Add file -> Create new file, type the full path)
1. `receipt.html`
2. `news.html`
3. `static/data/tools-lite.json`
4. `static/data/tool-domains.json`
5. `static/js/builder-input-helper.js`

### REPLACE — open each, pencil icon, select all, delete, paste, commit
6. `promptlab.html`
7. `build-my-framework/index.html`
8. `static/js/site-enhancements.js`
9. `static/css/site-enhancements.css`
10. `static/css/framework-builder.css`
11. `_redirects`

### DELETE
- `static/js/builder-buddy.js`

---

## Before you start

**Close PR #7 without merging.** It's from an agent branch
(`agent-to-the-management-system-0c2f`) and would overwrite several files
here with older versions. GitHub -> Pull requests -> #7 -> Close pull request.
Do NOT resolve its conflicts.

Also worth deleting while you're in there (leftover, unused, not referenced
by anything):
- `ai-framework-the-receipt-v1/` folder — its useful parts are merged into
  `receipt.html` above
- `ai-framework-usability-fixes-v9/` folder
- any stray `.zip` files at the repo root

---

## Watch the filename box

Two uploads broke earlier because the filename kept the downloaded name
(`build-framework-v5-debug.js` instead of `build-framework.js`). Before
committing each file, check the filename field says exactly the target name.

---

## After it deploys, test on ai-framework-live.pages.dev

- `/receipt` — enter 2+ tools, get a receipt
- `/news` — real, recent headlines that link out
- `/promptlab` — "Fix my prompt" gives something specific to what you typed,
  not a generic template
- `/build-my-framework/` — AI box still works, and no robot on the page
- Homepage — nav row visible, including on your phone
- Any `/tool/...` page — real logo instead of a letter

---

## Known gap: the newsletter form

Your signup form used Netlify Forms, which doesn't exist on Cloudflare. It
will submit and silently fail. Options: Formspree's free tier, a small
Cloudflare Function, or your email tool's own hosted form. Worth fixing
before you promote the newsletter — say the word and I'll wire one up.
