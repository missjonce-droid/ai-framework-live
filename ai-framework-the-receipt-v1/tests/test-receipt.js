/* Behavior tests for receipt.html's client-side logic.
 * We can't easily `eval` an inline <script> tag out of a full HTML doc via
 * jsdom's runScripts, so we extract the <script> body between the tools-lite
 * fetch and </script>, stub fetch/canvas, and run it directly. */
const fs = require("node:fs");
const { JSDOM } = require("jsdom");

const html = fs.readFileSync("/home/claude/site/receipt.html", "utf8");
const scriptMatch = html.match(/<script>\n\(function\(\)\{[\s\S]*?\}\)\(\);\n<\/script>/);
if (!scriptMatch) { console.error("Could not extract inline script"); process.exit(1); }
const SCRIPT = scriptMatch[0].replace(/^<script>\n/, "").replace(/\n<\/script>$/, "");

const TOOLS = JSON.parse(fs.readFileSync("/home/claude/site/static/data/tools-lite.json", "utf8"));

let pass = 0, fail = 0;
function ok(name, cond) {
  if (cond) { pass++; console.log("  ✓ " + name); }
  else { fail++; console.log("  ✗ FAIL " + name); }
}

// Body markup lifted straight from receipt.html so ids match.
const BODY = `
<div class="rig">
  <div class="rig-row">
    <input type="text" id="tool-input">
    <div class="price-field"><input type="number" id="price-input"></div>
    <button class="add" id="add-btn" type="button">Add</button>
    <div class="suggest" id="suggest" hidden></div>
  </div>
  <p class="try">
    <button type="button" id="add-manual">Add it anyway</button>
    <button type="button" data-ex="ChatGPT Plus" data-price="20">ChatGPT Plus</button>
  </p>
  <div class="added-list" id="added-list"></div>
  <div class="cta-row"><button class="reveal" id="reveal-btn" type="button" disabled>Print</button></div>
  <p id="rig-hint"></p>
</div>
<div id="receipt-wrap"><div class="receipt" id="receipt"></div>
  <div class="share-row">
    <button id="save-img" type="button">Save</button>
    <a id="copy-link" href="#">Copy</a>
    <button id="start-over" type="button">Start over</button>
  </div>
</div>`;

function boot() {
  const dom = new JSDOM(`<!doctype html><body>${BODY}</body>`, {
    url: "https://ai-framework.io/receipt",
    runScripts: "outside-only",
    pretendToBeVisual: true,
  });
  const w = dom.window;
  w.fetch = function () {
    return Promise.resolve({ json: () => Promise.resolve(TOOLS) });
  };
  w.HTMLElement.prototype.scrollIntoView = function () {};
  w.scrollTo = function () {};
  w.dataLayer = [];
  // canvas stubs — jsdom has no real canvas backend
  w.HTMLCanvasElement.prototype.getContext = function () {
    return {
      fillRect() {}, fillText() {}, beginPath() {}, moveTo() {}, lineTo() {},
      stroke() {}, closePath() {}, arcTo() {}, fill() {}, setLineDash() {},
    };
  };
  w.HTMLCanvasElement.prototype.toDataURL = function () { return "data:image/png;base64,stub"; };
  let downloadClicked = false;
  const origCreateElement = w.document.createElement.bind(w.document);
  w.document.createElement = function (tag) {
    const el = origCreateElement(tag);
    if (tag === "a") {
      const origClick = el.click ? el.click.bind(el) : null;
      el.click = function () { downloadClicked = true; };
    }
    return el;
  };

  // jsdom parses the constructor's HTML string and fires its own real
  // DOMContentLoaded once that finishes — eval'ing the script attaches our
  // listener in time to catch it. Firing a second one manually would
  // double-run init() and double-bind every handler it registers.
  w.eval(SCRIPT);
  return { dom, w, getDownloadClicked: () => downloadClicked };
}

function addViaUI(w, d, name, price) {
  d.getElementById("tool-input").value = name;
  d.getElementById("price-input").value = String(price);
  d.getElementById("add-btn").dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
}

