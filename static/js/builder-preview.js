/* AI Framework — hero builder preview.
   Real client-side matching against a small curated dataset.
   This is a PREVIEW: the full builder (/build-my-framework/) goes deeper.
   Pricing notes stay generic — confirm current pricing with each provider. */
(function () {
  "use strict";

  /* Curated sample of well-known tools. Descriptions are functional and
     generic; no invented pricing, ratings, or capabilities. */
  var TOOLS = [
    { name: "ChatGPT", cat: "Ideas & writing", blurb: "A conversational starting point for brainstorming, writing, and everyday questions.", cost: "Free tier available", tags: ["write", "writing", "content", "brainstorm", "idea", "email", "draft", "blog", "social", "marketing", "post"] },
    { name: "Claude", cat: "Writing & analysis", blurb: "A place to work through a draft, explore an idea, or make sense of a long document.", cost: "Free tier available", tags: ["write", "writing", "analysis", "document", "draft", "research", "report", "summar", "review"] },
    { name: "Perplexity", cat: "Research & discovery", blurb: "A starting point for researching a question and following sources to learn more.", cost: "Free tier available", tags: ["research", "source", "learn", "investigat", "fact", "find"] },
    { name: "Notion", cat: "Organization", blurb: "Docs, notes, and lightweight project tracking in one workspace.", cost: "Free tier available", tags: ["organiz", "note", "project", "plan", "wiki", "track", "prospect", "crm", "list"] },
    { name: "Zapier", cat: "Automation", blurb: "Connects your apps so routine steps run themselves.", cost: "Free tier available", tags: ["automat", "workflow", "integrat", "lead", "follow", "sync", "trigger"] },
    { name: "Make", cat: "Automation", blurb: "Visual workflows that move data between your tools.", cost: "Free tier available", tags: ["automat", "workflow", "integrat", "sync"] },
    { name: "Canva", cat: "Design", blurb: "Quick graphics, decks, and social visuals without a designer.", cost: "Free tier available", tags: ["design", "social", "image", "visual", "brand", "deck", "post", "graphic"] },
    { name: "Otter.ai", cat: "Meetings", blurb: "Transcribes meetings so notes write themselves.", cost: "Free tier available", tags: ["meeting", "transcri", "note", "call"] },
    { name: "Grammarly", cat: "Writing", blurb: "Catches errors and sharpens tone in everything you write.", cost: "Free tier available", tags: ["write", "writing", "email", "proofread", "grammar", "tone"] },
    { name: "GitHub Copilot", cat: "Coding", blurb: "An AI pair programmer inside your code editor.", cost: "Paid plans", tags: ["code", "cod", "develop", "program", "software", "app", "website"] },
    { name: "Midjourney", cat: "Image generation", blurb: "Generates images from text descriptions.", cost: "Paid plans", tags: ["image", "art", "visual", "logo", "design"] },
    { name: "ElevenLabs", cat: "Voice & audio", blurb: "Lifelike voiceovers and text-to-speech.", cost: "Free tier available", tags: ["voice", "audio", "podcast", "video", "speech", "narrat"] }
  ];

  var ROLE_BOOST = {
    business: ["lead", "email", "automat", "organiz", "marketing", "sale", "follow", "client"],
    creator: ["content", "social", "video", "image", "write", "design", "blog", "post"],
    developer: ["code", "develop", "program", "software", "app", "automat", "website"],
    agency: ["lead", "content", "design", "automat", "report", "client", "project"]
  };

  var WORKFLOWS = {
    leads: {
      title: "Your starter workflow: lead follow-up system",
      steps: [
        { t: "Capture every lead in one place", d: "One list for names, source, and status — no more scattered DMs.", tool: "Notion" },
        { t: "Draft follow-ups in minutes", d: "Turn rough notes into a warm, personal message.", tool: "Claude" },
        { t: "Automate the routine touches", d: "New lead in → welcome message out, automatically.", tool: "Zapier" }
      ],
      prompt: "Write a friendly 3-sentence follow-up to a new lead who downloaded my free guide. Warm tone, one clear next step, no hype."
    },
    content: {
      title: "Your starter workflow: content engine",
      steps: [
        { t: "Brainstorm and outline", d: "Turn one idea into five angles worth posting.", tool: "ChatGPT" },
        { t: "Draft once, adapt everywhere", d: "Rewrite the core draft per platform without starting over.", tool: "Claude" },
        { t: "Create matching visuals", d: "One visual style across every post.", tool: "Canva" }
      ],
      prompt: "Give me 5 post angles on [my topic] for [my audience]. For each: hook, 3 key points, and a call to action."
    },
    research: {
      title: "Your starter workflow: research system",
      steps: [
        { t: "Gather sourced answers", d: "Ask hard questions and follow the citations.", tool: "Perplexity" },
        { t: "Synthesize into a draft", d: "Turn findings into a structured brief.", tool: "Claude" },
        { t: "Organize what you learned", d: "Keep every source linked to your notes.", tool: "Notion" }
      ],
      prompt: "Summarize the key arguments on [topic] with sources. Flag where sources disagree and what I'd need to verify."
    },
    build: {
      title: "Your starter workflow: build assistant stack",
      steps: [
        { t: "Draft with a pair programmer", d: "Generate boilerplate and untangle errors faster.", tool: "GitHub Copilot" },
        { t: "Research as you go", d: "Look up docs and patterns without losing flow.", tool: "Perplexity" },
        { t: "Document decisions", d: "Keep architecture notes where you'll find them.", tool: "Notion" }
      ],
      prompt: "Explain [concept] like I'm shipping it Friday. Include a minimal working example and the two most common mistakes."
    },
    organize: {
      title: "Your starter workflow: organization system",
      steps: [
        { t: "Centralize notes and tasks", d: "One workspace instead of five apps.", tool: "Notion" },
        { t: "Automate the busywork", d: "Move routine updates between tools automatically.", tool: "Zapier" },
        { t: "Sharpen what you write", d: "Clean drafts before they go out.", tool: "Grammarly" }
      ],
      prompt: "Turn these rough notes into a clear action list: owners, deadlines, and next steps. [paste notes]"
    },
    general: {
      title: "Your starter workflow: everyday AI stack",
      steps: [
        { t: "Start with a strong generalist", d: "One assistant for writing, ideas, and questions.", tool: "ChatGPT" },
        { t: "Add research you can trust", d: "Cited answers for anything factual.", tool: "Perplexity" },
        { t: "Keep it all organized", d: "Save what's useful where you'll find it.", tool: "Notion" }
      ],
      prompt: "Help me [goal]. First ask me 3 clarifying questions, then give me a step-by-step plan."
    }
  };

  function words(text) {
    return text.toLowerCase().split(/[^a-z]+/).filter(function (w) { return w.length > 2; });
  }

  function matchTools(goalWords, role) {
    var boosts = role && ROLE_BOOST[role] ? ROLE_BOOST[role] : [];
    var scored = TOOLS.map(function (tool) {
      var score = 0, matched = [];
      tool.tags.forEach(function (tag) {
        if (goalWords.some(function (w) { return w.indexOf(tag) === 0 || tag.indexOf(w) === 0; })) {
          score += 2; matched.push(tag);
        }
      });
      boosts.forEach(function (b) {
        if (tool.tags.indexOf(b) !== -1) { score += 1; }
      });
      return { tool: tool, score: score, matched: matched.slice(0, 3) };
    });
    scored.sort(function (a, b) { return b.score - a.score; });
    // Diversity: prefer different categories in the top 3
    var picked = [], cats = {};
    scored.forEach(function (s) {
      if (picked.length < 3 && !cats[s.tool.cat]) { picked.push(s); cats[s.tool.cat] = true; }
    });
    scored.forEach(function (s) {
      if (picked.length < 3 && picked.indexOf(s) === -1) picked.push(s);
    });
    return picked;
  }

  function detectIntent(text) {
    var t = text.toLowerCase();
    if (/(lead|sale|client|prospect|customer|follow)/.test(t)) return "leads";
    if (/(content|post|social|blog|video|newsletter|audience)/.test(t)) return "content";
    if (/(research|learn|study|investig|market)/.test(t)) return "research";
    if (/(code|cod|app|software|develop|program|website)/.test(t)) return "build";
    if (/(organiz|productiv|task|project|note|system)/.test(t)) return "organize";
    return "general";
  }

  function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function render(result) {
    var html = '<div class="bc-tools">';
    result.tools.forEach(function (t) {
      var why = t.matched.length
        ? "Fits your goal around: " + t.matched.join(", ") + "."
        : "A solid general pick for this kind of work.";
      html += '<div class="bc-tool">' +
        '<span class="t-name">' + esc(t.tool.name) + '</span><span class="t-cat">' + esc(t.tool.cat) + '</span>' +
        '<div class="t-why">' + esc(why) + " " + esc(t.tool.blurb) + '</div>' +
        '<div class="t-cost">' + esc(t.tool.cost) + " · confirm current pricing with the provider</div>" +
        "</div>";
    });
    html += "</div>";
    html += '<p style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:8px;">' + esc(result.wf.title) + "</p>";
    html += '<ol class="bc-steps">';
    result.wf.steps.forEach(function (s) {
      html += "<li><strong>" + esc(s.t) + " — " + esc(s.tool) + "</strong>" + esc(s.d) + "</li>";
    });
    html += "</ol>";
    html += '<div class="bc-prompt">Starter prompt:\n"' + esc(result.wf.prompt) + '"</div>';
    html += '<p class="bc-cost">Estimated starting cost: $0/mo — begin on free tiers; add paid plans only when you hit limits.</p>';
    html += '<a class="btn btn-secondary btn-block" href="https://ai-framework.io/build-my-framework/">Open the full builder →</a>';
    return html;
  }

  function init() {
    var goalInput = document.getElementById("bpGoal");
    var chips = document.getElementById("bpChips");
    var go = document.getElementById("bpGo");
    var out = document.getElementById("bpResult");
    var err = document.getElementById("bpError");
    if (!goalInput || !go || !out) return;

    var role = null;
    if (chips) {
      chips.addEventListener("click", function (e) {
        var btn = e.target.closest(".bc-chip");
        if (!btn) return;
        chips.querySelectorAll(".bc-chip").forEach(function (c) { c.classList.remove("active"); });
        btn.classList.add("active");
        role = btn.getAttribute("data-role");
      });
    }

    function generate() {
      var goal = goalInput.value.trim();
      if (!goal && !role) {
        err.style.display = "block";
        out.classList.remove("show");
        goalInput.focus();
        return;
      }
      err.style.display = "none";
      var text = goal || (role ? ROLE_BOOST[role].join(" ") : "");
      var result = {
        tools: matchTools(words(text), role),
        wf: WORKFLOWS[detectIntent(text)]
      };
      out.innerHTML = render(result);
      out.classList.add("show");
    }

    go.addEventListener("click", generate);
    goalInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") generate();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
