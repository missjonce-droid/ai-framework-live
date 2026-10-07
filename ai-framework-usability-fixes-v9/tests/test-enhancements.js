/* Behavior tests for site-enhancements.js (v9).
 * DOM replicas below mirror the markup the React bundle actually renders
 * (class names verified against static/js/main.cd845d6d.js). */
const fs = require("node:fs");
const { JSDOM } = require("jsdom");

const SCRIPT = fs.readFileSync(
  "/home/claude/site/static/js/site-enhancements.js",
  "utf8",
);

let pass = 0,
  fail = 0;
function ok(name, cond) {
  if (cond) {
    pass++;
    console.log("  ✓ " + name);
  } else {
    fail++;
    console.log("  ✗ FAIL " + name);
  }
}

function boot(html, url) {
  const { VirtualConsole } = require("jsdom");
  const vc = new VirtualConsole();
  const navAttempts = [];
  vc.on("jsdomError", (e) => { if (/navigation/i.test(e.message)) navAttempts.push(e.message); });
  const dom = new JSDOM(html, { url, runScripts: "outside-only", virtualConsole: vc });
  dom.navAttempts = navAttempts;
  const { window } = dom;
  window.opened = [];
  window.open = function (href, target) {
    window.opened.push({ href, target });
    return null;
  };
  window.requestAnimationFrame = (cb) => setTimeout(cb, 0);
  window.eval(SCRIPT);
  // jsdom stays in "loading" at construction; fire DOMContentLoaded so the
  // script's ready handler runs, exactly as in a real browser.
  window.document.dispatchEvent(new window.Event("DOMContentLoaded", { bubbles: true }));
  return dom;
}

/* ------------------------------------------------ homepage (tree) */
console.log("\nHOMEPAGE (/):");
{
  const dom = boot(
    `<!doctype html><html><head><title>x</title></head><body>
      <header class="site-header">
        <div class="header-top">
          <h1 class="site-title">AI Framework</h1>
          <div class="header-actions">
            <a class="pill-btn primary" href="/submit">Submit a tool</a>
            <a class="pill-btn" href="/playbooks/">Playbooks</a>
          </div>
        </div>
        <div class="search-wrap"><input type="search" placeholder="Search tools, creators, companies…"></div>
      </header>
      <section class="clarity-hero">
        <h2 class="clarity-title">Every AI tool worth your time, in one place</h2>
        <p class="clarity-sub">old sub</p>
        <div class="clarity-search"><input placeholder="Search 1,500+ tools…"></div>
        <div class="clarity-actions">
          <a href="#browse" class="clarity-link primary">Browse by category ↓</a>
          <a href="/playbooks/" class="clarity-link">100 AI Playbooks</a>
          <button class="clarity-link ghost">Explore visually (map)</button>
        </div>
      </section>
      <div id="cta"><span class="clarity-link">Create a framework</span></div>
    </body></html>`,
    "https://ai-framework.io/",
  );
  const d = dom.window.document;

  const hero = d.querySelector(".clarity-actions a[href='/build-my-framework/']");
  ok("hero has a REAL <a> Build My Framework CTA", !!hero);
  ok("hero CTA is first + primary", hero && hero.previousElementSibling === null && /primary/.test(hero.className));
  ok("hero CTA label", hero && /Build My Framework/.test(hero.textContent));
  ok("#browse link demoted from primary", !/primary/.test(d.querySelector("a[href='#browse']").className));
  ok("hero Prompt Lab link present", !!d.querySelector(".clarity-actions a[href='/promptlab']"));

  const hint = d.querySelector(".promptlab-search-hint");
  ok("under-search hint present", !!hint);
  ok("hint text + link", hint && /Not sure what to type\?/.test(hint.textContent) && hint.querySelector("a[href='/promptlab']") && /Fix your prompt free/.test(hint.querySelector("a").textContent));
  ok("hint sits directly under .clarity-search", hint && hint.previousElementSibling === d.querySelector(".clarity-search"));

  const brand = d.querySelector("h1.site-title a.fw-brand-link");
  ok("site title wrapped in link to /", brand && brand.getAttribute("href") === "/");

  ok("header-actions gained Build My Framework pill", !!d.querySelector(".header-actions a[href='/build-my-framework/']"));

  // dead-CTA fallback: click the non-link "Create a framework" span
  d.querySelector("#cta span").dispatchEvent(
    new dom.window.MouseEvent("click", { bubbles: true, cancelable: true }),
  );
  // jsdom cannot complete document navigation; it raises a jsdomError on the
  // attempt instead — that attempt is exactly what we are asserting.
  ok("dead 'Create a framework' click navigates to builder", dom.navAttempts.length === 1);
  const ev = (dom.window.dataLayer || []).find((e) => e.event === "framework_builder_opened");
  ok("fallback pushes framework_builder_opened event", !!ev && ev.via === "dead_cta_fallback");
}

