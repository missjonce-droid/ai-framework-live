const SPORTS = new Set(["NFL", "NBA", "MLB", "NHL", "Soccer", "Other"]);
const MAX_TEAM_LENGTH = 60;
const MAX_NOTES_LENGTH = 280;

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

function readText(value, label, maxLength, required = false) {
  if (typeof value !== "string") {
    if (!required && (value === undefined || value === null)) return "";
    throw new Error(`${label} must be text.`);
  }

  const text = value.trim();
  if (required && !text) throw new Error(`${label} is required.`);
  if (text.length > maxLength) {
    throw new Error(`${label} must be ${maxLength} characters or fewer.`);
  }
  return text;
}

function readDate(value) {
  const date = readText(value, "Match date", 10);
  if (!date) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("Match date must use YYYY-MM-DD.");
  }
  const parsed = new Date(`${date}T00:00:00.000Z`);
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== date
  ) {
    throw new Error("Match date must be a valid calendar date.");
  }
  return date;
}

export async function onRequest({ request }) {
  if (request.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed." });
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
    const sport = readText(body.sport, "Sport", 20, true);
    if (!SPORTS.has(sport)) {
      return jsonResponse(400, {
        error: "Choose NFL, NBA, MLB, NHL, Soccer, or Other.",
      });
    }

    const homeTeam = readText(body.homeTeam, "First team", MAX_TEAM_LENGTH, true);
    const awayTeam = readText(body.awayTeam, "Second team", MAX_TEAM_LENGTH, true);
    if (homeTeam.toLocaleLowerCase() === awayTeam.toLocaleLowerCase()) {
      return jsonResponse(400, { error: "Enter two different teams." });
    }

    return jsonResponse(200, {
      mode: "illustrative-demo",
      dataSource: null,
      modelOutput: null,
      forecast: null,
      bettingOdds: null,
      matchup: {
        sport,
        date: readDate(body.date),
        homeTeam,
        awayTeam,
        notes: {
          home: readText(body.homeNotes, "First team notes", MAX_NOTES_LENGTH),
          away: readText(body.awayNotes, "Second team notes", MAX_NOTES_LENGTH),
        },
      },
      notice:
        "This demo only organizes details you provide. No live sports data, predictive model, scores, probabilities, odds, picks, or betting advice are provided.",
    });
  } catch (error) {
    return jsonResponse(400, { error: error.message });
  }
}
