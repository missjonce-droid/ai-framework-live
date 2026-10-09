import assert from "node:assert/strict";
import fs from "node:fs";
import { runSportsFetch } from "../data-fetcher/index.js";
import worker from "../worker/src/index.ts";

const fetchedAt = "2026-10-08T18:00:00.000Z";
const providerFixture = [
  {
    id: "event_123",
    commence_time: "2026-10-10T20:00:00Z",
    home_team: "Home University",
    away_team: "Away College",
    bookmakers: [
      {
        key: "book_a",
        title: "Book A",
        last_update: "2026-10-08T17:50:00Z",
        markets: [
          {
            key: "h2h",
            last_update: "2026-10-08T17:50:00Z",
            outcomes: [
              { name: "Home University", price: -110 },
              { name: "Away College", price: 100 },
            ],
          },
          {
            key: "spreads",
            last_update: "2026-10-08T17:50:00Z",
            outcomes: [
              { name: "Home University", price: -110, point: -3.5 },
              { name: "Away College", price: -110, point: 3.5 },
            ],
          },
          {
            key: "totals",
            last_update: "2026-10-08T17:50:00Z",
            outcomes: [
              { name: "Over", price: -110, point: 45.5 },
              { name: "Under", price: -110, point: 45.5 },
            ],
          },
        ],
      },
      {
        key: "book_b",
        title: "Book B",
        last_update: "2026-10-08T17:55:00Z",
        markets: [
          {
            key: "h2h",
            last_update: "2026-10-08T17:55:00Z",
            outcomes: [
              { name: "Home University", price: -105 },
              { name: "Away College", price: -105 },
            ],
          },
          {
            key: "spreads",
            last_update: "2026-10-08T17:55:00Z",
            outcomes: [
              { name: "Home University", price: -105, point: -4 },
              { name: "Away College", price: -115, point: 4 },
            ],
          },
          {
            key: "totals",
            last_update: "2026-10-08T17:55:00Z",
            outcomes: [
              { name: "Over", price: -105, point: 46 },
              { name: "Under", price: -115, point: 46 },
            ],
          },
        ],
      },
    ],
  },
];

const values = new Map();
const rateCalls = [];
let marketAllowed = true;
let summaryAllowed = true;
let ingestAllowed = true;
let aiCalls = 0;
const env = {
  SPORTS_INGEST_TOKEN: "private-ingest-token",
  SPORTS_DATA: {
    async get(key) {
      return values.get(key) ?? null;
    },
    async put(key, value, options) {
      values.set(key, value);
      assert.ok(options.expirationTtl > 0);
    },
  },
  AI: {
    async run(model, input) {
      aiCalls += 1;
      assert.equal(model, "@cf/meta/llama-3.1-8b-instruct");
      assert.equal(input.max_tokens, 180);
      const aiInput = input.messages.map((message) => message.content).join("\n");
      assert.ok(aiInput.includes("Do not name teams or bookmakers"));
      assert.equal(aiInput.includes("Home University"), false);
      assert.equal(aiInput.includes("Book A"), false);
      return { response: "The listed moneyline prices differ modestly across the two supplied books." };
    },
  },
  MARKET_RATE_LIMITER: {
    async limit({ key }) {
      rateCalls.push(["market", key]);
      return { success: marketAllowed };
    },
  },
  SUMMARY_RATE_LIMITER: {
    async limit({ key }) {
      rateCalls.push(["summary", key]);
      return { success: summaryAllowed };
    },
  },
  INGEST_RATE_LIMITER: {
    async limit({ key }) {
      rateCalls.push(["ingest", key]);
      return { success: ingestAllowed };
    },
  },
};

async function request(path, { method = "GET", body, headers = {} } = {}) {
  return worker.fetch(
    new Request(`https://sports.example.workers.dev${path}`, {
      method,
      headers: body === undefined ? headers : { "content-type": "application/json", ...headers },
      body,
    }),
    env,
  );
}

