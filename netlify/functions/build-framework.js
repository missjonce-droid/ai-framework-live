// Netlify Function: generates a real, personalized AI tool stack from
// free-text input, grounded in AI Framework's actual tool catalog.
//
// This is the "revolutionary" version of Build My Framework — instead of
// picking from a handful of fixed templates, a real model reads what the
// visitor actually typed and reasons over the real 1,500+ tool dataset to
// build something that's never existed before.
//
// Requires the ANTHROPIC_API_KEY environment variable to be set in the
// Netlify dashboard (Site configuration -> Environment variables).
//
// Rate limited via Netlify Blobs: each visitor (identified by IP) gets a
// small number of free generations per day, since each one costs real
// money in API usage.

import { getStore } from "@netlify/blobs";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const DAILY_LIMIT = 3;
const MODEL = "claude-sonnet-5";
const MAX_INPUT_LENGTH = 600;

let catalogCache = null;
function loadCatalog() {
  if (!catalogCache) {
    const raw = readFileSync(join(__dirname, "tools-catalog.json"), "utf-8");
    catalogCache = JSON.parse(raw);
  }
  return catalogCache;
}

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function getClientId(request) {
  // Netlify sets this on every request at the edge.
  return (
    request.headers.get("x-nf-client-connection-ip") ||
    request.headers.get("x-forwarded-for") ||
    "unknown"
  );
}

async function checkAndIncrementRateLimit(clientId) {
  const store = getStore("framework-rate-limit");
  const today = new Date().toISOString().slice(0, 10);
  const key = `${clientId}:${today}`;

  const current = (await store.get(key, { type: "json" })) || { count: 0 };
  if (current.count >= DAILY_LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  current.count += 1;
  await store.setJSON(key, current, { metadata: { updated: Date.now() } });
  return { allowed: true, remaining: DAILY_LIMIT - current.count };
}

function buildSystemPrompt(catalog) {
  return `You are the AI Framework stack builder. A visitor describes their real situation in their own words. Your job is to design a specific, practical AI tool stack for exactly that situation, using ONLY tools from the catalog provided below - never invent or suggest a tool that isn't in this list.

CATALOG (name, slug, category, short description, pricing):
${JSON.stringify(catalog)}

Respond with ONLY valid JSON, no other text, in exactly this shape:
{
  "title": "Short, specific name for this stack (not generic)",
  "outcome": "One sentence describing what this stack achieves for this specific person",
  "estimated_cost": "A realistic monthly cost range, e.g. '$20-60/month'",
  "tools": [
    { "slug": "exact-slug-from-catalog", "role": "One sentence on this tool's specific job in the stack" }
  ],
  "workflow": [
    "Step 1 as a complete sentence",
    "Step 2...",
    "3-6 steps total, in the order they'd actually be done"
  ]
}

Rules:
- Pick 3-6 tools. Every slug MUST exist in the catalog above, exactly as written.
- Be specific to what the person actually described, not generic advice.
- If their budget or constraints are mentioned, respect them in tool choice and estimated_cost.
- If the input is nonsensical, empty, or not a real business/creative/personal goal, respond with {"error": "Tell me a bit more about what you're trying to do."} instead.`;
}

export default async (request, context) => {
  if (request.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return jsonResponse(500, {
      error: "Server isn't configured yet. Missing API key.",
    });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse(400, { error: "Invalid request." });
  }

  const description = (body.description || "").trim();
  if (!description) {
    return jsonResponse(400, { error: "Tell me what you're trying to do." });
  }
  if (description.length > MAX_INPUT_LENGTH) {
    return jsonResponse(400, {
      error: `Keep it under ${MAX_INPUT_LENGTH} characters.`,
    });
  }

  const clientId = getClientId(request);
  const rateLimit = await checkAndIncrementRateLimit(clientId);
  if (!rateLimit.allowed) {
    return jsonResponse(429, {
      error:
        "You've used today's free generations. Come back tomorrow, or explore the directory in the meantime.",
    });
  }

  const catalog = loadCatalog();
  const systemPrompt = buildSystemPrompt(catalog);

  let anthropicResponse;
  try {
    anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1000,
        system: [
          {
            type: "text",
            text: systemPrompt,
            cache_control: { type: "ephemeral" },
          },
        ],
        messages: [{ role: "user", content: description }],
      }),
    });
  } catch (err) {
    return jsonResponse(502, { error: "Couldn't reach the model. Try again." });
  }

  if (!anthropicResponse.ok) {
    return jsonResponse(502, { error: "Something went wrong generating your stack." });
  }

  const data = await anthropicResponse.json();
  const text = (data.content || [])
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");

  let parsed;
  try {
    const cleaned = text.replace(/^```json\s*|```\s*$/g, "").trim();
    parsed = JSON.parse(cleaned);
  } catch {
    return jsonResponse(502, { error: "Got a malformed response. Try again." });
  }

  if (parsed.error) {
    return jsonResponse(200, { error: parsed.error, remaining: rateLimit.remaining });
  }

  // Safety net: strip any hallucinated slugs that aren't actually in the catalog.
  const validSlugs = new Set(catalog.map((t) => t.slug));
  const catalogBySlug = Object.fromEntries(catalog.map((t) => [t.slug, t]));
  parsed.tools = (parsed.tools || [])
    .filter((t) => validSlugs.has(t.slug))
    .map((t) => ({
      slug: t.slug,
      name: catalogBySlug[t.slug].name,
      role: t.role,
    }));

  if (parsed.tools.length === 0) {
    return jsonResponse(502, { error: "Couldn't build a valid stack. Try rephrasing." });
  }

  return jsonResponse(200, { ...parsed, remaining: rateLimit.remaining });
};
