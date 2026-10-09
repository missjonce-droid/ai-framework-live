interface Outcome {
  name: string;
  price: number;
  point?: number;
}

interface Market {
  lastUpdate: string;
  outcomes: Outcome[];
}

interface Bookmaker {
  key: string;
  title: string;
  lastUpdate: string;
  markets: Record<string, Market>;
}

interface EventRecord {
  eventId: string;
  commenceTime: string;
  homeTeam: string;
  awayTeam: string;
  bookmakers: Bookmaker[];
}

interface SportsFeed {
  schemaVersion: 1;
  sport: "americanfootball_ncaaf";
  source: "The Odds API v4";
  fetchedAt: string;
  markets: string[];
  regions: string[];
  events: EventRecord[];
}

interface KVNamespace {
  get(key: string, type: "text"): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

interface RateLimiter {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

interface AI {
  run(
    model: string,
    input: {
      messages: Array<{ role: "system" | "user"; content: string }>;
      max_tokens: number;
      temperature: number;
    },
  ): Promise<unknown>;
}

interface Env {
  SPORTS_DATA: KVNamespace;
  AI: AI;
  MARKET_RATE_LIMITER: RateLimiter;
  SUMMARY_RATE_LIMITER: RateLimiter;
  INGEST_RATE_LIMITER: RateLimiter;
  SPORTS_INGEST_TOKEN: string;
}

const MODEL = "@cf/meta/llama-3.1-8b-instruct";
const FEED_KEY = "college-football:latest";
const SPORT_KEY = "americanfootball_ncaaf";
const MAX_INGEST_BYTES = 850_000;
const MAX_STORED_BYTES = 900_000;
const MAX_EVENTS = 150;
const MAX_BOOKMAKERS = 25;
const MAX_OUTCOMES = 4;
const MAX_SUMMARY_BYTES = 4_000;
const MAX_FEED_AGE_SECONDS = 12 * 60 * 60;
const ALLOWED_ORIGINS = new Set([
  "https://ai-framework.io",
  "https://www.ai-framework.io",
]);
const ALLOWED_MARKETS = new Set(["h2h", "spreads", "totals"]);

class RequestBodyError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function responseHeaders(origin: string | null): Headers {
  const headers = new Headers({
    "cache-control": "no-store",
    "content-type": "application/json; charset=utf-8",
    "referrer-policy": "no-referrer",
    "x-content-type-options": "nosniff",
    vary: "Origin",
  });
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers.set("access-control-allow-origin", origin);
    headers.set("access-control-allow-methods", "GET, POST, OPTIONS");
    headers.set("access-control-allow-headers", "Content-Type, Authorization");
    headers.set("access-control-max-age", "600");
  }
  return headers;
}

function jsonResponse(status: number, body: unknown, origin: string | null): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: responseHeaders(origin),
  });
}

function plainResponse(status: number, origin: string | null): Response {
  return new Response(null, { status, headers: responseHeaders(origin) });
}

function clientKey(request: Request, scope: string): string {
  const ip = request.headers.get("cf-connecting-ip") || "unknown-client";
  return `${scope}:${ip.slice(0, 64)}`;
}

async function allowedByRateLimit(
  limiter: RateLimiter,
  key: string,
): Promise<boolean> {
  return (await limiter.limit({ key })).success;
}

function cleanText(value: unknown, label: string, maxLength: number): string {
  if (typeof value !== "string") throw new Error(`Invalid ${label}.`);
  const clean = value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!clean || clean.length > maxLength) throw new Error(`Invalid ${label}.`);
  return clean;
}

function validDate(value: unknown, label: string): string {
  const date = cleanText(value, label, 40);
  if (!Number.isFinite(Date.parse(date))) throw new Error(`Invalid ${label}.`);
  return date;
}

function americanProbability(price: number): number {
  const magnitude = Math.abs(price);
  return price > 0 ? 100 / (magnitude + 100) : magnitude / (magnitude + 100);
}

