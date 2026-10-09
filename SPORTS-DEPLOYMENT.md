# College football market board deployment

The feature has four separately configured parts: a GitHub Actions scheduled
fetch, The Odds API v4, a Cloudflare Worker with KV and Workers AI bindings,
and this repository's existing Cloudflare Pages site. The Pages deploy remains
the existing GitHub-connected build; the Worker is deployed separately.

## What it does and does not provide

- The scheduled fetch requests only `americanfootball_ncaaf`, US region, and
  `h2h`, `spreads`, and `totals` markets, in American odds format. It runs every
  six hours and can also be started with **Actions → Fetch college football
  odds → Run workflow**.
- The API provides sportsbook market prices, not team-performance,
  injuries, weather, referee, or other statistical datasets. This code does
  not create or imply access to those datasets.
- The board computes averages and implied percentages only from prices
  actually received. The percentages are raw implied probabilities and
  include bookmaker margin (vig); the feed does not claim they are calibrated
  outcome probabilities. Average spread/total lines are market summaries, not
  score forecasts.
- Workers AI (`@cf/meta/llama-3.1-8b-instruct`, verified in Cloudflare's
  current model catalog) produces a short contextual paraphrase of the
  supplied market snapshot. It is not a validated prediction. AI summaries
  can be inaccurate.
- No payment or premium checkout is configured.

## 1. Create and configure the Worker

Use Node.js 24 and Wrangler 4.36.0 or newer. In the Cloudflare account that
will own the Worker:

1. The `SPORTS_DATA` KV namespace is already created for this account. If
   setting up a different account, create one with:

   ```sh
   npx wrangler kv namespace create SPORTS_DATA
   ```

2. For another Cloudflare account, put its returned **production namespace ID**
   into `wrangler.toml`. The three rate-limit `namespace_id` values in that
   file must be unique positive integers in your account. If any are already in
   use, change them to unused IDs. Rate-limit bindings require Wrangler 4.36.0
   or later.
3. From the repository root, deploy the Worker:

   ```sh
   npx wrangler deploy
   ```

   Wrangler creates the `AI` binding and the configured rate-limit bindings.
   The Worker uses `workers.dev`; this does not require changing GoDaddy DNS
   or the existing Pages custom-domain records.
   The Wrangler configuration is at the repository root, matching the
   Cloudflare Workers Builds commands (`npx wrangler deploy` and
   `npx wrangler preview`) so both production and pull-request previews load
   the same bindings and preview settings.
4. Create a long, random `SPORTS_INGEST_TOKEN` locally with a password
   manager or secure random generator. Do not commit it, paste it into source,
   or send it in chat. Set it as a Worker secret:

   ```sh
   npx wrangler secret put SPORTS_INGEST_TOKEN
   ```

   Enter the same value securely as the GitHub Actions repository secret in
   the next section. Never put it in a GitHub Actions variable.
5. Note the Worker URL printed by Wrangler, for example
   `https://sports-research-api.<account-subdomain>.workers.dev`.
   Keep the URL; it is used to configure both the workflow and the site.

The Worker accepts browser requests only from `https://ai-framework.io` and
`https://www.ai-framework.io`. The ingest endpoint requires the bearer secret;
public odds and summary routes are read-only. Cloudflare rate-limit bindings cap market reads at 60/minute per client IP
key, summaries at 8/minute per IP key, and authenticated ingests at 4/minute.
Cloudflare's binding counters are per Cloudflare location, not a globally
coordinated account-wide user quota. Ingest requests are limited to 850 KB,
stored feeds to 900 KB, and feeds to 150 events / 25 bookmakers per event.

## 2. Configure GitHub Actions and The Odds API

Obtain a The Odds API key with access to the requested college-football
markets. In the repository's **Settings → Secrets and variables → Actions**,
add:

| Name | Type | Value |
| --- | --- | --- |
| `ODDS_API_KEY` | Repository secret | Your The Odds API key |
| `SPORTS_INGEST_TOKEN` | Repository secret | The exact token entered as the Worker secret |
| `SPORTS_INGEST_URL` | Repository variable | The Worker URL plus `/internal/college-football/ingest` |

`SPORTS_INGEST_URL` must be the HTTPS
`https://sports-research-api.<account-subdomain>.workers.dev/internal/college-football/ingest`
URL. The workflow never prints the provider key or bearer token. The provider
key is sent only to The Odds API; the ingest token is sent only to the
configured Worker URL.

The fetch requests three markets in one region, normally costing three
The Odds API credits per successful non-empty fetch (one credit per
market/region). Four runs per day are about 12 credits/day or 360 credits in a
30-day month, depending on provider rules and whether events are available.
Check the usage headers printed by the workflow against your plan. The API
key is sent in the provider's query parameter as required by its v4 API, and
is not logged by the script.

The scheduled workflow runs from the repository's default branch. It will
start automatically after this workflow is present on that branch and the
secrets/variable are configured. Use **workflow_dispatch** to test it
manually. An empty in-season response is stored as an empty feed and shown as
no current events; provider failures fail the workflow rather than replacing
the last good feed. Stored data expires after seven days and the UI marks
data older than 12 hours as stale.

## 3. Connect the static frontend to the Worker

After deploying the Worker, replace the placeholder in
`frontend/index.html`:

```html
<meta name="sports-api-base" content="https://sports-research-api.<YOUR_ACCOUNT_SUBDOMAIN>.workers.dev">
```

with the exact HTTPS `workers.dev` Worker URL. Commit and push that change to
the Pages production branch only when you want it published. The existing
Cloudflare Pages GitHub integration will rebuild the site using
`node scripts/generate-redirects.mjs`; the generator exposes the board at
`/sports-research/`. No separate frontend hosting project is needed.

Before promoting, check `/sports-research/`, the Worker odds endpoint
`/api/college-football/odds`, and an event's AI summary button. Confirm the
response's `fetchedAt`, freshness label, sportsbook market values, and
disclaimers. If the feed is absent, check the scheduled workflow run and
Cloudflare Worker logs. Do not publish an unconfigured page expecting it to
load: it deliberately shows an actionable configuration error while the
placeholder remains.

## Local checks

With Node.js 24 installed:

```sh
node scripts/test-college-sports.mjs
node scripts/test-sports-tools.mjs
node scripts/validate-site.mjs
node scripts/generate-redirects.mjs
```

The tests use only local fixtures and mocked Worker bindings; no paid API key,
Cloudflare account, or deployment is required to run them. The live feed and
Workers AI summary require the account configuration above.

## Official references

- [The Odds API v4 guide](https://the-odds-api.com/liveapi/guides/v4/)
- [Cloudflare Workers AI bindings](https://developers.cloudflare.com/workers-ai/configuration/bindings/)
- [Workers AI model catalog](https://developers.cloudflare.com/workers-ai/models/)
- [Cloudflare Worker rate limiting](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)
- [Wrangler configuration](https://developers.cloudflare.com/workers/wrangler/configuration/)