const acceptedOrigins = [
  "https://ai-framework.io",
  "https://www.ai-framework.io",
];
assert.equal((await request("/api/college-football/odds", {
  headers: { origin: "https://evil.example" },
})).status, 403);
for (const origin of acceptedOrigins) {
  const preflight = await request("/api/college-football/odds", {
    method: "OPTIONS",
    headers: { origin },
  });
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get("access-control-allow-origin"), origin);
}
assert.equal((await request("/not-found")).status, 404);

let apiUrl;
let ingestionBody;
let receivedAuthorization;
const fetcherResult = await runSportsFetch(
  {
    ODDS_API_KEY: "provider-secret",
    SPORTS_INGEST_TOKEN: "private-ingest-token",
    SPORTS_INGEST_URL: "https://sports-research-api.account.workers.dev/internal/college-football/ingest",
  },
  async (input, options = {}) => {
    const url = new URL(input);
    if (url.hostname === "api.the-odds-api.com") {
      apiUrl = url;
      return new Response(JSON.stringify(providerFixture), {
        status: 200,
        headers: {
          "content-type": "application/json",
          "x-requests-remaining": "100",
          "x-requests-used": "3",
        },
      });
    }
    ingestionBody = options.body;
    receivedAuthorization = options.headers.authorization;
    return request("/internal/college-football/ingest", {
      method: options.method,
      body: options.body,
      headers: options.headers,
    });
  },
  () => new Date(fetchedAt),
);

assert.equal(apiUrl.searchParams.get("apiKey"), "provider-secret");
assert.equal(apiUrl.searchParams.get("regions"), "us");
assert.equal(apiUrl.searchParams.get("markets"), "h2h,spreads,totals");
assert.equal(apiUrl.searchParams.get("oddsFormat"), "american");
assert.equal(apiUrl.searchParams.get("dateFormat"), "iso");
assert.equal(receivedAuthorization, "Bearer private-ingest-token");
assert.equal(ingestionBody.includes("provider-secret"), false);
assert.equal(fetcherResult.eventCount, 1);
assert.equal(fetcherResult.bookmakerEventCount, 2);
assert.equal(fetcherResult.requestsRemaining, "100");

const publicResponse = await request("/api/college-football/odds", {
  headers: { origin: "https://ai-framework.io", "cf-connecting-ip": "203.0.113.10" },
});
assert.equal(publicResponse.status, 200);
const publicData = await publicResponse.json();
assert.equal(publicData.mode, "bookmaker-market-data");
assert.equal(publicData.source, "The Odds API v4");
assert.equal(publicData.freshness, "current");
assert.equal(publicData.events.length, 1);
assert.equal(publicData.events[0].consensus.h2h.bookmakerCount, 2);
assert.ok(Math.abs(publicData.events[0].consensus.h2h.outcomes[0].averageImpliedPercent - 51.8) < 0.02);
assert.ok(publicData.events[0].consensus.h2h.averageBookOverroundPercent > 2);
assert.equal(publicData.events[0].consensus.spreads.outcomes[0].averageMarketPoint, -3.75);
assert.equal(publicData.events[0].consensus.totals.outcomes[0].averageMarketPoint, 45.75);
assert.ok(publicData.notice.includes("include bookmaker margin"));
assert.equal(publicResponse.headers.get("access-control-allow-origin"), "https://ai-framework.io");

