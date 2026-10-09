const SPORTS = new Set(["NFL", "NBA", "MLB", "NHL", "Soccer", "Other"]);
const MAX_TEAM_LENGTH = 60;
const MAX_AMERICAN_ODDS = 100000;

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "allow": "POST",
      "cache-control": "no-store",
      "content-type": "application/json; charset=utf-8",
    },
  });
}

function readText(value, label, maxLength) {
  if (typeof value !== "string") {
    throw new Error(`${label} must be text.`);
  }
  const text = value.trim();
  if (!text) throw new Error(`${label} is required.`);
  if (text.length > maxLength) {
    throw new Error(`${label} must be ${maxLength} characters or fewer.`);
  }
  return text;
}

function readAmericanOdds(value, label) {
  const odds =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number(value)
        : NaN;

  if (
    !Number.isSafeInteger(odds) ||
    odds === 0 ||
    Math.abs(odds) > MAX_AMERICAN_ODDS
  ) {
    throw new Error(`${label} must be a non-zero whole number from -100000 to 100000.`);
  }
  return odds;
}

function convertOdds(americanOdds) {
  const magnitude = Math.abs(americanOdds);
  const impliedProbability =
    americanOdds > 0
      ? 100 / (magnitude + 100)
      : magnitude / (magnitude + 100);
  const decimalOdds =
    americanOdds > 0 ? 1 + magnitude / 100 : 1 + 100 / magnitude;

  return {
    americanOdds,
    impliedProbabilityPercent: Number((impliedProbability * 100).toFixed(2)),
    decimalOdds: Number(decimalOdds.toFixed(3)),
  };
}

export async function onRequest({ request }) {
  if (request.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed." });
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 8192) {
    return jsonResponse(413, { error: "Request is too large." });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse(400, { error: "Send a valid JSON request." });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return jsonResponse(400, { error: "Send a matchup object." });
  }

  try {
    const sport = readText(body.sport, "Sport", 20);
    if (!SPORTS.has(sport)) {
      return jsonResponse(400, {
        error: "Choose NFL, NBA, MLB, NHL, Soccer, or Other.",
      });
    }
    const firstTeam = readText(body.firstTeam, "First team", MAX_TEAM_LENGTH);
    const secondTeam = readText(body.secondTeam, "Second team", MAX_TEAM_LENGTH);
    if (firstTeam.toLocaleLowerCase() === secondTeam.toLocaleLowerCase()) {
      return jsonResponse(400, { error: "Enter two different teams." });
    }

    const first = convertOdds(readAmericanOdds(body.firstOdds, "First team's odds"));
    const second = convertOdds(readAmericanOdds(body.secondOdds, "Second team's odds"));

    return jsonResponse(200, {
      mode: "user-input-calculation",
      source: "user-provided American odds",
      modelOutput: null,
      sportsData: null,
      matchup: { sport, firstTeam, secondTeam },
      calculations: { first, second },
      notice:
        "Implied probabilities are mathematical conversions of the odds you entered, not estimates of either team's chance to win. No model, live sports data, fair line, pick, or betting advice is provided.",
    });
  } catch (error) {
    return jsonResponse(400, { error: error.message });
  }
}
