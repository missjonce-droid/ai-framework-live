import { pathToFileURL } from "node:url";

const ODDS_API_URL =
  "https://api.the-odds-api.com/v4/sports/americanfootball_ncaaf/odds";
const SPORT_KEY = "americanfootball_ncaaf";
const MARKETS = ["h2h", "spreads", "totals"];
const REGIONS = ["us"];
const MAX_PROVIDER_BYTES = 4 * 1024 * 1024;
const MAX_EVENTS = 150;
const MAX_BOOKMAKERS_PER_EVENT = 25;
const MAX_WORKER_PAYLOAD_BYTES = 850_000;
const RETRY_DELAYS_MS = [0, 1_000, 3_000];

function requiredEnv(env, name) {
  const value = env[name]?.trim();
  if (!value) throw new Error(`Required environment variable ${name} is missing.`);
  return value;
}

function boundedText(value, field, maxLength) {
  if (typeof value !== "string") {
    throw new Error(`Odds API response has an invalid ${field}.`);
  }
  const text = value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
  if (!text || text.length > maxLength) {
    throw new Error(`Odds API response has an invalid ${field}.`);
  }
  return text;
}

function americanPrice(value, field) {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value === 0 ||
    Math.abs(value) > 100_000
  ) {
    throw new Error(`Odds API response has an invalid ${field} American price.`);
  }
  return value;
}

function boundedPoint(value, field) {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    Math.abs(value) > 1_000
  ) {
    throw new Error(`Odds API response has an invalid ${field} line.`);
  }
  return value;
}

function normalizeOutcomes(market, homeTeam, awayTeam) {
  if (!Array.isArray(market.outcomes) || market.outcomes.length < 2 || market.outcomes.length > 4) {
    throw new Error(`Odds API response has invalid ${market.key} outcomes.`);
  }
  return market.outcomes.map((outcome) => {
    const name = boundedText(outcome.name, "outcome name", 80);
    const normalized = {
      name,
      price: americanPrice(outcome.price, market.key),
    };
    if (market.key === "spreads" || market.key === "totals") {
      normalized.point = boundedPoint(outcome.point, market.key);
    }
    if (market.key === "h2h" && name !== homeTeam && name !== awayTeam) {
      throw new Error("Odds API moneyline outcome does not match its event teams.");
    }
    return normalized;
  });
}

function normalizeProviderData(raw, fetchedAt) {
  if (!Array.isArray(raw)) throw new Error("Odds API returned a non-list response.");
  if (raw.length > MAX_EVENTS) {
    throw new Error(`Odds API returned more than ${MAX_EVENTS} events; refusing a truncated ingest.`);
  }

  const events = raw.map((event) => {
    const eventId = boundedText(event.id, "event id", 80);
    if (!/^[A-Za-z0-9_-]+$/.test(eventId)) {
      throw new Error("Odds API returned an invalid event id.");
    }
    const homeTeam = boundedText(event.home_team, "home team", 80);
    const awayTeam = boundedText(event.away_team, "away team", 80);
    if (homeTeam.toLocaleLowerCase() === awayTeam.toLocaleLowerCase()) {
      throw new Error("Odds API returned duplicate event teams.");
    }
    const commenceTime = boundedText(event.commence_time, "commence time", 40);
    if (!Number.isFinite(Date.parse(commenceTime))) {
      throw new Error("Odds API returned an invalid commence time.");
    }
    if (!Array.isArray(event.bookmakers) || event.bookmakers.length > MAX_BOOKMAKERS_PER_EVENT) {
      throw new Error(
        `Odds API returned more than ${MAX_BOOKMAKERS_PER_EVENT} bookmakers for event ${eventId}; refusing a truncated ingest.`,
      );
    }

    const bookmakers = event.bookmakers.map((bookmaker) => {
      const key = boundedText(bookmaker.key, "bookmaker key", 80);
      const title = boundedText(bookmaker.title, "bookmaker title", 100);
      const lastUpdate = boundedText(bookmaker.last_update, "bookmaker update time", 40);
      if (!Number.isFinite(Date.parse(lastUpdate))) {
        throw new Error("Odds API returned an invalid bookmaker update time.");
      }
      if (!Array.isArray(bookmaker.markets)) {
        throw new Error(`Odds API returned invalid markets for ${title}.`);
      }
      const markets = {};
      for (const market of bookmaker.markets) {
        if (!MARKETS.includes(market.key) || markets[market.key]) continue;
        const marketLastUpdate = boundedText(market.last_update, "market update time", 40);
        if (!Number.isFinite(Date.parse(marketLastUpdate))) {
          throw new Error("Odds API returned an invalid market update time.");
        }
        markets[market.key] = {
          lastUpdate: marketLastUpdate,
          outcomes: normalizeOutcomes(market, homeTeam, awayTeam),
        };
      }
      return { key, title, lastUpdate, markets };
    });

    return { eventId, commenceTime, homeTeam, awayTeam, bookmakers };
  });

  return {
    schemaVersion: 1,
    sport: SPORT_KEY,
    source: "The Odds API v4",
    fetchedAt,
    markets: MARKETS,
    regions: REGIONS,
    events,
  };
}

