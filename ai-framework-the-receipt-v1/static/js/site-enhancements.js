/* AI Framework — site enhancements (v9, usability-fix build)
 *
 * Rebuilt after the friend usability test. Ships:
 *   #1  Homepage "Build My Framework →" hero CTA as a REAL link
 *       (+ a delegated click fallback for any non-link element
 *       labeled "create/build a framework").
 *   #2  Tool pages: prominent "Visit [Tool] →" primary button with an
 *       external-link icon, whole header card click-through to the
 *       tool's site (new tab), routed through /go/<slug>.
 *   #3  Way back: site title links to "/" everywhere, "← All tools"
 *       link on every tool detail page.
 *   Nav: "Prompt Lab" item → /promptlab; homepage under-search hint
 *       "Not sure what to type? Fix your prompt free →".
 *
 * Every enhancement is idempotent and wrapped in try/catch so one
 * failure can never disable the rest (the previous build died on a
 * single syntax error and none of this ran).
 * Keep the copies at /site-enhancements.js and /static/js/site-enhancements.js identical.
 */
(function () {
  "use strict";

  var SITE = "https://ai-framework.io";
  var SOCIAL_IMAGE = SITE + "/social-card.png";
  var PROMPT_LAB_URL = "/promptlab"; // live route (no dash)
  var BUILDER_URL = "/build-my-framework/";
  var RECEIPT_URL = "/receipt"; // The Receipt — flagship free tool

  /* ---------------------------------------------------------- utils */

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

  function pushEvent(payload) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(payload);
  }

  function externalLinkIcon() {
    var span = document.createElement("span");
    span.setAttribute("aria-hidden", "true");
    span.className = "fw-ext-icon";
    span.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>';
    return span;
  }

  function injectStyles() {
    if (document.getElementById("fw-enhancement-styles")) return;
    var style = document.createElement("style");
    style.id = "fw-enhancement-styles";
    style.textContent = [
      /* logo → home */
      ".site-title{cursor:pointer}",
      ".site-title a.fw-brand-link{color:inherit;text-decoration:none}",
      /* tool page: hide the old unlabeled Visit button once ours is in */
      ".fw-head-enhanced > a.pill-btn.primary[href^='/go/']:not(.fw-visit-btn){display:none}",
      /* whole-card click-through */
      ".fw-head-enhanced{cursor:pointer}",
      ".fw-head-enhanced a,.fw-head-enhanced button{cursor:pointer}",
      /* our prominent visit button */
      ".fw-visit-btn{font-weight:700;white-space:nowrap}",
      ".fw-visit-btn .fw-ext-icon{margin-left:6px;display:inline-block}",
      /* back link */
      ".fw-back-link{display:inline-block;margin:0 0 10px;font-size:14px;opacity:.75;color:inherit;text-decoration:none}",
      ".fw-back-link:hover{opacity:1;text-decoration:underline}",
      /* under-search hint */
      ".promptlab-search-hint{margin-top:8px;font-size:14px;opacity:.85}",
      ".promptlab-search-hint a{text-decoration:underline;text-underline-offset:3px;color:inherit}",
      /* The Receipt — flagship feature gets a small accent everywhere it's linked */
      ".framework-receipt-nav-link{color:#f2c14e!important;font-weight:600}",
      ".framework-receipt-nav-link:hover{background:rgba(242,193,78,.1)!important}",
    ].join("\n");
    document.head.appendChild(style);
  }

  /* ---------------------------------------------- metadata (SEO/OG) */

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

    if (document.title !== title) document.title = title;
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

  /* ------------------------------------------- fix #3a: logo → home */

  function makeLogoLinkHome() {
    // Directory-style pages use <a class="nav-brand" href="/"> already.
    // The tree/homepage header renders a plain <h1 class="site-title">.
    var title = document.querySelector("h1.site-title");
    if (title && !title.querySelector("a.fw-brand-link")) {
      var label = text(title) || "AI Framework";
      var link = document.createElement("a");
      link.href = "/";
      link.className = "fw-brand-link";
      link.setAttribute("aria-label", "AI Framework home");
      link.textContent = label;
      while (title.firstChild) title.removeChild(title.firstChild);
      title.appendChild(link);
    }
  }

  /* --------------------------------------------- nav: Prompt Lab &c */

  function addNavigationLinks() {
    var nav =
      document.querySelector(".nav-links") ||
      document.querySelector("header nav") ||
      document.querySelector("nav");

    if (nav && !nav.querySelector('[href="' + BUILDER_URL + '"]')) {
      var navLink = document.createElement("a");
      navLink.href = BUILDER_URL;
      navLink.className = "framework-nav-link";
      navLink.textContent = "Build My Framework";
      nav.insertBefore(navLink, nav.firstChild);
    }

    if (nav && !nav.querySelector('[href="' + PROMPT_LAB_URL + '"]')) {
      var promptLab = document.createElement("a");
      promptLab.href = PROMPT_LAB_URL;
      promptLab.className =
        window.location.pathname === PROMPT_LAB_URL ? "active" : "";
      promptLab.textContent = "Prompt Lab";

      // Sits next to Playbooks — the other standalone, non-router page.
      var playbooks = nav.querySelector('[href="/playbooks/"]');
      if (playbooks && playbooks.parentNode === nav) {
        nav.insertBefore(promptLab, playbooks.nextSibling);
      } else {
        nav.appendChild(promptLab);
      }
    }

    if (nav && !nav.querySelector('[href="' + RECEIPT_URL + '"]')) {
      var receiptLink = document.createElement("a");
      receiptLink.href = RECEIPT_URL;
      receiptLink.className = "framework-nav-link framework-receipt-nav-link";
      receiptLink.textContent = "The Receipt";
      var afterPromptLab = nav.querySelector('[href="' + PROMPT_LAB_URL + '"]');
      if (afterPromptLab && afterPromptLab.parentNode === nav) {
        nav.insertBefore(receiptLink, afterPromptLab.nextSibling);
      } else {
        nav.appendChild(receiptLink);
      }
    }

    // Tree/homepage header has pill buttons instead of a nav list.
    var homeActions = document.querySelector(".header-actions");
    if (homeActions && !homeActions.querySelector('[href="' + BUILDER_URL + '"]')) {
      var homeLink = document.createElement("a");
      homeLink.href = BUILDER_URL;
      homeLink.className = "pill-btn framework-home-button";
      homeLink.textContent = "Build My Framework";
      homeActions.insertBefore(homeLink, homeActions.firstChild);
    }
  }

  /* ------------------------------- fix #1: homepage hero + real CTA */

  function improveHomepage() {
    var path = window.location.pathname;
    if (path !== "/" && path !== "/tree") return;

    var hero = document.querySelector(".clarity-hero");
    if (!hero) return;

    var title = hero.querySelector(".clarity-title");
    var subtitle = hero.querySelector(".clarity-sub");
    var actions = hero.querySelector(".clarity-actions");
    if (!title || !subtitle || !actions) return;

    if (hero.getAttribute("data-framework-updated") !== "true") {
      hero.setAttribute("data-framework-updated", "true");
      title.textContent =
        "What is your AI stack actually costing you?";
      subtitle.textContent =
        "Add what you're paying for and get an instant receipt: what overlaps, what's overpriced, what to cancel. Then find the right tools, compare the tradeoffs, and build the stack that replaces it.";
    }

    // Flagship CTA: real <a>, middle-clickable, long-pressable, keyboard reachable.
    if (!actions.querySelector('a[href="' + RECEIPT_URL + '"]')) {
      var receiptCta = document.createElement("a");
      receiptCta.href = RECEIPT_URL;
      receiptCta.className = "clarity-link primary framework-receipt-hero-link";
      receiptCta.textContent = "Get My Receipt \u2192";
      actions.insertBefore(receiptCta, actions.firstChild);
    }

    if (!actions.querySelector('a[href="' + BUILDER_URL + '"]')) {
      var builder = document.createElement("a");
      builder.href = BUILDER_URL;
      builder.className = "clarity-link framework-hero-link";
      builder.textContent = "Build My Framework \u2192";
      var receiptLinkEl = actions.querySelector('a[href="' + RECEIPT_URL + '"]');
      actions.insertBefore(builder, receiptLinkEl ? receiptLinkEl.nextSibling : actions.firstChild);
    }

    if (!actions.querySelector('a[href="' + PROMPT_LAB_URL + '"]')) {
      var promptLab = document.createElement("a");
      promptLab.href = PROMPT_LAB_URL;
      promptLab.className = "clarity-link promptlab-hero-link";
      promptLab.textContent = "Try Prompt Lab (free)";
      var builderLink = actions.querySelector('a[href="' + BUILDER_URL + '"]');
      actions.insertBefore(
        promptLab,
        builderLink ? builderLink.nextSibling : actions.firstChild,
      );
    }

    var browse = actions.querySelector('a[href="#browse"]');
    if (browse) browse.classList.remove("primary");
  }

  // Safety net: anything that *says* it opens the framework builder but
  // isn't a real link still navigates (fix #1 fallback).
  function fixDeadFrameworkCta() {
    if (document.documentElement.getAttribute("data-framework-cta-fix") === "true")
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
        pushEvent({
          event: "framework_builder_opened",
          source_path: window.location.pathname,
          via: "dead_cta_fallback",
        });
        window.location.href = BUILDER_URL;
      }
    });
  }

  /* -------------------------- homepage under-search Prompt Lab hint */

  function addSearchHint() {
    var path = window.location.pathname;
    if (path !== "/" && path !== "/tree" && path !== "/browse") return;
    if (document.querySelector(".promptlab-search-hint")) return;

    var anchorPoint = document.querySelector(".clarity-search");
    if (!anchorPoint) {
      var input = document.querySelector(
        'input[type="search"], input[placeholder*="earch"]',
      );
      if (input) anchorPoint = input.closest("form") || input.parentElement;
    }
    if (!anchorPoint || !anchorPoint.parentNode) return;

    var hint = document.createElement("p");
    hint.className = "promptlab-search-hint";
    hint.appendChild(document.createTextNode("Not sure what to type? "));
    var link = document.createElement("a");
    link.href = PROMPT_LAB_URL;
    link.textContent = "Fix your prompt free \u2192";
    hint.appendChild(link);
    anchorPoint.parentNode.insertBefore(hint, anchorPoint.nextSibling);
  }

  /* -------------------- fix #2 + #3b: tool detail page enhancements */

  function toolGoHref(pageHead, slug) {
    var existing = pageHead.querySelector('a[href^="/go/"]');
    if (existing) return existing.getAttribute("href");
    return "/go/" + encodeURIComponent(slug) + "?ref=/tool/" + encodeURIComponent(slug);
  }

  function enhanceToolPage() {
    var match = window.location.pathname.match(/^\/tool\/([^/]+)/);
    if (!match) return;

    var slug = match[1];
    var pageHead = document.querySelector(".tool-page-head");
    var heading = document.querySelector(".tool-page-title h1");
    if (!pageHead || !heading) return;

    var toolName = text(heading) || slugToTitle(slug);
    var goHref = toolGoHref(pageHead, slug);

    // "← All tools" at the top of the page (fix #3b)
    var container = pageHead.parentNode;
    if (container && !container.querySelector(".fw-back-link")) {
      var back = document.createElement("a");
      back.href = "/browse";
      back.className = "fw-back-link";
      back.textContent = "\u2190 All tools";
      container.insertBefore(back, pageHead);
    }

    // Prominent "Visit [Tool] →" primary button with external-link icon
    if (!pageHead.querySelector(".fw-visit-btn")) {
      var visit = document.createElement("a");
      visit.href = goHref;
      visit.target = "_blank";
      visit.rel = "noopener noreferrer";
      visit.className = "pill-btn primary lg fw-visit-btn";
      visit.setAttribute("data-fw-slug", slug);
      visit.appendChild(
        document.createTextNode("Visit " + toolName + " \u2192 "),
      );
      visit.appendChild(externalLinkIcon());

      // Place it where the old, easy-to-miss "Visit website" button sat;
      // the stylesheet hides that one once fw-head-enhanced is set.
      var oldVisit = pageHead.querySelector(
        'a.pill-btn.primary[href^="/go/"]:not(.fw-visit-btn)',
      );
      if (oldVisit) {
        oldVisit.parentNode.insertBefore(visit, oldVisit);
      } else {
        pageHead.appendChild(visit);
      }
    }

    // Whole header card is clickable → opens the tool site (fix #2)
    pageHead.classList.add("fw-head-enhanced");
    pageHead.setAttribute("data-fw-go", goHref);
    pageHead.setAttribute("data-fw-slug", slug);
    if (!pageHead.getAttribute("title")) {
      pageHead.setAttribute("title", "Open " + toolName + " \u2014 new tab");
    }
  }

  function installCardClickThrough() {
    if (document.documentElement.getAttribute("data-fw-card-click") === "true")
      return;
    document.documentElement.setAttribute("data-fw-card-click", "true");

    document.addEventListener("click", function (event) {
      var target = event.target;
      if (!target || !target.closest) return;
      // Real interactive elements inside the card keep their own behavior.
      if (target.closest("a, button, input, select, textarea, [role='button']"))
        return;

      var card = target.closest(".fw-head-enhanced[data-fw-go]");
      if (!card) return;

      var href = card.getAttribute("data-fw-go");
      if (!href) return;

      pushEvent({
        event: "outbound_tool_click",
        tool_slug: card.getAttribute("data-fw-slug") || "unknown",
        source_path: window.location.pathname,
        via: "tool_card",
      });
      window.open(href, "_blank", "noopener");
    });
  }

  /* -------------------------------------------- housekeeping extras */

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

  /* ------------------------------------------------------- tracking */

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
        pushEvent({
          event: "outbound_tool_click",
          tool_slug: slug,
          source_path: window.location.pathname,
          via: link.classList.contains("fw-visit-btn") ? "visit_button" : "link",
        });
      }

      if (href.indexOf("/build-my-framework") === 0) {
        pushEvent({
          event: "framework_builder_opened",
          source_path: window.location.pathname,
        });
      }

      if (href === PROMPT_LAB_URL) {
        pushEvent({
          event: "promptlab_opened",
          source_path: window.location.pathname,
        });
      }

      if (href === RECEIPT_URL) {
        pushEvent({
          event: "receipt_opened",
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
        pushEvent({
          event: "newsletter_signup",
          source_path: window.location.pathname,
        });
      }
    });
  }

  /* ----------------------------------------------------- lifecycle */

  var STEPS = [
    injectStyles,
    makeLogoLinkHome,
    addNavigationLinks,
    improveHomepage,
    addSearchHint,
    removeEmptySocialProof,
    enhanceToolPage,
    improveRouteMetadata,
    fixDeadFrameworkCta,
    installCardClickThrough,
    trackUsefulActions,
  ];

  function applyEnhancements() {
    STEPS.forEach(function (step) {
      try {
        step();
      } catch (error) {
        // One broken step must never take the rest down.
        if (window.console && console.warn) {
          console.warn("[site-enhancements] " + (step.name || "step") + ":", error);
        }
      }
    });
  }

  // Re-apply on client-side navigation — the site is a single-page app,
  // so route changes re-render without reloading this script.
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

  // Early-life re-apply loop: catches the initial async React render.
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