/* -------------------------------------------- directory-style nav */
console.log("\nDIRECTORY NAV (/browse):");
{
  const dom = boot(
    `<!doctype html><html><head><title>x</title></head><body>
      <header class="nav"><div class="nav-inner">
        <a href="/" class="nav-brand">AI Framework</a>
        <nav class="nav-links">
          <a href="/">Tree</a><a href="/browse" class="active">Directory</a>
          <a href="/discover">Discover</a><a href="/playbooks/">Playbooks</a>
          <a href="/submit">Submit</a>
        </nav>
      </div></header>
      <input type="search" placeholder="Search…">
    </body></html>`,
    "https://ai-framework.io/browse",
  );
  const d = dom.window.document;
  const lab = d.querySelector(".nav-links a[href='/promptlab']");
  ok("nav has Prompt Lab → /promptlab", !!lab && lab.textContent === "Prompt Lab");
  ok("Prompt Lab sits right after Playbooks", lab && lab.previousElementSibling === d.querySelector("a[href='/playbooks/']"));
  ok("nav has Build My Framework", !!d.querySelector(".nav-links a[href='/build-my-framework/']"));
  dom.window.eval(SCRIPT); // apply everything a second time
  ok("no duplicate Prompt Lab nav item on re-apply", d.querySelectorAll(".nav-links a[href='/promptlab']").length === 1);
  ok("no duplicate search hint on re-apply", d.querySelectorAll(".promptlab-search-hint").length === 1);
}

/* ---------------------------------------------- tool detail page */
console.log("\nTOOL PAGE (/tool/10web):");
{
  const dom = boot(
    `<!doctype html><html><head><title>x</title></head><body>
      <header class="nav"><div class="nav-inner">
        <a href="/" class="nav-brand">AI Framework</a>
        <nav class="nav-links"><a href="/">Tree</a><a href="/playbooks/">Playbooks</a></nav>
      </div></header>
      <div class="page-container">
        <div class="crumbs"><a href="/">Home</a><span>/</span><a href="/category/website-builders">Website Builders</a></div>
        <div class="tool-page-head">
          <div class="tool-page-logo"><span>1</span></div>
          <div class="tool-page-title">
            <h1>10Web</h1>
            <p class="tool-page-desc">Website Builders · Business websites</p>
            <div class="tool-badges"><span class="badge">paid</span></div>
          </div>
          <a class="pill-btn primary lg" href="/go/10web?ref=/tool/10web" target="_blank" rel="noopener noreferrer">Visit website</a>
          <a class="pill-btn lg" href="/alternatives/10web">See alternatives</a>
        </div>
        <div class="tool-page-grid"><div class="tool-page-main"><h2>About</h2><p>desc</p></div></div>
      </div>
    </body></html>`,
    "https://ai-framework.io/tool/10web",
  );
  const d = dom.window.document;

  const back = d.querySelector(".fw-back-link");
  ok("'← All tools' link present", !!back && back.textContent === "← All tools");
  ok("back link points at /browse", back && back.getAttribute("href") === "/browse");
  ok("back link sits above the head card", back && back.nextElementSibling === d.querySelector(".tool-page-head"));

  const visit = d.querySelector(".fw-visit-btn");
  ok("prominent visit button exists", !!visit);
  ok("label is 'Visit 10Web →'", visit && /^Visit 10Web →/.test(visit.textContent.trim()));
  ok("has external-link SVG icon", visit && !!visit.querySelector("svg"));
  ok("routes via /go/<slug> with ref", visit && visit.getAttribute("href") === "/go/10web?ref=/tool/10web");
  ok("opens new tab safely", visit && visit.target === "_blank" && /noopener/.test(visit.rel));
  ok("is primary + large", visit && /primary/.test(visit.className) && /\blg\b/.test(visit.className));

  const css = d.getElementById("fw-enhancement-styles").textContent;
  ok("old 'Visit website' button hidden by stylesheet", /fw-head-enhanced > a\.pill-btn\.primary\[href\^='\/go\/'\]:not\(\.fw-visit-btn\)\{display:none\}/.test(css));

  const head = d.querySelector(".tool-page-head");
  ok("whole card armed for click-through", head.classList.contains("fw-head-enhanced") && head.getAttribute("data-fw-go") === "/go/10web?ref=/tool/10web");

  // click empty card area (the description paragraph) → opens tool site
  d.querySelector(".tool-page-desc").dispatchEvent(
    new dom.window.MouseEvent("click", { bubbles: true, cancelable: true }),
  );
  ok("card click opens /go/<slug> in new tab", dom.window.opened.length === 1 && dom.window.opened[0].href === "/go/10web?ref=/tool/10web" && dom.window.opened[0].target === "_blank");
  let ev = (dom.window.dataLayer || []).filter((e) => e.event === "outbound_tool_click");
  ok("card click tracked (via tool_card)", ev.length === 1 && ev[0].via === "tool_card" && ev[0].tool_slug === "10web");

  // click "See alternatives" → must NOT open the tool site
  d.querySelector("a[href='/alternatives/10web']").dispatchEvent(
    new dom.window.MouseEvent("click", { bubbles: true, cancelable: true }),
  );
  ok("inner links keep their own behavior", dom.window.opened.length === 1);

  // click the visit button → tracked as visit_button
  visit.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true, cancelable: true }));
  ev = (dom.window.dataLayer || []).filter((e) => e.event === "outbound_tool_click");
  ok("visit button click tracked (via visit_button)", ev.length === 2 && ev[1].via === "visit_button");

  // idempotency: re-run all enhancements
  dom.window.eval(SCRIPT);
  ok("no duplicate visit buttons after re-apply", d.querySelectorAll(".fw-visit-btn").length === 1);
  ok("no duplicate back links after re-apply", d.querySelectorAll(".fw-back-link").length === 1);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