async function readBoundedJson(response, maxBytes) {
  const declaredLength = Number(response.headers.get("content-length") || 0);
  if (declaredLength > maxBytes) {
    throw new Error(`Response exceeded the ${maxBytes}-byte size limit.`);
  }
  if (!response.body) throw new Error("Upstream returned an empty response.");

  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new Error(`Response exceeded the ${maxBytes}-byte size limit.`);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new Error("Upstream returned invalid JSON.");
  }
}

function requireWorkerUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error("SPORTS_INGEST_URL must be a valid HTTPS URL.");
  }
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/internal/college-football/ingest" ||
    !url.hostname.startsWith("sports-research-api.") ||
    !url.hostname.endsWith(".workers.dev")
  ) {
    throw new Error(
      "SPORTS_INGEST_URL must be an HTTPS workers.dev URL ending at /internal/college-football/ingest.",
    );
  }
  return url;
}

async function fetchOdds(apiKey, fetchImpl) {
  const url = new URL(`${ODDS_API_URL}/`);
  url.searchParams.set("apiKey", apiKey);
  url.searchParams.set("regions", REGIONS.join(","));
  url.searchParams.set("markets", MARKETS.join(","));
  url.searchParams.set("oddsFormat", "american");
  url.searchParams.set("dateFormat", "iso");

  let lastError;
  for (const delay of RETRY_DELAYS_MS) {
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
    let response;
    try {
      response = await fetchImpl(url, {
        headers: { accept: "application/json" },
        redirect: "error",
        signal: AbortSignal.timeout(20_000),
      });
    } catch {
      lastError = new Error("Could not reach The Odds API.");
      continue;
    }
    if (!response.ok) {
      const retryable = response.status === 429 || response.status >= 500;
      lastError = new Error(`The Odds API returned HTTP ${response.status}.`);
      if (retryable) continue;
      throw lastError;
    }
    return {
      data: await readBoundedJson(response, MAX_PROVIDER_BYTES),
      requestsRemaining: response.headers.get("x-requests-remaining"),
      requestsUsed: response.headers.get("x-requests-used"),
    };
  }
  throw lastError || new Error("Could not fetch current odds.");
}

export async function runSportsFetch(env = process.env, fetchImpl = fetch, now = () => new Date()) {
  const apiKey = requiredEnv(env, "ODDS_API_KEY");
  const token = requiredEnv(env, "SPORTS_INGEST_TOKEN");
  const ingestUrl = requireWorkerUrl(requiredEnv(env, "SPORTS_INGEST_URL"));
  const provider = await fetchOdds(apiKey, fetchImpl);
  const normalized = normalizeProviderData(provider.data, now().toISOString());
  const payload = JSON.stringify(normalized);
  if (new TextEncoder().encode(payload).byteLength > MAX_WORKER_PAYLOAD_BYTES) {
    throw new Error(`Normalized odds payload exceeds ${MAX_WORKER_PAYLOAD_BYTES} bytes.`);
  }

  let response;
  try {
    response = await fetchImpl(ingestUrl, {
      method: "POST",
      redirect: "error",
      signal: AbortSignal.timeout(20_000),
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: payload,
    });
  } catch {
    throw new Error("Could not reach the configured sports Worker ingest endpoint.");
  }
  if (!response.ok) {
    throw new Error(`Sports Worker rejected ingest with HTTP ${response.status}.`);
  }
  const result = await response.json();
  if (!result || result.ok !== true) {
    throw new Error("Sports Worker returned an invalid ingest acknowledgement.");
  }
  return {
    eventCount: normalized.events.length,
    bookmakerEventCount: normalized.events.reduce(
      (count, event) => count + event.bookmakers.length,
      0,
    ),
    requestsRemaining: provider.requestsRemaining,
    requestsUsed: provider.requestsUsed,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runSportsFetch()
    .then((result) => {
      console.log(
        `Ingested ${result.eventCount} events (${result.bookmakerEventCount} event/bookmaker records) from The Odds API.`,
      );
      if (result.requestsRemaining !== null || result.requestsUsed !== null) {
        console.log(
          `Odds API quota headers: ${result.requestsUsed ?? "unknown"} credits used; ${result.requestsRemaining ?? "unknown"} remaining.`,
        );
      }
    })
    .catch((error) => {
      console.error(`Sports odds fetch failed: ${error.message}`);
      process.exitCode = 1;
    });
}
