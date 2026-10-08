(function () {
  "use strict";

  var SAVED_TOOLS_KEY = "ai_fw_saved_tools";
  var SAVED_FRAMEWORK_KEY = "ai_fw_saved_framework";

  var frameworks = {
    content: {
      title: "Creator Content Engine",
      outcome:
        "Turn one researched idea into written, visual, voice, and short-form content without rebuilding the process every time.",
      costs: {
        free: "$0–$20/month to start",
        lean: "$20–$60/month",
        pro: "$80–$200/month",
      },
      tools: [
        {
          name: "ChatGPT",
          slug: "chatgpt",
          role: "Research, outlines, hooks, scripts, repurposing, and quality checks.",
        },
        {
          name: "Canva Magic Design",
          slug: "canva-magic-design",
          role: "Turn the approved concept into branded graphics, thumbnails, and carousels.",
        },
        {
          name: "CapCut AI",
          slug: "capcut-ai",
          role: "Edit short videos, generate captions, and reuse consistent templates.",
        },
        {
          name: "ElevenLabs",
          slug: "elevenlabs",
          role: "Create natural voiceover when you do not want to record every piece yourself.",
        },
      ],
      workflow: [
        "Use ChatGPT to turn one audience problem into a researched outline, five hooks, and one master script.",
        "Approve the facts and voice before generating any assets.",
        "Create a reusable visual template in Canva and a reusable editing template in CapCut.",
        "Generate the voiceover, assemble the short video, and export platform-specific versions.",
        "Track saves, watch time, clicks, and inquiries; reuse only the formats that produce a real response.",
      ],
    },
    automation: {
      title: "Small-Business Automation Framework",
      outcome:
        "Capture leads, answer routine questions, and move work forward automatically while keeping a human approval point.",
      costs: {
        free: "$0–$30/month to test",
        lean: "$30–$100/month",
        pro: "$150–$500+/month",
      },
      tools: [
        {
          name: "ChatGPT",
          slug: "chatgpt",
          role: "Draft responses, classify requests, summarize records, and create decision rules.",
        },
        {
          name: "Make",
          slug: "make-com",
          role: "Connect forms, email, spreadsheets, CRMs, and notifications in one visual workflow.",
        },
        {
          name: "Zapier AI Agents",
          slug: "zapier-ai-agents",
          role: "Handle repeatable multi-step tasks across common business applications.",
        },
        {
          name: "Airtable AI",
          slug: "airtable-ai",
          role: "Store structured leads, statuses, approvals, and performance data.",
        },
      ],
      workflow: [
        "Choose one repetitive process with a clear beginning and end, such as new-lead intake.",
        "Map the trigger, required information, decision rules, human approval, and final action.",
        "Store every lead and status change in one structured table.",
        "Use AI only for drafting or classification; keep payment, legal, and high-risk decisions human-approved.",
        "Run ten test cases, document failures, then turn the automation on for a small percentage of real work.",
      ],
    },
    research: {
      title: "Evidence-First Research Framework",
      outcome:
        "Move from a broad question to a source-backed brief with fewer unsupported claims and less tab overload.",
      costs: {
        free: "$0/month to start",
        lean: "$20–$50/month",
        pro: "$60–$150/month",
      },
      tools: [
        {
          name: "Perplexity",
          slug: "perplexity",
          role: "Find current sources, competing explanations, and the vocabulary used by experts.",
        },
        {
          name: "NotebookLM",
          slug: "notebooklm",
          role: "Work only from the documents you select and connect themes across them.",
        },
        {
          name: "Consensus",
          slug: "consensus",
          role: "Search scientific literature and identify the direction and strength of evidence.",
        },
        {
          name: "Elicit",
          slug: "elicit",
          role: "Organize research questions, papers, evidence tables, and literature-review notes.",
        },
      ],
      workflow: [
        "Write the decision you need to make—not merely the topic you want to search.",
        "Use Perplexity to identify terminology, recent sources, and opposing viewpoints.",
        "Move the strongest primary sources into NotebookLM and ask questions only against that source set.",
        "Use Consensus or Elicit when the answer depends on scientific evidence.",
        "Create a short brief separating verified facts, reasonable inferences, open questions, and next actions.",
      ],
    },
    website: {
      title: "Launch-Ready Website Framework",
      outcome:
        "Go from an offer and rough content to a working site with analytics, conversion tracking, and a maintainable update process.",
      costs: {
        free: "$0–$25/month to test",
        lean: "$25–$75/month",
        pro: "$100–$300/month",
      },
      tools: [
        {
          name: "ChatGPT",
          slug: "chatgpt",
          role: "Clarify the offer, page structure, objections, calls to action, and SEO briefs.",
        },
        {
          name: "Lovable",
          slug: "lovable",
          role: "Generate and iterate on a working web application from a clear specification.",
        },
        {
          name: "Bolt.new",
          slug: "bolt-new",
          role: "Build or repair application code and connect common services quickly.",
        },
        {
          name: "Framer AI",
          slug: "framer-ai",
          role: "Create a fast no-code marketing page when a full application is unnecessary.",
        },
      ],
      workflow: [
        "Define one audience, one expensive problem, and one primary conversion before choosing a layout.",
        "Write the complete first-page content and acceptance criteria before generating the site.",
        "Build the smallest version that proves the offer and works properly on a phone.",
        "Connect analytics to meaningful actions such as inquiries, purchases, saves, and outbound tool clicks.",
        "Publish, review recordings and conversion data, and change only the sections that are losing visitors.",
      ],
    },
    video: {
      title: "AI Video Production Framework",
      outcome:
        "Produce repeatable short videos with a consistent visual identity instead of creating every asset from scratch.",
      costs: {
        free: "$0–$20/month to test",
        lean: "$30–$90/month",
        pro: "$100–$300/month",
      },
      tools: [
        {
          name: "ChatGPT",
          slug: "chatgpt",
          role: "Create the concept, hook, shot list, script, captions, and publishing variations.",
        },
        {
          name: "Runway",
          slug: "runway",
          role: "Generate or transform visual shots and fill gaps that cannot be filmed economically.",
        },
        {
          name: "ElevenLabs",
          slug: "elevenlabs",
          role: "Produce controlled voiceover and multilingual audio versions.",
        },
        {
          name: "CapCut AI",
          slug: "capcut-ai",
          role: "Assemble footage, captions, audio, pacing, and reusable platform templates.",
        },
      ],
      workflow: [
        "Begin with a one-sentence viewer promise and a three-second opening hook.",
        "Write the script and shot list together so every spoken line has a visual purpose.",
        "Generate only the shots you cannot film or license more efficiently.",
        "Edit one master version, then create platform-specific openings, captions, and lengths.",
        "Measure completion rate and rewatches before spending more on volume.",
      ],
    },
    music: {
      title: "AI Music Release Framework",
      outcome:
        "Develop a consistent musical identity, create release-ready assets, and publish without losing track of rights or source files.",
      costs: {
        free: "$0–$20/month to test",
        lean: "$20–$60/month",
        pro: "$80–$200/month",
      },
      tools: [
        {
          name: "Suno",
          slug: "suno",
          role: "Explore complete song ideas, arrangements, genre combinations, and vocal directions.",
        },
        {
          name: "Udio",
          slug: "udio",
          role: "Create alternate musical concepts and compare arrangement quality.",
        },
        {
          name: "ElevenLabs",
          slug: "elevenlabs",
          role: "Create spoken intros, narrative elements, and permitted voice assets.",
        },
        {
          name: "LALAL.AI",
          slug: "lalal-ai",
          role: "Separate stems for editing, cleanup, arrangement work, and remix preparation.",
        },
      ],
      workflow: [
        "Write a short sonic identity describing voice, tempo, instrumentation, emotion, and what to avoid.",
        "Generate several short concepts before extending a full song.",
        "Save prompts, versions, stems, artwork sources, and licensing terms in one release folder.",
        "Edit the strongest arrangement and verify that every voice, sample, and visual can be used commercially.",
        "Release small batches, compare saves and repeat listening, and develop the direction people remember.",
      ],
    },
    sales: {
      title: "B2B Lead and Outreach Framework",
      outcome:
        "Identify qualified prospects, enrich the right information, and send relevant outreach without turning the system into spam.",
      costs: {
        free: "$0–$30/month to test",
        lean: "$50–$150/month",
        pro: "$200–$700+/month",
      },
      tools: [
        {
          name: "Apollo.io",
          slug: "apollo-io",
          role: "Build a focused prospect list using company and role criteria.",
        },
        {
          name: "Clay",
          slug: "clay",
          role: "Enrich records, research relevant signals, and personalize from verified information.",
        },
        {
          name: "ChatGPT",
          slug: "chatgpt",
          role: "Turn verified signals into concise outreach and qualification notes.",
        },
        {
          name: "Smartlead",
          slug: "smartlead",
          role: "Manage sending, inbox rotation, follow-up logic, and campaign reporting.",
        },
      ],
      workflow: [
        "Define a narrow ideal customer profile and a business problem you can credibly solve.",
        "Build a small test list and verify the records before enrichment or outreach.",
        "Use Clay to find one relevant, supportable reason for contacting each account.",
        "Generate short outreach that explains the problem, evidence, and next step without fabricated personalization.",
        "Stop weak campaigns quickly; optimize for positive replies and qualified meetings, not raw sending volume.",
      ],
    },
    local: {
      title: "Local Business Growth Framework",
      outcome:
        "Turn one local business offer into a repeatable lead, follow-up, review, and content system.",
      costs: {
        free: "$0–$25/month to test",
        lean: "$30–$100/month",
        pro: "$150–$450/month",
      },
      tools: [
        {
          name: "ChatGPT",
          slug: "chatgpt",
          role: "Create service FAQs, follow-up drafts, local content briefs, and staff-ready templates.",
        },
        {
          name: "Canva Magic Design",
          slug: "canva-magic-design",
          role: "Create consistent local offers, before-and-after graphics, and review posts.",
        },
        {
          name: "Make",
          slug: "make-com",
          role: "Connect forms, lead alerts, follow-ups, review requests, and tracking sheets.",
        },
        {
          name: "Google Business Profile",
          slug: "google-business-profile",
          role: "Capture local discovery, calls, directions, reviews, updates, and service details.",
        },
      ],
      workflow: [
        "Choose one high-value service and one service area rather than advertising everything at once.",
        "Make the landing page, Google profile, offers, and follow-up language consistent.",
        "Connect new inquiries to an immediate alert and a human-reviewed response sequence.",
        "Request reviews only from real customers after a completed service and make responding easy.",
        "Track calls, booked jobs, close rate, and repeat business by source every month.",
      ],
    },
  };

  var state = {
    goal: null,
    budget: "lean",
    skill: "comfortable",
  };

  function query(selector, parent) {
    return (parent || document).querySelector(selector);
  }

  function queryAll(selector, parent) {
    return Array.prototype.slice.call(
      (parent || document).querySelectorAll(selector),
    );
  }

  function getSavedTools() {
    try {
      var value = JSON.parse(localStorage.getItem(SAVED_TOOLS_KEY) || "[]");
      return Array.isArray(value) ? value : [];
    } catch (error) {
      return [];
    }
  }

  function renderSavedTools() {
    var list = query("#saved-tools");
    var empty = query("#saved-empty");
    var saved = getSavedTools();
    list.innerHTML = "";

    empty.hidden = saved.length > 0;
    saved.slice(0, 8).forEach(function (tool) {
      var item = document.createElement("li");
      var link = document.createElement("a");
      link.href = "/tool/" + encodeURIComponent(tool.slug);
      link.textContent = tool.name || tool.slug;
      item.appendChild(link);
      list.appendChild(item);
    });
  }

  function setStep(step) {
    queryAll(".fb-step").forEach(function (panel) {
      panel.hidden = Number(panel.getAttribute("data-step")) !== step;
    });
    queryAll(".fb-progress span").forEach(function (bar, index) {
      bar.classList.toggle("is-active", index < step);
    });
    query(".fb-builder").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function selectChoice(group, value) {
    state[group] = value;
    queryAll('[data-group="' + group + '"]').forEach(function (button) {
      var selected = button.getAttribute("data-value") === value;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    if (group === "goal") {
      query("#goal-next").disabled = !state.goal;
    }
  }

  function updateAddressBar() {
    var params = new URLSearchParams(window.location.search);
    params.set("goal", state.goal);
    params.set("budget", state.budget);
    params.set("skill", state.skill);
    history.replaceState(
      null,
      "",
      window.location.pathname + "?" + params.toString(),
    );
  }

  function renderResult() {
    var framework = frameworks[state.goal];
    if (!framework) return;

    query("#result-title").textContent = framework.title;
    query("#result-outcome").textContent = framework.outcome;
    query("#result-cost").textContent = framework.costs[state.budget];

    var tools = query("#result-tools");
    tools.innerHTML = "";
    framework.tools.forEach(function (tool, index) {
      var card = document.createElement("article");
      card.className = "fb-tool";

      var number = document.createElement("div");
      number.className = "fb-tool-number";
      number.textContent = String(index + 1);

      var copy = document.createElement("div");
      var name = document.createElement("strong");
      name.textContent = tool.name;
      var role = document.createElement("span");
      role.textContent = tool.role;
      copy.appendChild(name);
      copy.appendChild(role);

      var link = document.createElement("a");
      link.href = "/tool/" + tool.slug;
      link.textContent = "View tool →";

      card.appendChild(number);
      card.appendChild(copy);
      card.appendChild(link);
      tools.appendChild(card);
    });

    var workflow = query("#result-workflow");
    workflow.innerHTML = "";
    framework.workflow.forEach(function (step) {
      var item = document.createElement("li");
      var copy = document.createElement("span");
      copy.textContent = step;
      item.appendChild(copy);
      workflow.appendChild(item);
    });

    var skillNotes = {
      beginner:
        "Start with the first two tools and complete the workflow manually once before adding automation.",
      comfortable:
        "Build one reusable template at each handoff, then automate only the steps that behave consistently.",
      technical:
        "Add structured inputs, logging, version control, and failure alerts before scaling the workflow.",
    };
    query("#skill-note").textContent = skillNotes[state.skill];

    updateAddressBar();
    localStorage.setItem(
      SAVED_FRAMEWORK_KEY,
      JSON.stringify({
        goal: state.goal,
        budget: state.budget,
        skill: state.skill,
        title: framework.title,
        savedAt: new Date().toISOString(),
      }),
    );

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "framework_generated",
      framework_goal: state.goal,
      framework_budget: state.budget,
      framework_skill: state.skill,
    });
    setStep(3);
  }

  function shareFramework() {
    var framework = frameworks[state.goal];
    var shareData = {
      title: framework.title + " | AI Framework",
      text: "Here is the AI tool stack and workflow I built with AI Framework.",
      url: window.location.href,
    };

    if (navigator.share) {
      navigator.share(shareData).catch(function () {});
      return;
    }

    navigator.clipboard
      .writeText(window.location.href)
      .then(function () {
        showStatus("Framework link copied.");
      })
      .catch(function () {
        showStatus("Your shareable framework link is ready in the address bar.");
      });
  }

  function showStatus(message) {
    var status = query("#builder-status");
    status.textContent = message;
    status.classList.add("is-visible");
    window.setTimeout(function () {
      status.classList.remove("is-visible");
    }, 3500);
  }

  function readInitialState() {
    var params = new URLSearchParams(window.location.search);
    var goal = params.get("goal");
    var budget = params.get("budget");
    var skill = params.get("skill");

    if (frameworks[goal]) state.goal = goal;
    if (["free", "lean", "pro"].indexOf(budget) >= 0) state.budget = budget;
    if (["beginner", "comfortable", "technical"].indexOf(skill) >= 0)
      state.skill = skill;

    selectChoice("budget", state.budget);
    selectChoice("skill", state.skill);

    if (state.goal) {
      selectChoice("goal", state.goal);
      renderResult();
    }

    var sourceTool = params.get("tool");
    if (sourceTool) {
      var notice = query("#source-tool");
      var title = sourceTool
        .split("-")
        .map(function (part) {
          return part.charAt(0).toUpperCase() + part.slice(1);
        })
        .join(" ");
      var saved = getSavedTools().find(function (tool) {
        return tool.slug === sourceTool;
      });
      notice.textContent =
        "Starting point: " +
        (saved && saved.name ? saved.name : title) +
        ". Choose the result you want, and use this tool as the first option to evaluate.";
      notice.classList.add("is-visible");
    }
  }

  queryAll("[data-group]").forEach(function (button) {
    button.addEventListener("click", function () {
      selectChoice(
        button.getAttribute("data-group"),
        button.getAttribute("data-value"),
      );
    });
  });

  query("#goal-next").addEventListener("click", function () {
    if (state.goal) setStep(2);
  });
  query("#details-back").addEventListener("click", function () {
    setStep(1);
  });
  query("#generate-framework").addEventListener("click", renderResult);
  query("#result-back").addEventListener("click", function () {
    setStep(2);
  });
  query("#start-over").addEventListener("click", function () {
    state.goal = null;
    selectChoice("goal", "");
    query("#goal-next").disabled = true;
    history.replaceState(null, "", window.location.pathname);
    setStep(1);
  });
  query("#share-framework").addEventListener("click", shareFramework);
  query("#print-framework").addEventListener("click", function () {
    window.print();
  });

  renderSavedTools();
  readInitialState();
})();
