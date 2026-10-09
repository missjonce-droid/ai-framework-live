# AI Framework

AI Framework is a static site and directory of AI tools, with Cloudflare Pages
Functions for its API endpoints. The repository contains the deployable site
at its root; no frontend bundle or package installation is needed.

## Deploy with Cloudflare Pages

1. In Cloudflare, create a Pages project and connect this GitHub repository.
2. Set the production branch to `main`.
3. Use the `None` framework preset, set the build command to
   `node scripts/generate-redirects.mjs`, and set the build output directory
   to `.` (the repository root).
4. Add `ANTHROPIC_API_KEY` as an encrypted Pages environment variable for
   production and preview environments. The framework builder and Prompt Lab
   need it; the AI news endpoint does not.
5. Deploy a preview first, check the routes listed below, then promote the
   deployment and attach the custom domain in Cloudflare Pages.

`functions/api/` maps directly to `/api/` routes. Do not add `/api/*`
redirects: Pages Functions handle those routes automatically. The redirect
generator writes Cloudflare Pages-compatible rules for URL aliases, outbound
tool links, and app routes. `_routes.json` limits Function invocations to
`/api/*` so normal static page and asset requests stay static.
`_headers` applies safe response headers to static Pages files and immutable
cache headers to the content-hashed application bundles. API Function
responses set their own headers.

`/sports-matchup` is a no-data demo that only organizes user-entered team
names and notes. It does not connect to a sports data provider or predictive
model, and does not produce scores, odds, probabilities, picks, or betting
advice.

`/calculator/` converts American odds entered by the visitor to mathematical
implied probabilities and decimal odds. It is not a win-probability estimate,
does not remove bookmaker margin, and does not provide picks or a fair line.
The Sports Data Pack is not for sale until a verified data provider and valid
payment integration are configured.

`/sports-research/` is a separate college-football market board backed by a
Cloudflare Worker. GitHub Actions can refresh actual US sportsbook
moneyline/spread/total markets from The Odds API every six hours. Its
market-derived implied percentages include vig; the optional Workers AI text
is only a contextual summary, not a validated forecast. The Odds API does
not supply the team-statistics datasets often used in sports analysis. See
[SPORTS-DEPLOYMENT.md](SPORTS-DEPLOYMENT.md) for secrets, Cloudflare
configuration, provider quota notes, testing, and deployment steps.

Cloudflare Pages builds from GitHub after the selected branch is pushed or
merged. Connect the domain in Cloudflare Pages and follow Cloudflare's
domain/DNS instructions there; this repository does not change GoDaddy or DNS
settings.

## Validate locally

With Node.js installed, run:

```sh
node scripts/generate-redirects.mjs
node scripts/validate-site.mjs
node scripts/test-sports-tools.mjs
node scripts/test-college-sports.mjs
```

The redirect generator reads the directory embedded in the checked-in
JavaScript bundle. Commit its generated `_redirects` file with any change that
affects the directory's outbound links. It checks the Cloudflare Pages
redirect limits before writing the file.

## Before promoting

- `/` loads the homepage and static assets.
- `/news` loads the headlines page and `/api/ai-news` returns JSON.
- `/receipt` loads the receipt tool.
- `/promptlab` and `/api/fix-prompt` work with the Pages secret configured.
- `/build-my-framework/` and `/api/build-framework` work with the Pages secret.
- `/sports-matchup` labels the feature as a demo and shows only user-provided details.
- `/calculator/` converts valid user-entered American odds without claiming to predict an outcome.
- `/sports-research/` shows sourced sportsbook markets only when the Worker, API key, KV binding, and site Worker URL are configured.
- A `/tool/...` profile and an outbound `/go/...` link resolve correctly.

There is no working newsletter signup service wired up for Cloudflare Pages.
Do not promote a signup form until it is connected to a real form or email
service.