async function run() {
  /* -------------------- basic add/remove -------------------- */
  console.log("\nADD / REMOVE:");
  {
    const { dom, w } = boot();
    await new Promise((r) => setTimeout(r, 350)); // let tools-lite.json "load"
    const d = w.document;
    addViaUI(w, d, "ChatGPT Plus", 20);
    ok("tool appears in added list", /ChatGPT Plus/.test(d.getElementById("added-list").textContent));
    ok("reveal button enabled after 1 add", !d.getElementById("reveal-btn").disabled);
    addViaUI(w, d, "Jasper", 49);
    ok("second tool appears too", /Jasper/.test(d.getElementById("added-list").textContent));
    // re-query after the second render — innerHTML was replaced, so any node
    // reference taken before this point is detached from the live tree.
    d.getElementById("added-list").querySelector('button[data-remove="0"]')
      .dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
    ok("remove button deletes the right item", !/ChatGPT Plus/.test(d.getElementById("added-list").textContent) && /Jasper/.test(d.getElementById("added-list").textContent));
  }

  /* -------------------- redundancy + grading math -------------------- */
  console.log("\nREDUNDANCY DETECTION:");
  {
    const { dom, w } = boot();
    await new Promise((r) => setTimeout(r, 350));
    const d = w.document;
    // ChatGPT + Claude + Gemini: same subcategory ("Writing assistants") per tools-lite.json
    addViaUI(w, d, "ChatGPT", 20);
    addViaUI(w, d, "Claude", 20);
    addViaUI(w, d, "Gemini", 20);
    d.getElementById("reveal-btn").dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
    const receiptHtml = d.getElementById("receipt").innerHTML;
    ok("receipt renders after clicking Print", receiptHtml.length > 100);
    ok("monthly total is $60", /\$60/.test(receiptHtml));
    const flagCount = (receiptHtml.match(/class="stamp"/g) || []).length;
    ok("flags 2 of 3 same-category tools as overlap (keeps the cheapest)", flagCount === 2);
    ok("wasted amount shown ($40/mo — the two flagged $20 tools)", /\$40\/mo/.test(receiptHtml));
    ok("grade rendered", /class="g [a-f]"/.test(receiptHtml));
    const gradeEvent = w.dataLayer.find((e) => e.event === "receipt_generated");
    ok("receipt_generated event fired with correct totals", gradeEvent && gradeEvent.monthly_total === 60 && gradeEvent.wasted_monthly === 40);
  }

  /* -------------------- clean stack (no overlap) -------------------- */
  console.log("\nCLEAN STACK (no overlap):");
  {
    const { dom, w } = boot();
    await new Promise((r) => setTimeout(r, 350));
    const d = w.document;
    addViaUI(w, d, "ChatGPT", 20); // Writing
    addViaUI(w, d, "Zapier", 30);  // different category (Automation)
    d.getElementById("reveal-btn").dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
    const receiptHtml = d.getElementById("receipt").innerHTML;
    ok("no stamps when categories differ", !/class="stamp"/.test(receiptHtml));
    ok("clean-stack messaging shown", /no overlap detected/.test(receiptHtml));
    ok("grade is A for a clean stack", /class="g a"/.test(receiptHtml));
  }

  /* -------------------- unmatched (manual) tool still works -------------------- */
  console.log("\nMANUAL / UNMATCHED TOOL:");
  {
    const { dom, w } = boot();
    await new Promise((r) => setTimeout(r, 350));
    const d = w.document;
    addViaUI(w, d, "Some Random Internal Tool", 15);
    ok("unmatched tool still gets added", /Some Random Internal Tool/.test(d.getElementById("added-list").textContent));
    d.getElementById("reveal-btn").dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
    const receiptHtml = d.getElementById("receipt").innerHTML;
    ok("unmatched tool renders in receipt without crashing", /Some Random Internal Tool/.test(receiptHtml));
  }

  /* -------------------- quick-add buttons -------------------- */
  console.log("\nQUICK-ADD:");
  {
    const { dom, w } = boot();
    await new Promise((r) => setTimeout(r, 350));
    const d = w.document;
    d.querySelector('button[data-ex="ChatGPT Plus"]').dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
    ok("quick-add button adds ChatGPT Plus at $20", /ChatGPT Plus/.test(d.getElementById("added-list").textContent) && /\$20\/mo/.test(d.getElementById("added-list").textContent));
  }

  /* -------------------- shareable link round-trip -------------------- */
  console.log("\nSHAREABLE LINK:");
  {
    const { dom, w } = boot();
    await new Promise((r) => setTimeout(r, 350));
    const d = w.document;
    addViaUI(w, d, "ChatGPT", 20);
    addViaUI(w, d, "Jasper", 49);
    d.getElementById("copy-link").dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
    ok("hash gets populated on copy", /^#s=/.test(w.location.hash));

    // second "visit" loading that same hash should restore the list
    const { dom: dom2, w: w2 } = boot();
    w2.location.hash = w.location.hash;
    await new Promise((r) => setTimeout(r, 350));
    ok("reload from shared link restores both tools", /ChatGPT/.test(w2.document.getElementById("added-list").textContent) && /Jasper/.test(w2.document.getElementById("added-list").textContent));
  }

  /* -------------------- save-as-image doesn't throw -------------------- */
  console.log("\nSAVE AS IMAGE:");
  {
    const { dom, w, getDownloadClicked } = boot();
    await new Promise((r) => setTimeout(r, 350));
    const d = w.document;
    addViaUI(w, d, "ChatGPT", 20);
    let threw = false;
    try {
      d.getElementById("save-img").dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
    } catch (e) { threw = true; console.log("    error:", e.message); }
    ok("save-as-image runs without throwing", !threw);
    ok("triggers a download click", getDownloadClicked());
  }

  /* -------------------- start over -------------------- */
  console.log("\nSTART OVER:");
  {
    const { dom, w } = boot();
    await new Promise((r) => setTimeout(r, 350));
    const d = w.document;
    addViaUI(w, d, "ChatGPT", 20);
    d.getElementById("reveal-btn").dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
    ok("receipt shown before reset", d.getElementById("receipt-wrap").classList.contains("show"));
    d.getElementById("start-over").dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
    ok("added list cleared", d.getElementById("added-list").innerHTML === "");
    ok("receipt hidden again", !d.getElementById("receipt-wrap").classList.contains("show"));
  }

  console.log("\n" + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
}

run();
