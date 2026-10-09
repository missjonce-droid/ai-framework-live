import assert from "node:assert/strict";
import fs from "node:fs";
import { onRequest as matchupRequest } from "../functions/api/sports-matchup.js";
import { onRequest as oddsRequest } from "../functions/api/american-odds.js";

async function invoke(handler, method, body, headers = {}) {
  const request = new Request("https://example.test/api/test", {
    method,
    headers: body === undefined ? headers : { "content-type": "application/json", ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const response = await handler({ request });
  return { response, body: await response.json() };
}

const preview = await invoke(matchupRequest, "POST", {
  sport: "NBA",
  homeTeam: "Aces",
  awayTeam: "Comets",
  date: "2026-10-08",
  homeNotes: "Home notes",
  awayNotes: "",
});
assert.equal(preview.response.status, 200);
assert.equal(preview.body.mode, "illustrative-demo");
assert.equal(preview.body.matchup.homeTeam, "Aces");
assert.equal(preview.body.modelOutput, null);
assert.equal(preview.body.forecast, null);
assert.equal(preview.body.bettingOdds, null);
assert.equal((await invoke(matchupRequest, "GET")).response.status, 405);
assert.equal(
  (await invoke(matchupRequest, "POST", {
    sport: "NBA",
    homeTeam: "Aces",
    awayTeam: "aces",
  })).response.status,
  400,
);
assert.equal(
  (await invoke(matchupRequest, "POST", {
    sport: "NBA",
    homeTeam: "Aces",
    awayTeam: "Comets",
    date: "2026-02-30",
  })).response.status,
  400,
);

const converted = await invoke(oddsRequest, "POST", {
  sport: "NBA",
  firstTeam: "Aces",
  secondTeam: "Comets",
  firstOdds: -110,
  secondOdds: 150,
});
assert.equal(converted.response.status, 200);
assert.equal(converted.body.mode, "user-input-calculation");
assert.equal(converted.body.source, "user-provided American odds");
assert.equal(converted.body.modelOutput, null);
assert.equal(converted.body.sportsData, null);
assert.equal(converted.body.calculations.first.impliedProbabilityPercent, 52.38);
assert.equal(converted.body.calculations.first.decimalOdds, 1.909);
assert.equal(converted.body.calculations.second.impliedProbabilityPercent, 40);
assert.equal(converted.body.calculations.second.decimalOdds, 2.5);
assert.equal((await invoke(oddsRequest, "GET")).response.status, 405);
for (const odds of [0, -1.5, 100001, "not odds"]) {
  assert.equal(
    (await invoke(oddsRequest, "POST", {
      sport: "NBA",
      firstTeam: "Aces",
      secondTeam: "Comets",
      firstOdds: odds,
      secondOdds: 150,
    })).response.status,
    400,
  );
}
assert.equal(
  (await invoke(oddsRequest, "POST", {
    sport: "Cricket",
    firstTeam: "Aces",
    secondTeam: "Comets",
    firstOdds: -110,
    secondOdds: 150,
  })).response.status,
  400,
);

for (const page of ["sports-matchup.html", "calculator/index.html"]) {
  const html = fs.readFileSync(new URL(`../${page}`, import.meta.url), "utf8");
  const inlineScript = html.match(/<script>([\s\S]*?)<\/script>/);
  assert.ok(inlineScript, `${page} must include its page script.`);
  assert.doesNotThrow(() => new Function(inlineScript[1]), `${page} script must parse.`);
}

console.log("Sports tool tests passed.");