function validateFeed(value: unknown): SportsFeed {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Expected a feed object.");
  }
  const raw = value as Record<string, unknown>;
  if (raw.schemaVersion !== 1 || raw.sport !== SPORT_KEY || raw.source !== "The Odds API v4") {
    throw new Error("Unsupported feed schema, sport, or source.");
  }
  const fetchedAt = validDate(raw.fetchedAt, "feed timestamp");
  if (!Array.isArray(raw.events) || raw.events.length > MAX_EVENTS) {
    throw new Error(`The feed may contain at most ${MAX_EVENTS} events.`);
  }
  if (!Array.isArray(raw.markets) || raw.markets.some((market) => !ALLOWED_MARKETS.has(String(market)))) {
    throw new Error("The feed has unsupported markets.");
  }
  const eventIds = new Set<string>();
  const events = raw.events.map((eventValue) => {
    if (!eventValue || typeof eventValue !== "object" || Array.isArray(eventValue)) {
      throw new Error("Invalid event record.");
    }
    const event = eventValue as Record<string, unknown>;
    const eventId = cleanText(event.eventId, "event id", 80);
    if (!/^[A-Za-z0-9_-]+$/.test(eventId) || eventIds.has(eventId)) {
      throw new Error("Invalid or duplicate event id.");
    }
    eventIds.add(eventId);
    const homeTeam = cleanText(event.homeTeam, "home team", 80);
    const awayTeam = cleanText(event.awayTeam, "away team", 80);
    if (homeTeam.toLowerCase() === awayTeam.toLowerCase()) {
      throw new Error("An event must contain two different teams.");
    }
    if (!Array.isArray(event.bookmakers) || event.bookmakers.length > MAX_BOOKMAKERS) {
      throw new Error(`An event may contain at most ${MAX_BOOKMAKERS} bookmakers.`);
    }
    const bookmakerKeys = new Set<string>();
    const bookmakers = event.bookmakers.map((bookmakerValue) => {
      if (!bookmakerValue || typeof bookmakerValue !== "object" || Array.isArray(bookmakerValue)) {
        throw new Error("Invalid bookmaker record.");
      }
      const bookmaker = bookmakerValue as Record<string, unknown>;
      const key = cleanText(bookmaker.key, "bookmaker key", 80);
      if (!/^[A-Za-z0-9_-]+$/.test(key) || bookmakerKeys.has(key)) {
        throw new Error("Invalid or duplicate bookmaker key.");
      }
      bookmakerKeys.add(key);
      if (!bookmaker.markets || typeof bookmaker.markets !== "object" || Array.isArray(bookmaker.markets)) {
        throw new Error("Invalid bookmaker markets.");
      }
      const markets: Record<string, Market> = {};
      for (const [marketKey, marketValue] of Object.entries(bookmaker.markets)) {
        if (!ALLOWED_MARKETS.has(marketKey)) throw new Error("Unsupported odds market.");
        if (!marketValue || typeof marketValue !== "object" || Array.isArray(marketValue)) {
          throw new Error("Invalid market record.");
        }
        const market = marketValue as Record<string, unknown>;
        if (!Array.isArray(market.outcomes) || market.outcomes.length < 2 || market.outcomes.length > MAX_OUTCOMES) {
          throw new Error("Invalid market outcomes.");
        }
        const names = new Set<string>();
        const outcomes = market.outcomes.map((outcomeValue) => {
          if (!outcomeValue || typeof outcomeValue !== "object" || Array.isArray(outcomeValue)) {
            throw new Error("Invalid market outcome.");
          }
          const outcome = outcomeValue as Record<string, unknown>;
          const name = cleanText(outcome.name, "outcome name", 80);
          if (names.has(name)) throw new Error("Duplicate market outcome.");
          names.add(name);
          const price = outcome.price;
          if (typeof price !== "number" || !Number.isSafeInteger(price) || price === 0 || Math.abs(price) > 100_000) {
            throw new Error("Invalid American odds price.");
          }
          const normalized: Outcome = { name, price };
          if (marketKey !== "h2h") {
            if (typeof outcome.point !== "number" || !Number.isFinite(outcome.point) || Math.abs(outcome.point) > 1_000) {
              throw new Error("Invalid market point.");
            }
            normalized.point = outcome.point;
          }
          if (marketKey === "h2h" && name !== homeTeam && name !== awayTeam) {
            throw new Error("Moneyline outcome does not match the event teams.");
          }
          return normalized;
        });
        markets[marketKey] = {
          lastUpdate: validDate(market.lastUpdate, "market update timestamp"),
          outcomes,
        };
      }
      return {
        key,
        title: cleanText(bookmaker.title, "bookmaker title", 100),
        lastUpdate: validDate(bookmaker.lastUpdate, "bookmaker update timestamp"),
        markets,
      };
    });
    return {
      eventId,
      commenceTime: validDate(event.commenceTime, "event start time"),
      homeTeam,
      awayTeam,
      bookmakers,
    };
  });
  return {
    schemaVersion: 1,
    sport: SPORT_KEY,
    source: "The Odds API v4",
    fetchedAt,
    markets: [...new Set((raw.markets as unknown[]).map(String))],
    regions: ["us"],
    events,
  };
}

