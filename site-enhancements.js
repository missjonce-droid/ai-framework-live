(function () {
  "use strict";

  var SITE = "https://ai-framework.io";
  var SAVED_KEY = "ai_fw_saved_tools";
  var SOCIAL_IMAGE = SITE + "/social-card.png";

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

  function addNavigationLinks() {
    var nav = document.querySelector(".nav-links");
    if (nav && !nav.querySelector('[href="/build-my-framework/"]')) {
      var navLink = document.createElement("a");
      navLink.href = "/build-my-framework/";
      navLink.className = "framework-nav-link";
      navLink.textContent = "Build My Framework";
      nav.insertBefore(navLink, nav.firstChild);
    }

    if (nav && !nav.querySelector('[href="/prompt-lab"]')) {
      var labLink = document.createElement("a");
      labLink.href = "/prompt-lab";
      labLink.className = "framework-nav-link prompt-lab-nav-link";
      labLink.textContent = "Prompt Lab";
      var afterBuilder = nav.querySelector('[href="/build-my-framework/"]');
      if (afterBuilder && afterBuilder.nextSibling) {
        nav.insertBefore(labLink, afterBuilder.nextSibling);
      } else {
        nav.appendChild(labLink);
      }
      var promptLabLink = document.createElement("a");
      promptLabLink.href = "/prompt-lab";
      promptLabLink.className = "promptlab-nav-link";
      promptLabLink.textContent = "Prompt Lab";
      var buildLink = nav.querySelector('[href="/build-my-framework/"]');
      nav.insertBefore(promptLabLink, buildLink ? buildLink.nextSibling : nav.firstChild);
    }

    var homeActions = document.querySelector(".header-actions");
    if (
      homeActions &&
      !homeActions.querySelector('[href="/build-my-framework/"]')
    ) {
      var homeLink = document.createElement("a");
      homeLink.href = "/build-my-framework/";
      homeLink.className = "pill-btn framework-home-button";
      homeLink.textContent = "Build My Framework";
      homeActions.insertBefore(homeLink, homeActions.firstChild);
    }

    if (homeActions && !homeActions.querySelector('[href="/prompt-lab"]')) {
      var homeLabLink = document.createElement("a");
      homeLabLink.href = "/prompt-lab";
      homeLabLink.className = "pill-btn prompt-lab-home-button";
      homeLabLink.textContent = "Prompt Lab";
      var builderButton = homeActions.querySelector(
        '[href="/build-my-framework/"]',
      );
      if (builderButton && builderButton.nextSibling) {
        homeActions.insertBefore(homeLabLink, builderButton.nextSibling);
      } else {
        homeActions.appendChild(homeLabLink);
      }
    }
  }

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
    title.textContent = "What the Framework?";
    subtitle.textContent =
      "Tell us the result you want. AI Framework helps you find the right tools, compare the tradeoffs, and turn them into a practical step-by-step stack.";

    if (!actions.querySelector('[href="/build-my-framework/"]')) {
      var builder = document.createElement("a");
      builder.href = "/build-my-framework/";
      builder.className = "clarity-link primary framework-hero-link";
      builder.textContent = "Build My Framework →";
      actions.insertBefore(builder, actions.firstChild);
    }

    if (!actions.querySelector('[href="/prompt-lab"]')) {
      var promptLab = document.createElement("a");
      promptLab.href = "/prompt-lab";
      promptLab.className = "clarity-link promptlab-hero-link";
      promptLab.textContent = "Try Prompt Lab (free)";
      var builderLink = actions.querySelector('[href="/build-my-framework/"]');
      actions.insertBefore(promptLab, builderLink ? builderLink.nextSibling : actions.firstChild);
    }

    var browse = actions.querySelector('a[href="#browse"]');
    if (browse) browse.classList.remove("primary");
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

  function enhanceToolPage() {
    var match = window.location.pathname.match(/^\/tool\/([^/]+)/);
    if (!match) return;

    var slug = match[1];
    var heading = document.querySelector(".tool-page-title h1");
    var pageHead = document.querySelector(".tool-page-head");
    if (!heading || !pageHead) return;

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
        saveButton.textContent = isSaved ? "✓ Saved" : "＋ Save tool";
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
          saved.push({ slug: slug, name: text(heading) || slugToTitle(slug) });
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

    var main = document.querySelector(".tool-page-main");
    if (main && !main.querySelector(".framework-trust-note")) {
      var about = main.querySelector("p");
      if (about) {
        var note = document.createElement("div");
        note.className = "framework-trust-note";
        note.innerHTML =
          "<strong>Editorial note:</strong> Features and pricing can change. Confirm important details on the tool’s official website before purchasing.";
        about.insertAdjacentElement("afterend", note);
      }
    }
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
      }

      if (href.indexOf("/build-my-framework") === 0) {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: "framework_builder_opened",
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

  function applyEnhancements() {
    addNavigationLinks();
    improveHomepage();
    removeEmptySocialProof();
    enhanceToolPage();
    improveRouteMetadata();
    trackUsefulActions();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyEnhancements);
  } else {
    applyEnhancements();
  }

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
