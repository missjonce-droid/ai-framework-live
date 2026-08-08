(function () {
  "use strict";

  var SITE = "https://ai-framework.io";
  var SAVED_KEY = "ai_fw_saved_tools";
  var SOCIAL_IMAGE = SITE + "/social-card.png";
  var PROMPT_LAB_URL = "/promptlab"; // the live route (no dash)
  var RECEIPT_URL = "/receipt";
  var NEWS_URL = "/news";

  function text(element) {
    return (element && element.textContent ? element.textContent : "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function slugToTitle(slug) {
    return (slug || "")
      .split("-")
      .filter(Boolean)
      .map(function (part) {
        return part.charAt(0).toUpperCase() + part.slice(1);
      })
      .join(" ");
  }

  function createExternalLinkIcon() {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "14");
    svg.setAttribute("height", "14");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2.5");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("aria-hidden", "true");
    svg.style.cssText = "vertical-align:-2px;margin-left:4px";

    var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6");
    svg.appendChild(path);

    var polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    polyline.setAttribute("points", "15 3 21 3 21 9");
    svg.appendChild(polyline);

    var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", "10");
    line.setAttribute("y1", "14");
    line.setAttribute("x2", "21");
    line.setAttribute("y2", "3");
    svg.appendChild(line);

    return svg;
  }

  function upsertMeta(selector, attributes) {
    var element = document.head.querySelector(selector);
    if (!element) {
      element = document.createElement("meta");
      document.head.appendChild(element);
    }
    Object.keys(attributes).forEach(function (key) {
      var value = String(attributes[key]);
      if (element.getAttribute(key) !== value) {
        element.setAttribute(key, value);
      }
    });
  }

  function upsertCanonical(url) {
    var canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    if (canonical.getAttribute("href") !== url) {
      canonical.setAttribute("href", url);
    }
  }

  function setMetadata(title, description, canonical, type) {
    if (!title || !description || !canonical) return;

    if (document.title !== title) {
      document.title = title;
    }
    upsertCanonical(canonical);
    upsertMeta('meta[name="description"]', {
      name: "description",
      content: description.slice(0, 165),
    });
    upsertMeta('meta[property="og:title"]', {
      property: "og:title",
      content: title,
    });
    upsertMeta('meta[property="og:description"]', {
      property: "og:description",
      content: description.slice(0, 200),
    });
    upsertMeta('meta[property="og:url"]', {
      property: "og:url",
      content: canonical,
    });
    upsertMeta('meta[property="og:type"]', {
      property: "og:type",
      content: type || "website",
    });
    upsertMeta('meta[property="og:image"]', {
      property: "og:image",
      content: SOCIAL_IMAGE,
    });
    upsertMeta('meta[name="twitter:title"]', {
      name: "twitter:title",
      content: title,
    });
    upsertMeta('meta[name="twitter:description"]', {
      name: "twitter:description",
      content: description.slice(0, 200),
    });
    upsertMeta('meta[name="twitter:image"]', {
      name: "twitter:image",
      content: SOCIAL_IMAGE,
    });
  }

  function improveRouteMetadata() {
    var path = window.location.pathname.replace(/\/+$/, "") || "/";
    var h1 = document.querySelector("main h1, .page-container h1, .clarity-hero h1");
    var heading = text(h1);
    var descriptionElement = document.querySelector(
      ".tool-page-desc, .hero-sub, .clarity-sub, .page-container > .muted",
    );
    var description = text(descriptionElement);

    if (path === "/") {
      setMetadata(
        "AI Framework — Find the Right AI Tools & Build a Working Stack",
        "Find the right AI tools, compare the tradeoffs, and build a practical AI stack for your exact goal. Explore 1,500+ indexed tools and step-by-step frameworks.",
        SITE + "/",
        "website",
      );
      return;
    }

    if (path.indexOf("/tool/") === 0 && heading) {
      setMetadata(
        heading + ": Features, Pricing & Alternatives | AI Framework",
        description ||
          "See what " +
            heading +
            " does, who it is best for, how it is priced, and which AI tools are its closest alternatives.",
        SITE + path,
        "article",
      );
      return;
    }

    if (path.indexOf("/category/") === 0 && heading) {
      var count = text(document.querySelector(".result-count"));
      setMetadata(
        heading + " AI Tools — Compare the Best Options | AI Framework",
        "Compare " +
          (count ? count + " in " : "") +
          heading +
          ". Filter by price, features, verification status, and use case to find the right AI tool.",
        SITE + path,
        "website",
      );
      return;
    }

    if (path.indexOf("/alternatives/") === 0 && heading) {
      setMetadata(
        heading + " | AI Framework",
        description ||
          "Compare closely related AI tools, pricing models, and capabilities before choosing the right option.",
        SITE + path,
        "article",
      );
      return;
    }

    var routeMetadata = {
      "/browse": [
        "Browse 1,500+ AI Tools by Category | AI Framework",
        "Browse the complete AI Framework directory by category, use case, price, verification status, and platform.",
      ],
      "/discover": [
        "Discover Useful, New & Under-the-Radar AI Tools | AI Framework",
        "Explore editor picks, hidden gems, beginner-friendly tools, operator stacks, and practical AI discoveries.",
      ],
      "/promptlab": [
        "Prompt Lab — Fix Your Prompt Free | AI Framework",
        "Type your rough idea and watch it become a real prompt. Free AI dictionary and word upgrades included.",
      ],
      "/submit": [
        "Submit an AI Tool for Editorial Review | AI Framework",
        "Submit an AI product, service, agent, or resource for consideration in the AI Framework directory.",
      ],
      "/contact": [
        "Contact AI Framework",
        "Contact AI Framework about corrections, partnerships, editorial questions, or custom AI framework services.",
      ],
      "/disclosure": [
        "Editorial & Affiliate Disclosure | AI Framework",
        "Learn how AI Framework reviews tools, labels sponsored placements, and uses affiliate links.",
      ],
      "/advanced": [
        "Advanced AI Tools — Legal and Responsible Use | AI Framework",
        "Browse advanced AI tools with fewer restrictions. Legal, ethical, and responsible use is required.",
      ],
    };

    if (routeMetadata[path]) {
      setMetadata(
        routeMetadata[path][0],
        routeMetadata[path][1],
        SITE + path,
        "website",
      );
    }
  }

  // Header nav: "Build My Framework" + "Prompt Lab" (friend-test fix #1 support,
  // plus the requested header nav item). One insertion each — no duplicates.
  // Site nav. Directory pages ship their own .nav-links bar; the homepage
  // and the standalone pages do not, and the compiled stylesheet also hides
  // the header pill buttons' labels under 900px - which left mobile with a
  // nearly empty header. So: use the real nav bar when one exists, and
  // otherwise build a self-contained one pinned to the top of <body>, which
  // does not depend on finding any particular container in the bundle.
  var NAV_ITEMS = [
    { href: NEWS_URL, label: "The AI Wire" },
    { href: RECEIPT_URL, label: "The Receipt" },
    { href: "/build-my-framework/", label: "Build My Framework" },
    { href: PROMPT_LAB_URL, label: "Prompt Lab" },
    { href: "/playbooks/", label: "Playbooks" },
    { href: "/browse", label: "Directory" },
  ];

  function injectNavStyles() {
    if (document.getElementById("fw-nav-css")) return;
    var style = document.createElement("style");
    style.id = "fw-nav-css";
    style.textContent =
      ".fw-nav{display:flex;flex-wrap:wrap;gap:4px;justify-content:center;" +
      "align-items:center;padding:8px 12px;border-bottom:1px solid " +
      "var(--input-border,#2a2f38);background:var(--bg,#0f1216);}" +
      ".fw-nav a{color:var(--text-muted,#8f96a3);font-size:13px;" +
      "text-decoration:none;padding:7px 11px;border-radius:4px;" +
      "white-space:nowrap;line-height:1;}" +
      ".fw-nav a:hover,.fw-nav a.active{color:var(--text,#e6e6e6);" +
      "background:var(--pill-hover,#1a1e25);}" +
      "@media(max-width:600px){.fw-nav{gap:2px;padding:6px 8px;}" +
      ".fw-nav a{font-size:12px;padding:6px 8px;}}";
    document.head.appendChild(style);
  }

  function addNavigationLinks() {
    var existing = document.querySelector(".nav-links");

    if (existing) {
      // Real nav bar present - just top up anything missing, in order.
      NAV_ITEMS.forEach(function (item, i) {
        if (existing.querySelector('a[href="' + item.href + '"]')) return;
        var a = document.createElement("a");
        a.href = item.href;
        a.textContent = item.label;
        if (window.location.pathname === item.href) a.className = "active";
        var refNode = existing.children[i] || null;
        existing.insertBefore(a, refNode);
      });
      return;
    }

    if (document.querySelector(".fw-nav")) return;
    if (!document.body) return;

    injectNavStyles();
    var nav = document.createElement("nav");
    nav.className = "fw-nav";
    nav.setAttribute("aria-label", "Main");

    NAV_ITEMS.forEach(function (item) {
      var a = document.createElement("a");
      a.href = item.href;
      a.textContent = item.label;
      if (window.location.pathname === item.href) a.className = "active";
      nav.appendChild(a);
    });

    document.body.insertBefore(nav, document.body.firstChild);
  }

  // Homepage hero: real "Build My Framework →" link (friend-test fix #1 —
  // the compiled bundle's hero has no such CTA at all, so this injects a
  // genuine <a href> rather than patching a button that doesn't exist).
  function improveHomepage() {
    if (window.location.pathname !== "/" && window.location.pathname !== "/tree")
      return;

    var hero = document.querySelector(".clarity-hero");
    if (!hero || hero.getAttribute("data-framework-updated") === "true") return;

    var title = hero.querySelector(".clarity-title");
    var subtitle = hero.querySelector(".clarity-sub");
    var actions = hero.querySelector(".clarity-actions");
    if (!title || !subtitle || !actions) return;

    hero.setAttribute("data-framework-updated", "true");
    title.textContent = "Stop guessing. Start building.";
    subtitle.textContent =
      "Tell us the result you want. AI Framework helps you find the right tools, compare the tradeoffs, and turn them into a practical step-by-step stack.";

    if (!actions.querySelector('[href="/build-my-framework/"]')) {
      var builder = document.createElement("a");
      builder.href = "/build-my-framework/";
      builder.className = "clarity-link framework-hero-link";
      builder.textContent = "Build My Framework \u2192";
      actions.insertBefore(builder, actions.firstChild);
    }

    if (!actions.querySelector('[href="' + RECEIPT_URL + '"]')) {
      var receipt = document.createElement("a");
      receipt.href = RECEIPT_URL;
      receipt.className = "clarity-link primary receipt-hero-link";
      receipt.textContent = "Get My Receipt \u2192";
      actions.insertBefore(receipt, actions.firstChild);
    }

    if (!actions.querySelector('[href="' + PROMPT_LAB_URL + '"]')) {
      var promptLab = document.createElement("a");
      promptLab.href = PROMPT_LAB_URL;
      promptLab.className = "clarity-link promptlab-hero-link";
      promptLab.textContent = "Try Prompt Lab (free)";
      var builderLink = actions.querySelector('[href="/build-my-framework/"]');
      actions.insertBefore(promptLab, builderLink ? builderLink.nextSibling : actions.firstChild);
    }

    var browse = actions.querySelector('a[href="#browse"]');
    if (browse) browse.classList.remove("primary");
  }

  // "Not sure what to type? Fix your prompt free →" under the homepage
  // search bar, linking to /promptlab.
  function addPromptLabHint() {
    if (window.location.pathname !== "/" && window.location.pathname !== "/tree")
      return;

    var search = document.querySelector(".clarity-search");
    if (!search || !search.parentNode) return;
    if (document.querySelector(".framework-promptlab-hint")) return;

    var hint = document.createElement("p");
    hint.className = "muted framework-promptlab-hint";

    var link = document.createElement("a");
    link.href = PROMPT_LAB_URL;
    link.textContent = "Fix your prompt free \u2192";

    hint.appendChild(document.createTextNode("Not sure what to type? "));
    hint.appendChild(link);
    search.parentNode.insertBefore(hint, search.nextSibling);
  }

  // Same hint, styled for the /browse search bar. Homepage is covered by
  // addPromptLabHint above, so this is scoped to /browse only to avoid
  // showing the line twice on "/".
  function addSearchHint() {
    if (window.location.pathname !== "/browse") return;

    var input = document.querySelector(
      'input[type="search"], input[placeholder*="earch"]',
    );
    if (!input) return;

    var anchorPoint = input.closest("form") || input.parentElement;
    if (!anchorPoint || anchorPoint.getAttribute("data-promptlab-hint") === "true")
      return;
    if (document.querySelector(".promptlab-search-hint")) return;

    anchorPoint.setAttribute("data-promptlab-hint", "true");
    var hint = document.createElement("div");
    hint.className = "promptlab-search-hint";
    hint.style.cssText = "margin-top:8px;font-size:14px;opacity:.85";
    hint.innerHTML =
      'Not sure what to type? <a href="' +
      PROMPT_LAB_URL +
      '" style="text-decoration:underline;text-underline-offset:3px;color:inherit">Fix your prompt free \u2192</a>';
    anchorPoint.insertAdjacentElement("afterend", hint);
  }

  // Real logos for tool cards and tool pages (friend-test follow-up: most
  // tools currently show a plain letter fallback instead of a logo). We
  // don't have permission to host 1,500+ companies' logo files ourselves,
  // so this fetches each tool's own favicon directly from its own domain
  // via Google's public favicon service, the same low-risk approach used
  // by most tool directories. If a favicon fails to load, the original
  // letter fallback is left in place untouched.
  var toolDomainsPromise = null;

  function loadToolDomains() {
    if (!toolDomainsPromise) {
      toolDomainsPromise = fetch("/static/data/tool-domains.json")
        .then(function (response) {
          return response.ok ? response.json() : {};
        })
        .catch(function () {
          return {};
        });
    }
    return toolDomainsPromise;
  }

  function slugFromLogoElement(el) {
    var link = el.closest("a[href^='/tool/']");
    if (link) {
      var match = link.getAttribute("href").match(/^\/tool\/([^/?#]+)/);
      if (match) return match[1];
    }
    var pageMatch = window.location.pathname.match(/^\/tool\/([^/]+)/);
    return pageMatch ? pageMatch[1] : null;
  }

  function addToolLogos() {
    var targets = document.querySelectorAll(
      ".tool-logo:not([data-framework-logo-checked]), .tool-page-logo:not([data-framework-logo-checked])",
    );
    if (!targets.length) return;

    loadToolDomains().then(function (domains) {
      Array.prototype.forEach.call(targets, function (el) {
        el.setAttribute("data-framework-logo-checked", "true");

        // Already has a real logo image (not our injected one) - leave it.
        var existingImg = el.querySelector("img");
        if (existingImg && !existingImg.hasAttribute("data-framework-favicon"))
          return;

        var fallback = el.querySelector("span");
        var slug = slugFromLogoElement(el);
        var domain = slug ? domains[slug] : null;
        if (!domain || !fallback) return;

        var img = document.createElement("img");
        img.src =
          "https://www.google.com/s2/favicons?domain=" +
          encodeURIComponent(domain) +
          "&sz=128";
        img.alt = "";
        img.setAttribute("data-framework-favicon", "true");
        img.style.cssText = "width:100%;height:100%;object-fit:contain;";
        img.addEventListener("error", function () {
          // Favicon didn't load - restore the original letter fallback.
          img.remove();
          fallback.style.display = "";
        });
        fallback.style.display = "none";
        el.appendChild(img);
      });
    });
  }

  function removeEmptySocialProof() {
    Array.prototype.forEach.call(
      document.querySelectorAll(".supp-col"),
      function (column) {
        if (/No click data yet/i.test(text(column))) {
          column.style.display = "none";
          column.setAttribute("aria-hidden", "true");
        }
      },
    );

    Array.prototype.forEach.call(
      document.querySelectorAll(".side-block"),
      function (block) {
        var blockText = text(block);
        if (
          (/Total clicks/i.test(blockText) && /Total clicks\s*0$/i.test(blockText)) ||
          (/Rating/i.test(blockText) && /Not yet rated/i.test(blockText))
        ) {
          block.style.display = "none";
          block.setAttribute("aria-hidden", "true");
        }
      },
    );
  }

  function getSavedTools() {
    try {
      var saved = JSON.parse(localStorage.getItem(SAVED_KEY) || "[]");
      return Array.isArray(saved) ? saved : [];
    } catch (error) {
      return [];
    }
  }

  function setSavedTools(tools) {
    localStorage.setItem(SAVED_KEY, JSON.stringify(tools));
  }

  // Finds the tool's real outbound link on the page (the /go/<slug> link
  // the app already renders for tracked tools, falling back to any
  // external "Visit" link) so the prominent button, the whole-card click,
  // and the app's own tracking all point at the same URL.
  function findToolOutboundLink() {
    var goLink = document.querySelector(
      '.tool-page-main a[href^="/go/"], .tool-page-head a[href^="/go/"], .tool-page a[href^="/go/"]',
    );
    if (goLink) return goLink.getAttribute("href");

    var fallback = Array.prototype.filter.call(
      document.querySelectorAll(
        ".tool-page-main a[href], .tool-page-head a[href], .tool-page a[href], main a[href]",
      ),
      function (a) {
        var href = a.getAttribute("href") || "";
        return (
          /visit/i.test(text(a)) ||
          (a.getAttribute("target") === "_blank" && /^https?:/i.test(href))
        );
      },
    )[0];

    return fallback ? fallback.getAttribute("href") : null;
  }

  function enhanceToolPage() {
    var match = window.location.pathname.match(/^\/tool\/([^/]+)/);
    if (!match) return;

    var slug = match[1];
    var heading = document.querySelector(".tool-page-title h1");
    var pageHead = document.querySelector(".tool-page-head");
    if (!heading || !pageHead) return;

    var toolName = text(heading) || slugToTitle(slug);

    // "← All tools" — the way back (friend-test fix #3)
    if (!pageHead.querySelector(".framework-back-link")) {
      var back = document.createElement("a");
      back.href = "/";
      back.className = "framework-back-link";
      back.textContent = "\u2190 All tools";
      back.style.cssText =
        "display:inline-block;margin:0 0 10px;font-size:14px;opacity:.75;color:inherit;text-decoration:none";
      pageHead.insertBefore(back, pageHead.firstChild);
    }

    if (!pageHead.querySelector(".framework-tool-actions")) {
      var actions = document.createElement("div");
      actions.className = "framework-tool-actions";

      var saveButton = document.createElement("button");
      saveButton.type = "button";
      saveButton.className = "pill-btn lg framework-save-btn";

      function renderSaveState() {
        var isSaved = getSavedTools().some(function (tool) {
          return tool.slug === slug;
        });
        saveButton.textContent = isSaved ? "\u2713 Saved" : "\uFF0B Save tool";
        saveButton.classList.toggle("is-saved", isSaved);
        saveButton.setAttribute("aria-pressed", String(isSaved));
      }

      saveButton.addEventListener("click", function () {
        var saved = getSavedTools();
        var index = saved.findIndex(function (tool) {
          return tool.slug === slug;
        });
        if (index >= 0) {
          saved.splice(index, 1);
        } else {
          saved.push({ slug: slug, name: toolName });
        }
        setSavedTools(saved);
        renderSaveState();
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: index >= 0 ? "tool_unsaved" : "tool_saved",
          tool_slug: slug,
        });
      });

      var stackLink = document.createElement("a");
      stackLink.href = "/build-my-framework/?tool=" + encodeURIComponent(slug);
      stackLink.className = "pill-btn lg";
      stackLink.textContent = "Build a stack with this tool";

      actions.appendChild(saveButton);
      actions.appendChild(stackLink);
      pageHead.appendChild(actions);
      renderSaveState();
    }

    var visitHref = findToolOutboundLink();

    // Prominent "Visit [Tool] →" button at the top of the page,
    // with an external-link icon (friend-test fix #2).
    var actionsEl = pageHead.querySelector(".framework-tool-actions");
    if (visitHref && actionsEl && !actionsEl.querySelector(".framework-visit-btn")) {
      var visit = document.createElement("a");
      visit.href = visitHref;
      if (/^https?:/i.test(visitHref)) {
        visit.target = "_blank";
        visit.rel = "noopener";
      }
      visit.className = "pill-btn lg primary framework-visit-btn";
      visit.style.cssText = "font-weight:600";
      visit.appendChild(document.createTextNode("Visit " + toolName + " \u2192"));
      visit.appendChild(createExternalLinkIcon());
      actionsEl.insertBefore(visit, actionsEl.firstChild);
    }

    // Make the entire tool card clickable, opening the tool's site in a
    // new tab (friend-test fix #2). Clicks on real links/buttons inside
    // the card — Save, Build a stack, the Visit button itself — still do
    // their own thing; only clicks on the "dead space" of the card open
    // the tool's site.
    if (visitHref && !pageHead.hasAttribute("data-framework-card-click")) {
      pageHead.setAttribute("data-framework-card-click", "true");
      pageHead.classList.add("framework-card-clickable");
      pageHead.setAttribute("tabindex", "0");
      pageHead.setAttribute("role", "link");
      pageHead.setAttribute(
        "aria-label",
        "Visit " + toolName + " (opens in a new tab)",
      );

      var openTool = function () {
        window.open(visitHref, "_blank", "noopener");
      };

      pageHead.addEventListener("click", function (event) {
        if (event.target.closest("a, button, input, textarea, select")) return;
        openTool();
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: "outbound_tool_click",
          tool_slug: slug,
          source_path: window.location.pathname,
          source: "tool_card",
        });
      });

      pageHead.addEventListener("keydown", function (event) {
        if (event.target !== pageHead) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openTool();
        }
      });
    }

    var main = document.querySelector(".tool-page-main");
    if (main && !main.querySelector(".framework-trust-note")) {
      var about = main.querySelector("p");
      if (about) {
        var note = document.createElement("div");
        note.className = "framework-trust-note";
        note.innerHTML =
          "<strong>Editorial note:</strong> Features and pricing can change. Confirm important details on the tool\u2019s official website before purchasing.";
        about.insertAdjacentElement("afterend", note);
      }
    }
  }

  // Fallback for the dead "Create a framework" CTA (friend-test fix #1):
  // if something that *says* it opens the framework builder is clicked but
  // isn't a real link (e.g. a stale cached page), send the user there anyway.
  function fixDeadFrameworkCta() {
    if (
      document.documentElement.getAttribute("data-framework-cta-fix") === "true"
    )
      return;
    document.documentElement.setAttribute("data-framework-cta-fix", "true");

    document.addEventListener("click", function (event) {
      var target = event.target;
      if (!target || !target.closest) return;
      if (target.closest("a[href]")) return; // real links work fine

      var candidate = target.closest(
        "button, [role='button'], .clarity-link, .pill-btn, span, div",
      );
      if (!candidate) return;

      var label = text(candidate);
      if (!label || label.length > 40) return;
      if (/^(create|build)( a| my| your)? (ai )?framework/i.test(label)) {
        window.location.href = "/build-my-framework/";
      }
    });
  }

  function trackUsefulActions() {
    if (document.documentElement.getAttribute("data-framework-tracking") === "true")
      return;
    document.documentElement.setAttribute("data-framework-tracking", "true");

    document.addEventListener("click", function (event) {
      var link = event.target.closest && event.target.closest("a[href]");
      if (!link) return;

      var href = link.getAttribute("href") || "";
      if (href.indexOf("/go/") === 0) {
        var slug = href.split("/go/")[1].split("?")[0];
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: "outbound_tool_click",
          tool_slug: slug,
          source_path: window.location.pathname,
        });
      } else if (
        link.classList.contains("framework-visit-btn") &&
        /^https?:/i.test(href)
      ) {
        var toolMatch = window.location.pathname.match(/^\/tool\/([^/]+)/);
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: "outbound_tool_click",
          tool_slug: toolMatch ? toolMatch[1] : "unknown",
          source_path: window.location.pathname,
        });
      }

      if (href.indexOf("/build-my-framework") === 0) {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: "framework_builder_opened",
          source_path: window.location.pathname,
        });
      }

      if (href === PROMPT_LAB_URL) {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: "promptlab_opened",
          source_path: window.location.pathname,
        });
      }
    });

    document.addEventListener("submit", function (event) {
      var form = event.target;
      if (
        form &&
        (form.getAttribute("name") === "newsletter" ||
          form.classList.contains("nl-form"))
      ) {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: "newsletter_signup",
          source_path: window.location.pathname,
        });
      }
    });
  }

  // Each enhancement is independent. If one throws (a selector that no
  // longer matches after a future UI change, say) it must not stop the
  // rest from running — that was the root cause of the CTA/nav bugs a
  // previous pass here left behind.
  function safely(fn) {
    try {
      fn();
    } catch (error) {
      if (window.console && console.warn) {
        console.warn("[site-enhancements] " + fn.name + " failed:", error);
      }
    }
  }

  function applyEnhancements() {
    safely(addNavigationLinks);
    safely(improveHomepage);
    safely(addPromptLabHint);
    safely(addSearchHint);
    safely(removeEmptySocialProof);
    safely(addToolLogos);
    safely(enhanceToolPage);
    safely(improveRouteMetadata);
    safely(fixDeadFrameworkCta);
    safely(trackUsefulActions);
  }

  // Re-apply on client-side navigation — the site is a single-page app,
  // so route changes re-render the page without reloading this script.
  function hookSpaNavigation() {
    if (window.__fwNavHooked) return;
    window.__fwNavHooked = true;

    function onNavigate() {
      applyEnhancements();
      [150, 450, 1000, 2000].forEach(function (ms) {
        window.setTimeout(applyEnhancements, ms);
      });
    }

    ["pushState", "replaceState"].forEach(function (methodName) {
      var original = history[methodName];
      if (typeof original !== "function") return;
      history[methodName] = function () {
        var result = original.apply(this, arguments);
        onNavigate();
        return result;
      };
    });
    window.addEventListener("popstate", onNavigate);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyEnhancements);
  } else {
    applyEnhancements();
  }
  hookSpaNavigation();

  var attempts = 0;
  var timer = window.setInterval(function () {
    applyEnhancements();
    attempts += 1;
    if (attempts >= 30) window.clearInterval(timer);
  }, 300);

  var enhancementScheduled = false;
  var observer = new MutationObserver(function (records) {
    var bodyChanged = records.some(function (record) {
      return (
        document.body &&
        (record.target === document.body || document.body.contains(record.target))
      );
    });
    if (!bodyChanged || enhancementScheduled) return;

    enhancementScheduled = true;
    window.requestAnimationFrame(function () {
      enhancementScheduled = false;
      applyEnhancements();
    });
  });
  observer.observe(document.body || document.documentElement, {
    childList: true,
    subtree: true,
  });
  window.setTimeout(function () {
    observer.disconnect();
  }, 12000);
})();