const summaryUrl = "/api/college-football/summary?eventId=event_123";
const summaryResponse = await request(summaryUrl, {
  headers: { origin: "https://www.ai-framework.io", "cf-connecting-ip": "203.0.113.11" },
});
assert.equal(summaryResponse.status, 200);
const summary = await summaryResponse.json();
assert.equal(summary.model, "@cf/meta/llama-3.1-8b-instruct");
assert.ok(summary.notice.includes("not a statistically validated forecast"));
assert.ok(summary.summary.includes("prices differ"));
assert.equal(aiCalls, 1);
assert.equal((await request(summaryUrl)).status, 200);
assert.equal(aiCalls, 1, "identical feed summaries should use the KV cache");
marketAllowed = false;
assert.equal((await request("/api/college-football/odds")).status, 429);
marketAllowed = true;
summaryAllowed = false;
assert.equal((await request(summaryUrl)).status, 429);
summaryAllowed = true;
const unsafeFeed = JSON.parse(values.get("college-football:latest"));
unsafeFeed.fetchedAt = "2026-10-08T18:01:00.000Z";
values.set("college-football:latest", JSON.stringify(unsafeFeed));
env.AI.run = async () => ({ response: "The home team has a 60% chance to win." });
const unsafeSummary = await request(summaryUrl);
assert.equal(unsafeSummary.status, 502, "unsafe forecast-like AI text must not be published");
env.AI.run = async () => ({ response: "The current price range differs moderately among contributing books." });
ingestAllowed = false;
assert.equal((await request("/internal/college-football/ingest", {
  method: "POST",
  body: ingestionBody,
  headers: { authorization: `Bearer ${env.SPORTS_INGEST_TOKEN}` },
})).status, 429);
ingestAllowed = true;
assert.equal((await request("/internal/college-football/ingest", {
  method: "POST",
  body: "{}",
  headers: {
    authorization: `Bearer ${env.SPORTS_INGEST_TOKEN}`,
    "content-type": "text/plain",
  },
})).status, 415);

assert.equal((await request("/internal/college-football/ingest", {
  method: "POST",
  body: JSON.stringify({}),
  headers: { authorization: "Bearer wrong-token" },
})).status, 401);
assert.equal((await request("/internal/college-football/ingest", {
  method: "POST",
  body: "{}",
  headers: {
    authorization: "Bearer private-ingest-token",
    "content-length": "900000",
  },
})).status, 413);
assert.equal((await request("/api/college-football/summary?eventId=../../bad")).status, 400);
assert.equal((await request("/api/college-football/summary?eventId=unknown")).status, 404);
assert.ok(rateCalls.some(([scope]) => scope === "market"));
assert.ok(rateCalls.some(([scope]) => scope === "summary"));
assert.ok(rateCalls.some(([scope]) => scope === "ingest"));

await assert.rejects(
  runSportsFetch(
    {
      ODDS_API_KEY: "key",
      SPORTS_INGEST_TOKEN: "token",
      SPORTS_INGEST_URL: "https://attacker.example/internal/college-football/ingest",
    },
    async () => {
      throw new Error("must not fetch");
    },
  ),
  /workers\.dev/,
);
await assert.rejects(
  runSportsFetch(
    {
      ODDS_API_KEY: "key",
      SPORTS_INGEST_TOKEN: "token",
      SPORTS_INGEST_URL: "https://sports-research-api.account.workers.dev/internal/college-football/ingest",
    },
    async () =>
      new Response("provider rejected key", {
        status: 401,
        headers: { "content-type": "text/plain" },
      }),
  ),
  /The Odds API returned HTTP 401/,
);

const frontend = fs.readFileSync(new URL("../frontend/index.html", import.meta.url), "utf8");
const frontendScript = frontend.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(frontendScript);
assert.doesNotThrow(() => new Function(frontendScript[1]));
const workflow = fs.readFileSync(new URL("../.github/workflows/fetch-sports-data.yml", import.meta.url), "utf8");
assert.ok(workflow.includes('cron: "0 */6 * * *"'));
assert.ok(workflow.includes("workflow_dispatch:"));
assert.ok(workflow.includes("secrets.ODDS_API_KEY"));
assert.ok(workflow.includes("secrets.SPORTS_INGEST_TOKEN"));
const wrangler = fs.readFileSync(new URL("../wrangler.toml", import.meta.url), "utf8");
assert.ok(wrangler.includes('name = "sports-research-api"'));
assert.ok(wrangler.includes('binding = "SPORTS_DATA"'));
assert.ok(wrangler.includes('namespace_id = "941001"'));

console.log("College sports ingestion, Worker API, CORS, limits, and frontend tests passed.");
