/* ============================================================
   AI Framework — Builder engine (Phase 3)
   Full recommendation engine: goal + role + budget + experience
   + requirements -> stack, costs, plan, prompts, workflow, next steps.
   All tool facts are generic and functional. Pricing is banded;
   exact prices must be confirmed with each provider.
   ============================================================ */
(function () {
  "use strict";

  /* ---------------- Dataset ---------------- */
  // costBand: 'free' | 'freemium' | 'paid'
  var BTOOLS = [
    { name: "ChatGPT", cat: "Ideas & writing", blurb: "A conversational starting point for brainstorming, writing, and everyday questions.", band: "freemium", tags: ["write","writing","content","brainstorm","idea","email","draft","blog","social","marketing","post","script"], setup: ["Create a free account and try 2–3 everyday tasks first.", "Save your best prompts as reusable templates.", "Move to a paid plan only when you hit usage limits."], altFree: "Claude (free tier)", altPaid: "Jasper" },
    { name: "Claude", cat: "Writing & analysis", blurb: "A place to work through a draft, explore an idea, or make sense of a long document.", band: "freemium", tags: ["write","writing","analysis","document","draft","research","report","summar","review","contract"], setup: ["Start on the free tier with one real document.", "Use projects to keep related work together.", "Upgrade when long documents become routine."], altFree: "ChatGPT (free tier)", altPaid: "Jasper" },
    { name: "Perplexity", cat: "Research & discovery", blurb: "A starting point for researching a question and following sources to learn more.", band: "freemium", tags: ["research","source","learn","investig","fact","find","market","competitor"], setup: ["Ask a question you'd normally Google.", "Follow the citations to verify anything important.", "Use threads to keep research on one topic together."], altFree: "ChatGPT", altPaid: "Perplexity Pro" },
    { name: "Notion", cat: "Organization", blurb: "Docs, notes, and lightweight project tracking in one workspace.", band: "freemium", tags: ["organiz","note","project","plan","wiki","track","task","doc","knowledge"], setup: ["Create one workspace; resist making five.", "Start with a simple tasks database.", "Add templates once the basics stick."], altFree: "Google Docs", altPaid: "Notion Plus" },
    { name: "Airtable", cat: "Data & CRM", blurb: "A spreadsheet with superpowers — track customers, content, or inventory.", band: "freemium", tags: ["data","crm","prospect","track","organiz","spreadsheet","lead","customer","inventor"], setup: ["Start from a template close to your use case.", "Define your fields before importing data.", "Add one view per workflow (e.g. Kanban for pipeline)."], altFree: "Google Sheets", altPaid: "Airtable Plus" },
    { name: "Zapier", cat: "Automation", blurb: "Connects your apps so routine steps run themselves.", band: "freemium", tags: ["automat","workflow","integrat","lead","follow","sync","trigger","repetitive"], setup: ["Connect the two apps you switch between most.", "Build one Zap for your most repetitive task.", "Test it with real data before relying on it."], altFree: "Make (free tier)", altPaid: "Zapier paid plan" },
    { name: "Make", cat: "Automation", blurb: "Visual workflows that move data between your tools.", band: "freemium", tags: ["automat","workflow","integrat","sync","api","repetitive"], setup: ["Map your process on paper first.", "Build the simplest working scenario.", "Add error handling before scaling up."], altFree: "Zapier (free tier)", altPaid: "Make paid plan" },
    { name: "Canva", cat: "Design", blurb: "Quick graphics, decks, and social visuals without a designer.", band: "freemium", tags: ["design","social","image","visual","brand","deck","post","graphic","thumbnail"], setup: ["Set up a brand kit with your colors and fonts.", "Start from a template, then customize.", "Keep a folder of reusable designs."], altFree: "Figma (free tier)", altPaid: "Adobe Express premium" },
    { name: "Figma", cat: "Design", blurb: "Design interfaces, prototypes, and collaborative mockups.", band: "freemium", tags: ["design","prototype","website","ui","ux","mockup","interface"], setup: ["Start with a community template.", "Design mobile-first if that's your audience.", "Share view links for feedback, not screenshots."], altFree: "Penpot", altPaid: "Figma Professional" },
    { name: "Midjourney", cat: "Image generation", blurb: "Generates images from text descriptions.", band: "paid", tags: ["image","art","visual","logo","design","illustrat","generat"], setup: ["Study the prompt parameters first — they matter.", "Generate variations before settling.", "Upscale only your final pick."], altFree: "Leonardo.ai (free tier)", altPaid: "Midjourney Standard" },
    { name: "Otter.ai", cat: "Meetings", blurb: "Transcribes meetings so notes write themselves.", band: "freemium", tags: ["meeting","transcri","note","call","interview"], setup: ["Connect your calendar for auto-join.", "Review the summary right after each meeting.", "Share action items the same day."], altFree: "Fireflies.ai (free tier)", altPaid: "Otter Business" },
    { name: "Grammarly", cat: "Writing", blurb: "Catches errors and sharpens tone in everything you write.", band: "freemium", tags: ["write","writing","email","proofread","grammar","tone"], setup: ["Install the browser extension.", "Set your goals (audience, formality).", "Review suggestions — don't auto-accept all."], altFree: "LanguageTool", altPaid: "Grammarly Premium" },
    { name: "GitHub Copilot", cat: "Coding", blurb: "An AI pair programmer inside your code editor.", band: "paid", tags: ["code","cod","develop","program","software","app","website","debug"], setup: ["Install the extension in your editor.", "Let it suggest; review every block.", "Use chat for explaining unfamiliar code."], altFree: "Codeium (free tier)", altPaid: "GitHub Copilot Pro" },
    { name: "ElevenLabs", cat: "Voice & audio", blurb: "Lifelike voiceovers and text-to-speech.", band: "freemium", tags: ["voice","audio","podcast","video","speech","narrat","voiceover"], setup: ["Test voices with your actual script.", "Clone conservatively — get consent.", "Start with short-form content."], altFree: "PlayHT (free tier)", altPaid: "ElevenLabs paid plan" },
    { name: "Descript", cat: "Video & audio", blurb: "Edit video and audio by editing text.", band: "freemium", tags: ["video","audio","podcast","edit","transcri","youtube"], setup: ["Import one real recording.", "Edit by deleting text — it's that literal.", "Publish one small piece end-to-end first."], altFree: "CapCut (free)", altPaid: "Descript Creator" },
    { name: "Calendly", cat: "Scheduling", blurb: "Booking links that end scheduling ping-pong.", band: "freemium", tags: ["meeting","schedul","book","client","call","appointment","sale"], setup: ["Set your real availability first.", "Add buffer time between meetings.", "Connect it to your calendar before sharing."], altFree: "Cal.com", altPaid: "Calendly paid plan" },
    { name: "Mailchimp", cat: "Email & marketing", blurb: "Email campaigns and simple automations for your audience.", band: "freemium", tags: ["email","newsletter","marketing","audience","campaign","subscriber"], setup: ["Import or build your list cleanly.", "Send one simple welcome email first.", "Add one automation (e.g. welcome series)."], altFree: "Substack", altPaid: "ConvertKit" },
    { name: "Slack", cat: "Team communication", blurb: "Team chat organized into channels.", band: "freemium", tags: ["team","communicat","collaborat","share","remote","chat"], setup: ["Create channels by topic, not by person.", "Set norms: threads for side discussions.", "Integrate your task tool for updates."], altFree: "Discord", altPaid: "Slack Pro" }
  ];

  var ROLES = {
    business: { label: "Business owner", boost: ["lead","sale","client","customer","email","automat","organiz","market","prospect","follow","book","crm"] },
    creator: { label: "Creator", boost: ["content","social","video","audio","image","design","write","blog","post","audience","podcast"] },
    developer: { label: "Developer", boost: ["code","develop","program","software","app","website","automat","api","data","debug"] },
    agency: { label: "Agency / freelancer", boost: ["client","lead","content","design","report","project","team","automat"] },
    personal: { label: "Personal productivity", boost: ["organiz","note","learn","plan","research","email","task","schedul"] }
  };

  var REQUIREMENTS = {
    automation: { label: "Automate repetitive work", desc: "Hands-off workflows between apps", boost: ["automat","workflow","integrat","sync","trigger"] },
    team: { label: "Collaborate with a team", desc: "Shared docs, chat, projects", boost: ["team","collaborat","share","communicat","project"] },
    content: { label: "Create content", desc: "Writing, social, video, visuals", boost: ["content","write","social","video","image","design","blog"] },
    research: { label: "Research & learn faster", desc: "Sourced answers, summaries", boost: ["research","source","learn","fact","summar"] },
    code: { label: "Build / code", desc: "Ship software faster", boost: ["code","develop","program","software","app","debug"] },
    design: { label: "Design visuals", desc: "Graphics, brand, prototypes", boost: ["design","image","visual","brand","logo","prototype"] },
    data: { label: "Organize data & customers", desc: "CRMs, trackers, pipelines", boost: ["data","crm","prospect","track","spreadsheet","customer"] },
    voice: { label: "Audio & voice", desc: "Podcasts, voiceovers, video", boost: ["voice","audio","podcast","video","speech"] }
  };

  var BUDGETS = {
    free: { label: "Free only", sub: "$0 — free tiers only", allowPaid: false },
    starter: { label: "Starter", sub: "Up to $50/mo", allowPaid: true },
    growth: { label: "Growth", sub: "$50–200/mo", allowPaid: true },
    scale: { label: "Scale", sub: "$200+/mo — best tools", allowPaid: true }
  };

  var EXPERIENCE = {
    beginner: "Just getting started",
    intermediate: "Comfortable with AI tools",
    advanced: "Power user"
  };

  var BAND_LABEL = { free: "Free", freemium: "Free tier + paid plans", paid: "Paid plans" };

  /* One-click starting points. Each fills goal + role + requirements;
     the user still chooses budget + experience and can edit everything. */
  var TEMPLATES = [
    { id: "lead-followup", icon: "◉", title: "Lead follow-up system",
      desc: "Capture every lead and follow up within minutes — nothing slips through.",
      goal: "I run a small business and get leads from my website and referrals. I want to follow up with every new lead within 5 minutes, send personal messages, and never drop anyone.",
      role: "business", reqs: ["automation", "data"] },
    { id: "content-engine", icon: "✦", title: "Content creation engine",
      desc: "Turn one idea a week into posts, drafts, and matching visuals.",
      goal: "I'm a creator and want to publish consistently. I want to turn one idea per week into social posts, a newsletter draft, and matching visuals without spending all weekend on it.",
      role: "creator", reqs: ["content", "design"] },
    { id: "research-brief", icon: "◎", title: "Business research briefs",
      desc: "From a hard question to a sourced, trustworthy brief.",
      goal: "I need to research competitors and market trends regularly and turn my findings into briefs I can trust and share with my team.",
      role: "business", reqs: ["research", "team"] },
    { id: "support-assistant", icon: "◈", title: "Customer support assistant",
      desc: "Answer common questions faster, keep humans on the hard ones.",
      goal: "Customers ask the same questions over and over. I want faster, consistent answers to common questions while keeping a human touch for complex issues.",
      role: "business", reqs: ["automation", "team"] },
    { id: "dev-stack", icon: "⌨", title: "Software development stack",
      desc: "Ship code faster with an AI pair programmer.",
      goal: "I'm a developer and want to ship features faster with fewer bugs — help with boilerplate, debugging, and understanding unfamiliar code.",
      role: "developer", reqs: ["code", "automation"] }
  ];

  function applyTemplate(state, tpl) {
    var next = JSON.parse(JSON.stringify(state));
    next.goal = tpl.goal;
    next.role = tpl.role;
    next.reqs = tpl.reqs.slice();
    return next;
  }

  /* ---------------- Pure logic (testable) ---------------- */

  function words(text) {
    return text.toLowerCase().split(/[^a-z]+/).filter(function (w) { return w.length > 2; });
  }

  function matchTools(goal, role, budget, reqs) {
    var gw = words(goal);
    var boosts = (ROLES[role] ? ROLES[role].boost : []).slice();
    reqs.forEach(function (r) { if (REQUIREMENTS[r]) boosts = boosts.concat(REQUIREMENTS[r].boost); });
    var allowPaid = !budget || BUDGETS[budget].allowPaid;
    var scored = [];
    BTOOLS.forEach(function (tool) {
      if (!allowPaid && tool.band === "paid") return;
      var score = 0, matched = [];
      tool.tags.forEach(function (tag) {
        if (gw.some(function (w) { return w.indexOf(tag) === 0 || tag.indexOf(w) === 0; })) {
          score += 2;
          if (matched.length < 3) matched.push(tag);
        }
      });
      boosts.forEach(function (b) { if (tool.tags.indexOf(b) !== -1) score += 1; });
      scored.push({ tool: tool, score: score, matched: matched });
    });
    scored.sort(function (a, b) { return b.score - a.score; });
    var picked = [], cats = {};
    scored.forEach(function (s) {
      if (picked.length < 4 && !cats[s.tool.cat]) { picked.push(s); cats[s.tool.cat] = true; }
    });
    scored.forEach(function (s) {
      if (picked.length < 4 && picked.indexOf(s) === -1) picked.push(s);
    });
    return picked;
  }

  function estimateCost(picks) {
    var paidCount = picks.filter(function (p) { return p.tool.band !== "free"; }).length;
    return {
      start: 0,
      roughCeiling: paidCount * 20,
      paidCount: paidCount
    };
  }

  function detectIntent(text) {
    var t = text.toLowerCase();
    if (/(lead|sale|client|prospect|customer|follow)/.test(t)) return "leads";
    if (/(content|post|social|blog|video|newsletter|audience|youtube|podcast)/.test(t)) return "content";
    if (/(research|learn|study|investig|market|competitor)/.test(t)) return "research";
    if (/(code|cod|app|software|develop|program|website|debug)/.test(t)) return "build";
    return "general";
  }

  function buildPlan(picks, experience, goal) {
    var names = picks.map(function (p) { return p.tool.name; });
    var goalBit = esc(goal.split(".")[0].slice(0, 80));
    var tip = experience === "beginner"
      ? "Give each tool one full week before judging it — the first session is always clumsy."
      : experience === "advanced"
      ? "Skip the basics: go straight to API/automation hooks and keyboard-first workflows."
      : "Time-box exploration to 30 minutes per tool, then commit.";
    return [
      { week: "Week 1", title: "Set up your core stack", items: [
        "Create accounts for <b>" + names[0] + "</b> and <b>" + names[1] + "</b> — free tiers first.",
        "Run one real task from your goal (" + goalBit + ") end-to-end.",
        tip
      ]},
      { week: "Week 2", title: "Build your first workflow", items: [
        "Connect <b>" + names[0] + "</b> → <b>" + (names[2] || names[1]) + "</b> so output flows without copy-paste.",
        "Save your 3 best prompts as templates (see below).",
        "Do the whole workflow twice; note every friction point."
      ]},
      { week: "Week 3", title: "Automate & refine", items: [
        "Automate the most repetitive step" + (names[3] ? " with <b>" + names[3] + "</b>." : "."),
        "Review: what saved time? Cut what didn't.",
        "Decide which paid plans (if any) earned their keep."
      ]}
    ];
  }

  function buildPrompts(goal, role) {
    var g = goal.length > 140 ? goal.slice(0, 140) + "…" : goal;
    return [
      { title: "Clarify the goal", use: "Use first — sharpens everything after it.", body: "I want to accomplish this: \"" + g + "\".\nAsk me 5 specific questions that will help you give me a better plan. Wait for my answers before continuing." },
      { title: "Draft the workflow", use: "Turns the goal into an actionable sequence.", body: "Act as a " + (ROLES[role] ? ROLES[role].label.toLowerCase() : "professional") + " systems consultant.\nBreak this goal into a step-by-step workflow: \"" + g + "\".\nFor each step: what to do, which kind of AI tool fits best, and what good output looks like." },
      { title: "Weekly review", use: "Keeps the system improving.", body: "Here are my notes from this week:\n[paste notes]\nSummarize: 1) what moved my goal forward, 2) open loops, 3) the top 3 priorities for next week. Be blunt." }
    ];
  }

  function buildWorkflow(picks, intent) {
    var byCat = {};
    picks.forEach(function (p) { byCat[p.tool.cat] = p.tool.name; });
    function T() {
      for (var i = 0; i < arguments.length; i++) if (byCat[arguments[i]]) return byCat[arguments[i]];
      return picks[0].tool.name;
    }
    var flows = {
      leads: [
        { t: "Capture", d: "Every new lead lands in one tracker automatically.", tool: T("Data & CRM", "Organization", "Automation") },
        { t: "Draft", d: "Turn rough context into a warm, personal follow-up.", tool: T("Writing & analysis", "Ideas & writing") },
        { t: "Automate", d: "Routine touches go out on their own; you handle the real conversations.", tool: T("Automation") }
      ],
      content: [
        { t: "Ideate", d: "Turn one topic into five angles worth publishing.", tool: T("Ideas & writing", "Writing & analysis") },
        { t: "Produce", d: "Draft once, then adapt per platform.", tool: T("Writing & analysis", "Ideas & writing") },
        { t: "Visualize", d: "Create matching visuals in the same pass.", tool: T("Design", "Image generation") }
      ],
      research: [
        { t: "Gather", d: "Ask hard questions; follow the citations.", tool: T("Research & discovery", "Ideas & writing") },
        { t: "Synthesize", d: "Turn findings into a structured brief.", tool: T("Writing & analysis") },
        { t: "Organize", d: "Keep every source linked to your notes.", tool: T("Organization", "Data & CRM") }
      ],
      build: [
        { t: "Draft code", d: "Generate boilerplate and untangle errors with a pair programmer.", tool: T("Coding") },
        { t: "Research", d: "Look up docs and patterns without losing flow.", tool: T("Research & discovery", "Ideas & writing") },
        { t: "Document", d: "Keep decisions where future-you will find them.", tool: T("Organization") }
      ],
      general: [
        { t: "Start", d: "Run your goal through a strong generalist assistant.", tool: T("Ideas & writing", "Writing & analysis") },
        { t: "Verify", d: "Check anything factual against cited sources.", tool: T("Research & discovery") },
        { t: "Systematize", d: "Save what works so it's repeatable.", tool: T("Organization", "Automation") }
      ]
    };
    return flows[intent] || flows.general;
  }

  function buildNextActions(picks) {
    var n = picks.map(function (p) { return p.tool.name; });
    return [
      "Create your free " + n[0] + " account today — not tomorrow.",
      "Run one real task from your goal through " + n[1] + ".",
      "Copy the 3 prompts below into a doc you'll actually open.",
      "Do the full workflow twice this week; note friction points.",
      "Revisit in 3 weeks: keep what saved time, cut the rest."
    ];
  }

  /* ---------------- Rendering ---------------- */

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function renderResults(state) {
    var picks = matchTools(state.goal, state.role, state.budget, state.reqs);
    var cost = estimateCost(picks);
    var intent = detectIntent(state.goal);
    var plan = buildPlan(picks, state.experience, state.goal);
    var prompts = buildPrompts(state.goal, state.role);
    var flow = buildWorkflow(picks, intent);
    var next = buildNextActions(picks);
    var roleLabel = ROLES[state.role] ? ROLES[state.role].label : "";
    var budgetLabel = BUDGETS[state.budget] ? BUDGETS[state.budget].label + " (" + BUDGETS[state.budget].sub + ")" : "";

    var h = "";

    // Summary line
    h += '<div class="result-block"><p class="r-sub" style="font-size:16px;color:var(--text);">Framework for <strong>' + esc(roleLabel) + '</strong> · Budget: <strong>' + esc(budgetLabel) + '</strong> · Experience: <strong>' + esc(EXPERIENCE[state.experience] || "") + '</strong></p></div>';

    // 1. Stack
    h += '<div class="result-block"><h2>Your AI stack</h2><p class="r-sub">Four tools matched to your goal, your budget, and your experience level. Start free; pay only when a tool earns it.</p><div class="stack-grid">';
    picks.forEach(function (p) {
      var t = p.tool;
      var why = p.matched.length
        ? "Matched to your goal on: <strong>" + esc(p.matched.join(", ")) + "</strong>."
        : "A strong general fit for " + esc(roleLabel.toLowerCase()) + " work.";
      h += '<div class="card stack-card"><div class="s-top"><span class="s-avatar">' + esc(t.name.charAt(0)) + '</span><div><h3>' + esc(t.name) + '</h3><span class="s-cat">' + esc(t.cat) + '</span></div></div>'
        + '<span class="s-cost ' + t.band + '">' + esc(BAND_LABEL[t.band]) + '</span>'
        + '<p class="s-why">' + why + " " + esc(t.blurb) + "</p>"
        + '<ol class="s-setup">' + t.setup.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ol>"
        + '<div class="s-alts"><strong>Free alternative:</strong> ' + esc(t.altFree) + '<br><strong>Paid alternative:</strong> ' + esc(t.altPaid) + "</div></div>";
    });
    h += "</div></div>";

    // 2. Cost
    h += '<div class="result-block"><h2>Estimated monthly cost</h2><p class="r-sub">Start at zero. Add paid plans only when free tiers limit you.</p><div class="cost-banner">'
      + '<div class="cost-cell"><div class="c-label">Starting cost</div><div class="c-value">$0/mo</div><div class="c-note">Begin on free tiers</div></div>'
      + '<div class="cost-cell"><div class="c-label">Rough ceiling</div><div class="c-value">~$' + cost.roughCeiling + '/mo</div><div class="c-note">If you add paid plans later</div></div>'
      + '<div class="cost-cell"><div class="c-label">Paid tools in stack</div><div class="c-value">' + cost.paidCount + " of " + picks.length + '</div><div class="c-note">The rest are free to start</div></div>'
      + '</div><p class="cost-disclaimer">Rough estimate only — pricing changes. Confirm current pricing and limits with each provider before buying.</p></div>';

    // 3. Plan
    h += '<div class="result-block"><h2>Your 3-week implementation plan</h2><p class="r-sub">Small steps, in order. Most people fail by trying everything on day one.</p><div class="plan-timeline">';
    plan.forEach(function (w) {
      h += '<div class="plan-week"><div class="w-label">' + esc(w.week) + "<br><span style='color:var(--text);font-size:14px;'>" + esc(w.title) + "</span></div><ul>"
        + w.items.map(function (i) { return "<li>" + i + "</li>"; }).join("") + "</ul></div>";
    });
    h += "</div></div>";

    // 4. Prompts
    h += '<div class="result-block"><h2>Reusable prompts</h2><p class="r-sub">Copy these into any AI assistant. They\'re written for your goal.</p>';
    prompts.forEach(function (p, i) {
      h += '<div class="card prompt-card"><div class="p-title">' + (i + 1) + ". " + esc(p.title) + '</div><div class="p-use">' + esc(p.use) + '</div><div class="prompt-body">' + esc(p.body) + '</div><button class="copy-btn" data-copy="' + i + '">Copy prompt</button></div>';
    });
    h += "</div>";

    // 5. Workflow
    h += '<div class="result-block"><h2>How your tools work together</h2><p class="r-sub">One pass through your system, start to finish.</p><div class="flow">';
    flow.forEach(function (s, i) {
      h += '<div class="flow-step"><div class="flow-num">' + (i + 1) + '</div><div class="flow-body"><h4>' + esc(s.t) + '<span class="f-tool">' + esc(s.tool) + '</span></h4><p>' + esc(s.d) + "</p></div></div>";
    });
    h += "</div></div>";

    // 6. Next actions — runnable workflow with persisted progress
    var wkey = workflowKey(state);
    var wdone = (getWF()[wkey] || {}).done || [];
    var wdoneCount = wdone.filter(Boolean).length;
    h += '<div class="result-block"><h2>Next actions</h2><p class="r-sub">Do these in order. Check them off as you go — progress is saved in this browser.</p>';
    h += '<div class="wf-head"><div class="wf-progress"><div class="wf-bar"><i id="wfBar" style="width:' + Math.round(100 * wdoneCount / next.length) + '%"></i></div><span class="wf-count" id="wfCount">' + wdoneCount + " of " + next.length + ' done</span></div><button class="btn btn-secondary btn-sm" id="wfReset" type="button">Reset</button></div>';
    h += '<ul class="next-list" id="nextList">';
    next.forEach(function (n, i) {
      h += '<li data-wi="' + i + '"' + (wdone[i] ? ' class="done"' : "") + '><span class="n-box">✓</span><span>' + esc(n) + "</span></li>";
    });
    h += "</ul></div>";

    return { html: h, picks: picks };
  }

  /* ---------------- Persistence (this browser) ---------------- */
  var LS_KEY = "af_frameworks_v1";

  function getStore() {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); }
    catch (e) { return []; }
  }
  function setStore(list) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(list)); } catch (e) {}
  }
  function makeRecord(inputs) {
    var clean = JSON.parse(JSON.stringify(inputs));
    return {
      id: Date.now(),
      ts: Date.now(),
      goal: clean.goal.length > 90 ? clean.goal.slice(0, 90) + "…" : clean.goal,
      meta: (ROLES[clean.role] ? ROLES[clean.role].label : "") + " · " + (BUDGETS[clean.budget] ? BUDGETS[clean.budget].label : ""),
      inputs: clean
    };
  }
  function deleteRecord(list, id) {
    return list.filter(function (x) { return String(x.id) !== String(id); });
  }

  /* ---------------- Workflow runner (Phase 6) ---------------- */
  var WF_KEY = "af_workflow_v1";

  function workflowKey(state) {
    var s = [state.goal, state.role, state.budget, state.experience, (state.reqs || []).slice().sort().join(",")].join("|");
    var h = 0;
    for (var i = 0; i < s.length; i++) { h = ((h << 5) - h + s.charCodeAt(i)) | 0; }
    return "wf_" + (h >>> 0).toString(36);
  }
  function getWF() {
    try { return JSON.parse(localStorage.getItem(WF_KEY) || "{}"); }
    catch (e) { return {}; }
  }
  function setWF(map) {
    try { localStorage.setItem(WF_KEY, JSON.stringify(map)); } catch (e) {}
  }
  function wfProgress(key, total) {
    var done = (getWF()[key] || {}).done || [];
    var n = 0;
    for (var i = 0; i < total; i++) if (done[i]) n++;
    return { done: n, total: total };
  }

  /* ---------------- Markdown export ---------------- */
  function mdEsc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function toMarkdown(state) {
    var picks = matchTools(state.goal, state.role, state.budget, state.reqs);
    var cost = estimateCost(picks);
    var plan = buildPlan(picks, state.experience, state.goal);
    var prompts = buildPrompts(state.goal, state.role);
    var flow = buildWorkflow(picks, detectIntent(state.goal));
    var next = buildNextActions(picks);
    var L = [];
    L.push("# My AI Framework");
    L.push("");
    L.push("_Generated " + new Date().toLocaleDateString() + " · "
      + (ROLES[state.role] ? ROLES[state.role].label : "—")
      + " · Budget: " + (BUDGETS[state.budget] ? BUDGETS[state.budget].label + " (" + BUDGETS[state.budget].sub + ")" : "—")
      + " · Experience: " + (EXPERIENCE[state.experience] || "—") + "_");
    L.push("");
    L.push("**Goal:** " + mdEsc(state.goal));
    L.push("");
    L.push("## Recommended stack");
    L.push("");
    picks.forEach(function (p, i) {
      var t = p.tool;
      L.push("### " + (i + 1) + ". " + t.name + " (" + t.cat + " — " + BAND_LABEL[t.band] + ")");
      L.push("");
      L.push(t.blurb);
      L.push("");
      L.push("Setup:");
      t.setup.forEach(function (s) { L.push("- " + s); });
      L.push("");
      L.push("Free alternative: " + t.altFree + " · Paid alternative: " + t.altPaid);
      L.push("");
    });
    L.push("## Estimated monthly cost");
    L.push("");
    L.push("- Starting cost: **$0/mo** — begin on free tiers");
    L.push("- Rough ceiling: **~$" + cost.roughCeiling + "/mo** if you add paid plans later");
    L.push("");
    L.push("_Rough estimate only — confirm current pricing with each provider before buying._");
    L.push("");
    L.push("## 3-week implementation plan");
    L.push("");
    plan.forEach(function (w) {
      L.push("### " + w.week + ": " + w.title);
      L.push("");
      w.items.forEach(function (it) { L.push("- " + it.replace(/<\/?b>/g, "**")); });
      L.push("");
    });
    L.push("## Reusable prompts");
    L.push("");
    prompts.forEach(function (p, i) {
      L.push("### " + (i + 1) + ". " + p.title + " — " + p.use);
      L.push("");
      L.push("```");
      L.push(mdEsc(p.body));
      L.push("```");
      L.push("");
    });
    L.push("## Workflow");
    L.push("");
    flow.forEach(function (s, i) {
      L.push((i + 1) + ". **" + s.t + "** (" + s.tool + ") — " + s.d);
    });
    L.push("");
    L.push("## Next actions");
    L.push("");
    next.forEach(function (n) { L.push("- [ ] " + n); });
    L.push("");
    return L.join("\n");
  }

  /* ---------------- Wizard wiring ---------------- */

  function init() {
    var step = 1;
    var state = { goal: "", role: null, budget: null, experience: null, reqs: [] };

    function panel(n) { return document.getElementById("bpanel" + n); }
    function showStep(n, skipScroll) {
      step = n;
      [1, 2, 3].forEach(function (i) { panel(i).classList.toggle("active", i === n); });
      document.querySelectorAll(".step-pill").forEach(function (el) {
        var k = parseInt(el.getAttribute("data-step"), 10);
        el.classList.toggle("active", k === n);
        el.classList.toggle("done", k < n);
      });
      if (!skipScroll) {
        var form = document.getElementById("builderForm");
        if (form && form.scrollIntoView) form.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }

    // Template cards: one click fills goal + role + requirements
    var tplGrid = document.getElementById("templateGrid");
    if (tplGrid) {
      tplGrid.innerHTML = TEMPLATES.map(function (t) {
        return '<button type="button" class="template-card" data-template="' + t.id + '">'
          + '<span class="tp-icon" aria-hidden="true">' + t.icon + "</span>"
          + '<span class="tp-title">' + t.title + "</span>"
          + '<span class="tp-desc">' + t.desc + "</span></button>";
      }).join("");
      tplGrid.addEventListener("click", function (e) {
        var btn = e.target.closest(".template-card");
        if (!btn) return;
        var tpl = TEMPLATES.filter(function (t) { return t.id === btn.getAttribute("data-template"); })[0];
        if (!tpl) return;
        state = applyTemplate(state, tpl);
        fillForm(state);
        err("");
        showStep(2);
      });
    }

    // Step 1: role chips
    document.querySelectorAll("#roleChips .pick-chip").forEach(function (c) {
      c.addEventListener("click", function () {
        document.querySelectorAll("#roleChips .pick-chip").forEach(function (x) { x.classList.remove("active"); });
        c.classList.add("active");
        state.role = c.getAttribute("data-role");
      });
    });

    // Step 2: budget + experience chips (single-select groups)
    [["#budgetChips", "budget"], ["#expChips", "experience"]].forEach(function (pair) {
      document.querySelectorAll(pair[0] + " .pick-chip").forEach(function (c) {
        c.addEventListener("click", function () {
          document.querySelectorAll(pair[0] + " .pick-chip").forEach(function (x) { x.classList.remove("active"); });
          c.classList.add("active");
          state[pair[1]] = c.getAttribute("data-val");
        });
      });
    });

    // Step 3: requirement checkboxes
    function toggleReq(card) {
      card.classList.toggle("active");
      var on = card.classList.contains("active");
      card.setAttribute("aria-checked", on ? "true" : "false");
      var v = card.getAttribute("data-req");
      var i = state.reqs.indexOf(v);
      if (i === -1) state.reqs.push(v); else state.reqs.splice(i, 1);
    }
    document.querySelectorAll("#reqGrid .check-card").forEach(function (card) {
      card.addEventListener("click", function () { toggleReq(card); });
      card.addEventListener("keydown", function (e) {
        if (e.key === " " || e.key === "Enter") { e.preventDefault(); toggleReq(card); }
      });
    });

    function err(msg) {
      var e = document.getElementById("bErr");
      e.textContent = msg;
      e.style.display = msg ? "block" : "none";
    }

    document.getElementById("toStep2").addEventListener("click", function () {
      state.goal = document.getElementById("bGoal").value.trim();
      if (state.goal.length < 10) { err("Describe your goal in a sentence or two first."); return; }
      if (!state.role) { err("Pick the option that best describes you."); return; }
      err(""); showStep(2);
    });
    document.getElementById("backTo1").addEventListener("click", function () { showStep(1); });
    document.getElementById("toStep3").addEventListener("click", function () {
      if (!state.budget) { err("Choose a budget range."); return; }
      if (!state.experience) { err("Choose your experience level."); return; }
      err(""); showStep(3);
    });
    document.getElementById("backTo2").addEventListener("click", function () { showStep(2); });

    var lastInputs = null;

    function fillForm(inputs) {
      state = JSON.parse(JSON.stringify(inputs));
      document.getElementById("bGoal").value = state.goal || "";
      document.querySelectorAll("#roleChips .pick-chip").forEach(function (c) {
        c.classList.toggle("active", c.getAttribute("data-role") === state.role);
      });
      document.querySelectorAll("#budgetChips .pick-chip").forEach(function (c) {
        c.classList.toggle("active", c.getAttribute("data-val") === state.budget);
      });
      document.querySelectorAll("#expChips .pick-chip").forEach(function (c) {
        c.classList.toggle("active", c.getAttribute("data-val") === state.experience);
      });
      document.querySelectorAll("#reqGrid .check-card").forEach(function (c) {
        var on = state.reqs.indexOf(c.getAttribute("data-req")) !== -1;
        c.classList.toggle("active", on);
        c.setAttribute("aria-checked", on ? "true" : "false");
      });
    }

    document.getElementById("generate").addEventListener("click", function () {
      lastInputs = JSON.parse(JSON.stringify(state));
      var res = renderResults(state);
      var box = document.getElementById("builderResults");
      box.innerHTML = res.html
        + '<div class="result-block"><div class="save-bar"><div class="s-info"><strong>Keep this framework</strong><span>Saved in this browser — no account needed yet.</span></div>'
        + '<div class="save-actions"><button class="btn btn-primary btn-sm" id="saveFw">Save</button>'
        + '<button class="btn btn-secondary btn-sm" id="saveCloud" style="display:none">Save to workspace</button>'
        + '<button class="btn btn-secondary btn-sm" id="exportMd">Export .md</button>'
        + '<button class="btn btn-secondary btn-sm" id="copyAll">Copy all</button>'
        + '<button class="btn btn-secondary btn-sm" id="editInputs">Edit inputs</button>'
        + '<button class="btn btn-secondary btn-sm" id="startOver">Start over</button></div></div>'
        + '<div class="saved-list" id="savedList"></div></div>';
      box.classList.add("show");

      // Copy buttons
      var bodies = box.querySelectorAll(".prompt-body");
      box.querySelectorAll(".copy-btn").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var text = bodies[parseInt(btn.getAttribute("data-copy"), 10)].textContent;
          function done() { btn.textContent = "Copied ✓"; btn.classList.add("copied"); setTimeout(function () { btn.textContent = "Copy prompt"; btn.classList.remove("copied"); }, 1600); }
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(done, done);
          } else {
            var ta = document.createElement("textarea");
            ta.value = text; document.body.appendChild(ta); ta.select();
            try { document.execCommand("copy"); } catch (e) {}
            document.body.removeChild(ta); done();
          }
        });
      });

      // Next-action checklist — persisted per framework
      (function () {
        var key = workflowKey(state);
        var total = next.length;
        function paint() {
          var p = wfProgress(key, total);
          var bar = document.getElementById("wfBar");
          var count = document.getElementById("wfCount");
          if (bar) bar.style.width = Math.round(100 * p.done / p.total) + "%";
          if (count) count.textContent = p.done + " of " + p.total + " done";
        }
        var nl = document.getElementById("nextList");
        if (nl) nl.addEventListener("click", function (e) {
          var li = e.target.closest("li");
          if (!li || li.getAttribute("data-wi") === null) return;
          var i = Number(li.getAttribute("data-wi"));
          li.classList.toggle("done");
          var map = getWF();
          var rec = map[key] || { done: [] };
          rec.done[i] = li.classList.contains("done");
          map[key] = rec;
          setWF(map);
          paint();
        });
        var rs = document.getElementById("wfReset");
        if (rs) rs.addEventListener("click", function () {
          var map = getWF();
          delete map[key];
          setWF(map);
          if (nl) nl.querySelectorAll("li.done").forEach(function (li) { li.classList.remove("done"); });
          paint();
        });
        paint();
      })();

      // Save / export / edit / saved list
      function paintSaved() {
        var list = getStore();
        var sl = document.getElementById("savedList");
        if (!list.length) { sl.innerHTML = '<p class="saved-empty">No saved frameworks yet — your first one is one click away.</p>'; return; }
        sl.innerHTML = list.map(function (s) {
          return '<div class="saved-item"><div class="si-main"><strong>' + esc(s.goal) + "</strong><span>" + esc(s.meta) + " · " + new Date(s.ts).toLocaleDateString() + '</span></div><button data-load="' + s.id + '">Load</button><button class="danger" data-del="' + s.id + '">Delete</button></div>';
        }).join("");
        sl.querySelectorAll("[data-load]").forEach(function (b) {
          b.addEventListener("click", function () {
            var s = getStore().filter(function (x) { return String(x.id) === b.getAttribute("data-load"); })[0];
            if (s) { fillForm(s.inputs); showStep(3); document.getElementById("generate").click(); }
          });
        });
        sl.querySelectorAll("[data-del]").forEach(function (b) {
          b.addEventListener("click", function () {
            setStore(deleteRecord(getStore(), b.getAttribute("data-del")));
            paintSaved();
          });
        });
      }
      document.getElementById("saveFw").addEventListener("click", function () {
        var list = getStore();
        list.unshift(makeRecord(state));
        setStore(list.slice(0, 20));
        paintSaved();
        this.textContent = "Saved ✓";
        var self = this;
        setTimeout(function () { self.textContent = "Save"; }, 1600);
      });
      // Cloud save (Phase 5): only visible when signed in; the API enforces plan limits.
      (function () {
        var sc = document.getElementById("saveCloud");
        if (!sc || !window.AFAuth) return;
        window.AFAuth.me().then(function (auth) {
          if (!auth || !auth.user) return;
          sc.style.display = "";
          sc.addEventListener("click", function () {
            var btn = this;
            btn.disabled = true;
            btn.textContent = "Saving…";
            var rec = makeRecord(state);
            fetch("/api/v1/frameworks", {
              method: "POST",
              credentials: "same-origin",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title: rec.title || ("Framework — " + String(state.goal || "").slice(0, 60)),
                input: { goal: state.goal, role: state.role, budget: state.budget, experience: state.experience, reqs: state.reqs },
                output: rec,
              }),
            })
              .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
              .then(function (res) {
                btn.textContent = res.ok ? "Saved to workspace ✓" : "Error: " + (res.j.error || "try again");
                setTimeout(function () { btn.disabled = false; btn.textContent = "Save to workspace"; }, 2200);
              })
              .catch(function () {
                btn.disabled = false;
                btn.textContent = "Save to workspace";
              });
          });
        });
      })();
      function downloadMarkdown() {
        var md = toMarkdown(state);
        var blob = new Blob([md], { type: "text/markdown" });
        var a = document.createElement("a");
        var slug = state.goal.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "framework";
        a.href = URL.createObjectURL(blob);
        a.download = "ai-framework-" + slug + ".md";
        document.body.appendChild(a);
        a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
      }
      document.getElementById("exportMd").addEventListener("click", downloadMarkdown);
      document.getElementById("copyAll").addEventListener("click", function () {
        var md = toMarkdown(state);
        var btn = this;
        function done() { btn.textContent = "Copied ✓"; setTimeout(function () { btn.textContent = "Copy all"; }, 1600); }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(md).then(done, done);
        } else {
          var ta = document.createElement("textarea");
          ta.value = md; document.body.appendChild(ta); ta.select();
          try { document.execCommand("copy"); } catch (e) {}
          document.body.removeChild(ta); done();
        }
      });
      document.getElementById("editInputs").addEventListener("click", function () {
        if (lastInputs) fillForm(lastInputs);
        box.classList.remove("show");
        showStep(1);
        document.getElementById("builderForm").scrollIntoView({ behavior: "smooth" });
      });
      document.getElementById("startOver").addEventListener("click", function () {
        box.classList.remove("show");
        document.getElementById("builderForm").scrollIntoView({ behavior: "smooth" });
        showStep(1);
      });
      paintSaved();

      box.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    showStep(1, true);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Test hook (also handy for debugging)
  window.AFBuilder = { matchTools: matchTools, estimateCost: estimateCost, detectIntent: detectIntent, buildPlan: buildPlan, buildPrompts: buildPrompts, buildWorkflow: buildWorkflow, buildNextActions: buildNextActions, renderResults: renderResults, toMarkdown: toMarkdown, applyTemplate: applyTemplate, getStore: getStore, setStore: setStore, makeRecord: makeRecord, deleteRecord: deleteRecord, workflowKey: workflowKey, getWF: getWF, setWF: setWF, wfProgress: wfProgress, BTOOLS: BTOOLS, ROLES: ROLES, TEMPLATES: TEMPLATES, REQUIREMENTS: REQUIREMENTS, BUDGETS: BUDGETS };
})();
