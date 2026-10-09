// Cloudflare Pages Function: rewrites a rough, vague prompt into a genuinely
// good one using Claude.
//
// Prompt Lab previously ran on regex intent-detection against a set of
// hand-written templates - it could only ever produce one of a fixed number
// of shapes, with the person's own words dropped into slots. This does the
// real thing: a model reads what they actually wrote and rewrites it.
//
// The old template engine is still in promptlab.html and runs as a fallback
// whenever this function is unavailable (no API key, rate limited, network
// failure), so the page never ends up with a dead button.
//
// Requires the ANTHROPIC_API_KEY Pages environment variable.
//
// Cost control: small max_tokens budget per request, plus a soft per-browser
// daily cap enforced client-side. The real backstop is the Anthropic
// account's prepaid balance with auto-reload left off.

const MODEL = "claude-sonnet-5";
const MAX_INPUT_LENGTH = 1000;

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const SYSTEM_PROMPT = `You are Prompt Lab. Someone gives you a rough, vague, or lazy request they were about to send to an AI. You rewrite it into a prompt that will actually get them a good result.

A good rewritten prompt usually does several of these, but only where they genuinely apply - do not pad it with sections that add nothing:
- Gives the model a specific role or perspective worth having
- States the actual goal, not just the surface request
- Supplies constraints: length, format, tone, audience
- Names what to avoid or what a bad answer looks like
- Uses [SQUARE BRACKETS] for details only the person can fill in

Respond with ONLY valid JSON, no other text, in exactly this shape:
{
  "detected": "Short label for what they're actually trying to do, e.g. 'Cold outreach email'",
  "prompt": "The full rewritten prompt, ready to paste. Use \\n for line breaks. Use [BRACKETS] for blanks they must fill.",
  "changes": [
    "One short sentence on a specific thing you changed and why it matters",
    "2-4 of these total"
  ]
}

Rules:
- The rewritten prompt must be usable as-is (aside from filling brackets). Never write it as advice ABOUT prompting.
- Match their domain. A prompt about roofing estimates should sound like it was written by someone who knows roofing.
- Do not invent facts about their situation. Use [BRACKETS] instead.
- Keep "changes" concrete and specific to their input - never generic prompt-writing tips.
- If the input is empty, nonsense, or not a request at all, respond with {"error": "Tell me what you're trying to get the AI to do."} instead.`;

export async function onRequest(context) {
  const request = context.request;
  const env = context.env;
  if (request.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return jsonResponse(500, { error: "Server isn't configured yet." });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse(400, { error: "Invalid request." });
  }

  const idea = (body.idea || "").trim();
  if (!idea) {
    return jsonResponse(400, { error: "Tell me what you're trying to do." });
  }
  if (idea.length > MAX_INPUT_LENGTH) {
    return jsonResponse(400, {
      error: `Keep it under ${MAX_INPUT_LENGTH} characters.`,
    });
  }

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
        max_tokens: 1200,
        system: [
          {
            type: "text",
            text: SYSTEM_PROMPT,
            cache_control: { type: "ephemeral" },
          },
        ],
        messages: [{ role: "user", content: idea }],
      }),
    });
  } catch (err) {
    return jsonResponse(502, { error: "Couldn't reach the model. Try again." });
  }

  if (!anthropicResponse.ok) {
    const errorBody = await anthropicResponse.text();
    console.error("Anthropic API error:", anthropicResponse.status, errorBody);
    return jsonResponse(502, {
      error: "Something went wrong rewriting your prompt.",
      debug: `Anthropic returned ${anthropicResponse.status}: ${errorBody.slice(0, 300)}`,
    });
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
    return jsonResponse(200, { error: parsed.error });
  }

  if (!parsed.prompt) {
    return jsonResponse(502, { error: "Couldn't build a prompt. Try rephrasing." });
  }

  return jsonResponse(200, {
    detected: parsed.detected || "Your prompt",
    prompt: parsed.prompt,
    changes: Array.isArray(parsed.changes) ? parsed.changes.slice(0, 4) : [],
  });
}