async function readBoundedJson(request: Request, limit: number): Promise<unknown> {
  const contentType = request.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
  if (contentType !== "application/json") {
    throw new RequestBodyError("Content-Type must be application/json.", 415);
  }
  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > limit) throw new RequestBodyError("Request body is too large.", 413);
  const bytes = await request.arrayBuffer();
  if (bytes.byteLength > limit) throw new RequestBodyError("Request body is too large.", 413);
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new RequestBodyError("Send valid JSON.", 400);
  }
}

async function digest(value: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
}

async function tokensMatch(received: string, expected: string): Promise<boolean> {
  if (!received || !expected || received.length > 2_048) return false;
  const [left, right] = await Promise.all([digest(received), digest(expected)]);
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left[index] ^ right[index];
  }
  return difference === 0;
}

function ageSeconds(timestamp: string): number {
  return Math.max(0, Math.floor((Date.now() - Date.parse(timestamp)) / 1_000));
}

function impliedPercent(price: number): number {
  return Number(americanProbability(price).toFixed(4));
}

function average(values: number[]): number | null {
  if (!values.length) return null;
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2));
}

function summarizeMarket(event: EventRecord, marketKey: string) {
  const marketRows = event.bookmakers.flatMap((bookmaker) => {
    const market = bookmaker.markets[marketKey];
    return market ? [{ bookmaker: bookmaker.title, outcomes: market.outcomes }] : [];
  });
  const overrounds = marketRows.map(
    ({ outcomes }) => outcomes.reduce((sum, outcome) => sum + americanProbability(outcome.price), 0) * 100 - 100,
  );
  const averageBookOverroundPercent = average(overrounds);

  if (marketKey === "h2h") {
    const names = [event.homeTeam, event.awayTeam];
    const outcomes = names.map((name) => {
      const probabilities = marketRows.flatMap(({ outcomes: entries }) => {
        const outcome = entries.find((entry) => entry.name === name);
        return outcome ? [americanProbability(outcome.price) * 100] : [];
      });
      return {
        name,
        averageImpliedPercent: average(probabilities),
        bookmakerCount: probabilities.length,
      };
    });
    const booksWithBothSides = marketRows.filter(({ outcomes: entries }) =>
      names.every((name) => entries.some((entry) => entry.name === name)),
    ).length;
    return { bookmakerCount: booksWithBothSides, averageBookOverroundPercent, outcomes };
  }

  const names = marketKey === "spreads" ? [event.homeTeam, event.awayTeam] : ["Over", "Under"];
  const outcomes = names.map((name) => {
    const points: number[] = [];
    const probabilities: number[] = [];
    for (const { outcomes: entries } of marketRows) {
      const outcome = entries.find((entry) => entry.name === name);
      if (!outcome) continue;
      points.push(outcome.point as number);
      probabilities.push(americanProbability(outcome.price) * 100);
    }
    return {
      name,
      averageMarketPoint: average(points),
      averageImpliedPercent: average(probabilities),
      bookmakerCount: points.length,
    };
  });
  return { bookmakerCount: marketRows.length, averageBookOverroundPercent, outcomes };
}

function eventMarkets(event: EventRecord) {
  return {
    h2h: summarizeMarket(event, "h2h"),
    spreads: summarizeMarket(event, "spreads"),
    totals: summarizeMarket(event, "totals"),
  };
}

async function publicOdds(request: Request, env: Env, origin: string | null): Promise<Response> {
  if (request.method !== "GET") return jsonResponse(405, { error: "Method not allowed." }, origin);
  if (!(await allowedByRateLimit(env.MARKET_RATE_LIMITER, clientKey(request, "markets")))) {
    return jsonResponse(429, { error: "Market data request limit reached. Try again shortly." }, origin);
  }
  const raw = await env.SPORTS_DATA.get(FEED_KEY, "text");
  if (!raw) {
    return jsonResponse(503, { error: "No odds feed has been ingested yet.", code: "feed_unavailable" }, origin);
  }
  let feed: SportsFeed;
  try {
    feed = validateFeed(JSON.parse(raw));
  } catch {
    return jsonResponse(503, { error: "The stored odds feed is invalid; ingest a fresh feed.", code: "feed_invalid" }, origin);
  }
  const age = ageSeconds(feed.fetchedAt);
  return jsonResponse(200, {
    mode: "bookmaker-market-data",
    source: feed.source,
    sport: feed.sport,
    markets: feed.markets,
    regions: feed.regions,
    fetchedAt: feed.fetchedAt,
    ageSeconds: age,
    freshness: age <= MAX_FEED_AGE_SECONDS ? "current" : "stale",
    staleAfterSeconds: MAX_FEED_AGE_SECONDS,
    events: feed.events.map((event) => ({
      ...event,
      consensus: eventMarkets(event),
    })),
    notice:
      "Market prices and averages come from the listed US sportsbook feeds. Implied percentages are derived from those prices and include bookmaker margin (vig); they are not independently calibrated win probabilities or betting advice. No team-statistics feed is connected.",
  }, origin);
}

async function aiSummary(request: Request, env: Env, origin: string | null): Promise<Response> {
  if (request.method !== "GET") return jsonResponse(405, { error: "Method not allowed." }, origin);
  const url = new URL(request.url);
  const eventId = url.searchParams.get("eventId") || "";
  if (!/^[A-Za-z0-9_-]{1,80}$/.test(eventId)) {
    return jsonResponse(400, { error: "Provide a valid eventId query parameter." }, origin);
  }
  if (!(await allowedByRateLimit(env.SUMMARY_RATE_LIMITER, clientKey(request, "summary")))) {
    return jsonResponse(429, { error: "AI summary limit reached. Try again shortly." }, origin);
  }
  const stored = await env.SPORTS_DATA.get(FEED_KEY, "text");
  if (!stored) return jsonResponse(503, { error: "No odds feed has been ingested yet." }, origin);
  let feed: SportsFeed;
  try {
    feed = validateFeed(JSON.parse(stored));
  } catch {
    return jsonResponse(503, { error: "The stored odds feed is invalid." }, origin);
  }
  const event = feed.events.find((candidate) => candidate.eventId === eventId);
  if (!event) return jsonResponse(404, { error: "That event is not in the latest odds feed." }, origin);

  const cacheKey = `summary:${eventId}:${encodeURIComponent(feed.fetchedAt)}`;
  const cached = await env.SPORTS_DATA.get(cacheKey, "text");
  if (cached) {
    try {
      return jsonResponse(200, JSON.parse(cached), origin);
    } catch {
      // A malformed cached summary is replaced below.
    }
  }

  const consensus = eventMarkets(event);
  const marketContext = {
    eventStartTime: event.commenceTime,
    source: feed.source,
    marketConsensus: {
      moneyline: {
        bookmakerCount: consensus.h2h.bookmakerCount,
        averageBookOverroundPercent: consensus.h2h.averageBookOverroundPercent,
        outcomes: consensus.h2h.outcomes.map((outcome, index) => ({
          side: index === 0 ? "home" : "away",
          averageImpliedPercent: outcome.averageImpliedPercent,
          bookmakerCount: outcome.bookmakerCount,
        })),
      },
      spreads: {
        bookmakerCount: consensus.spreads.bookmakerCount,
        averageBookOverroundPercent: consensus.spreads.averageBookOverroundPercent,
        outcomes: consensus.spreads.outcomes.map((outcome, index) => ({
          side: index === 0 ? "home" : "away",
          averageMarketPoint: outcome.averageMarketPoint,
          averageImpliedPercent: outcome.averageImpliedPercent,
          bookmakerCount: outcome.bookmakerCount,
        })),
      },
      totals: {
        bookmakerCount: consensus.totals.bookmakerCount,
        averageBookOverroundPercent: consensus.totals.averageBookOverroundPercent,
        outcomes: consensus.totals.outcomes.map((outcome, index) => ({
          side: index === 0 ? "over" : "under",
          averageMarketPoint: outcome.averageMarketPoint,
          averageImpliedPercent: outcome.averageImpliedPercent,
          bookmakerCount: outcome.bookmakerCount,
        })),
      },
    },
  };
  const prompt = [
    "Write two short, neutral sentences describing only the supplied current college-football sportsbook-market aggregates.",
    "Do not name teams or bookmakers, output numeric percentages, or add any facts that are not in the data. Describe only that current market snapshot and how many books contribute.",
    "Do not make outcome claims, produce analysis beyond the market aggregates, or recommend any action.",
    JSON.stringify(marketContext),
  ].join("\n\n");
  let aiResult: unknown;
  try {
    aiResult = await env.AI.run(MODEL, {
      messages: [
        {
          role: "system",
          content:
            "Write only a neutral plain-language summary of the numerical sportsbook-market aggregates supplied by the user message. Do not introduce facts, names, numbers, or recommendations.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 180,
      temperature: 0.1,
    });
  } catch (error) {
    console.error(
      "Workers AI summary request failed:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return jsonResponse(502, { error: "Cloudflare Workers AI could not create a market summary." }, origin);
  }
  const rawSummary =
    typeof aiResult === "string"
      ? aiResult
      : aiResult && typeof aiResult === "object" && "response" in aiResult
        ? String((aiResult as { response: unknown }).response || "")
        : "";
  const summary = rawSummary.replace(/\s+/g, " ").trim().slice(0, 800);
  if (!summary) return jsonResponse(502, { error: "Workers AI returned an empty market summary." }, origin);
  if (
    /\b(?:predict(?:ion|ed|s|ing)?|forecast(?:s|ed|ing)?|project(?:ed|ion|s|ing)?|winner|will win|pick(?:s)?|wager(?:s|ed|ing)?|betting advice|score|probabilit(?:y|ies)|true chance|chance|likely|favorite|favourite|underdog)\b|\b\d+(?:\.\d+)?\s*%/i.test(
      summary,
    )
  ) {
    return jsonResponse(502, {
      error: "Generated text did not meet the market-context-only safety checks.",
    }, origin);
  }

  const result = {
    mode: "ai-market-context-summary",
    model: MODEL,
    source: feed.source,
    eventId,
    fetchedAt: feed.fetchedAt,
    summary,
    notice:
      "AI-generated context about the supplied bookmaker snapshot only. It is not a statistically validated forecast, score projection, prediction, or betting advice. Market-implied percentages include vig.",
  };
  const encoded = JSON.stringify(result);
  if (new TextEncoder().encode(encoded).byteLength <= MAX_SUMMARY_BYTES) {
    await env.SPORTS_DATA.put(cacheKey, encoded, { expirationTtl: 30 * 60 });
  }
  return jsonResponse(200, result, origin);
}

async function ingest(request: Request, env: Env, origin: string | null): Promise<Response> {
  if (request.method !== "POST") return jsonResponse(405, { error: "Method not allowed." }, origin);
  const authorization = request.headers.get("authorization") || "";
  const receivedToken = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!(await tokensMatch(receivedToken, env.SPORTS_INGEST_TOKEN || ""))) {
    return jsonResponse(401, { error: "Unauthorized ingest request." }, origin);
  }
  if (!(await allowedByRateLimit(env.INGEST_RATE_LIMITER, "authorized-ingest"))) {
    return jsonResponse(429, { error: "Ingest rate limit reached." }, origin);
  }
  let rawFeed: unknown;
  try {
    rawFeed = await readBoundedJson(request, MAX_INGEST_BYTES);
  } catch (error) {
    const status = error instanceof RequestBodyError ? error.status : 400;
    return jsonResponse(status, { error: error instanceof Error ? error.message : "Invalid request body." }, origin);
  }
  let feed: SportsFeed;
  try {
    feed = validateFeed(rawFeed);
  } catch (error) {
    return jsonResponse(400, { error: error instanceof Error ? error.message : "Invalid feed." }, origin);
  }
  const encoded = JSON.stringify(feed);
  if (new TextEncoder().encode(encoded).byteLength > MAX_STORED_BYTES) {
    return jsonResponse(413, { error: "Normalized odds feed exceeds the storage size limit." }, origin);
  }
  await env.SPORTS_DATA.put(FEED_KEY, encoded, { expirationTtl: 7 * 24 * 60 * 60 });
  return jsonResponse(200, {
    ok: true,
    sport: feed.sport,
    fetchedAt: feed.fetchedAt,
    eventCount: feed.events.length,
  }, origin);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get("origin");
    if (origin && !ALLOWED_ORIGINS.has(origin)) {
      return jsonResponse(403, { error: "Origin is not allowed." }, null);
    }
    if (request.method === "OPTIONS") {
      if (!origin || !ALLOWED_ORIGINS.has(origin)) {
        return jsonResponse(403, { error: "Origin is not allowed." }, null);
      }
      return plainResponse(204, origin);
    }

    const url = new URL(request.url);
    try {
      if (url.pathname === "/internal/college-football/ingest") {
        return await ingest(request, env, origin);
      }
      if (url.pathname === "/api/college-football/odds") {
        return await publicOdds(request, env, origin);
      }
      if (url.pathname === "/api/college-football/summary") {
        return await aiSummary(request, env, origin);
      }
      return jsonResponse(404, { error: "Not found." }, origin);
    } catch (error) {
      console.error(
        "Sports Worker request failed:",
        error instanceof Error ? error.message : "Unknown error",
      );
      return jsonResponse(500, { error: "Sports service failed to process the request." }, origin);
    }
  },
};
