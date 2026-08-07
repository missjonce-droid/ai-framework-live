/* AI Framework — Builder Buddy v1
 * A small robot who peeks over the framework builder's freeform box.
 * States: hidden → watching (pupils follow cursor, blinks) → sleepy (idle)
 *         → thinking (build clicked: eyes dart, antenna light pulses)
 *         → happy (results appeared: crescent eyes), then back to watching.
 *
 * Drop-in: <script defer src="/static/js/builder-buddy.js"></script>
 * No dependencies. Injects its own CSS. Attaches to the FIRST <textarea>
 * on the page; if none exists, does nothing. Never captures clicks.
 * Public API: window.BuilderBuddy.{show,hide,think,celebrate}
 */
(function () {
  "use strict";

  var W = 110, H = 64;                 // stage size (px)
  var reduceMotion = false;
  try {
    reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (e) {}

  var PLACEHOLDERS = [
    "e.g. I run a cleaning business and keep missing calls while I'm working\u2026",
    "e.g. I make TikToks about cooking and want to post daily without burning out\u2026",
    "e.g. I sell candles online and need product photos that don't look homemade\u2026",
    "e.g. I'm a realtor and want every listing turned into a video tour automatically\u2026",
    "e.g. I have a podcast and want clips, show notes, and posts from each episode\u2026"
  ];

  var CSS = [
    "#bb-clip{position:absolute;pointer-events:none;z-index:60;overflow:hidden;width:" + W + "px;height:" + H + "px}",
    "#bb{position:absolute;left:0;bottom:-2px;width:100%;opacity:0;transform:translateY(105%);transition:transform .45s cubic-bezier(.34,1.56,.64,1),opacity .3s ease}",
    "#bb.bb-up{opacity:1;transform:translateY(0)}",
    ".bb-head{position:relative;margin:0 auto;width:96px;height:52px;background:#1b2233;border:1px solid #2a3550;border-bottom:none;border-radius:18px 18px 4px 4px;box-shadow:0 -6px 24px rgba(0,0,0,.35)}",
    ".bb-ant{position:absolute;top:-11px;left:50%;width:2px;height:11px;background:#2a3550;transform:translateX(-50%)}",
    ".bb-dot{position:absolute;top:-17px;left:50%;transform:translateX(-50%);width:7px;height:7px;border-radius:50%;background:#4de0c0;opacity:.45;transition:opacity .3s}",
    ".bb-happy .bb-dot{opacity:1}",
    ".bb-thinking .bb-dot{opacity:1;animation:bbPulse .8s ease-in-out infinite}",
    ".bb-eyes{position:absolute;inset:0;display:flex;justify-content:center;align-items:center;gap:16px;padding-top:4px}",
    ".bb-eye{position:relative;width:19px;height:23px;background:#f2f5fa;border-radius:50%;overflow:hidden;transition:height .16s ease,background .16s ease}",
    ".bb-pupil{position:absolute;left:50%;top:50%;width:9px;height:9px;margin:-4.5px 0 0 -4.5px;background:#0f1216;border-radius:50%;transition:transform .12s linear,opacity .15s}",
    ".bb-blink .bb-eye{height:3px}",
    ".bb-sleepy .bb-eye{height:9px}",
    ".bb-sleepy .bb-pupil{margin-top:-2px}",
    ".bb-happy .bb-eye{height:11px;background:transparent;overflow:visible;border-radius:0;border-bottom:4px solid #f2f5fa;border-bottom-left-radius:14px;border-bottom-right-radius:14px}",
    ".bb-happy .bb-pupil{opacity:0}",
    ".bb-thinking .bb-pupil{animation:bbLook 1.5s ease-in-out infinite}",
    "@keyframes bbPulse{0%,100%{box-shadow:0 0 0 0 rgba(77,224,192,.55)}50%{box-shadow:0 0 0 6px rgba(77,224,192,0)}}",
    "@keyframes bbLook{0%,100%{transform:translate(-3px,-4px)}50%{transform:translate(3px,-4px)}}",
    "@media (prefers-reduced-motion:reduce){#bb{transition:opacity .2s}#bb.bb-up{transform:translateY(0)}#bb{transform:translateY(0)}.bb-dot,.bb-pupil{animation:none!important}}"
  ].join("\n");

  var ta = null, clip = null, bb = null, pupils = [], eyesBox = null;
  var state = "hidden";           // hidden | watch | sleepy | thinking | happy
  var lastActive = Date.now();
  var blinkTimer = null, happyTimer = null, thinkSafety = null;
  var resultWatcher = null, placeholderIdx = 0, originalPlaceholder = "";

  function findTextarea() {
    return (
      document.querySelector(".builder textarea, .framework-builder textarea") ||
      document.querySelector("textarea")
    );
  }

  function injectCss() {
    if (document.getElementById("bb-style")) return;
    var s = document.createElement("style");
    s.id = "bb-style";
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function buildDom() {
    clip = document.createElement("div");
    clip.id = "bb-clip";
    clip.setAttribute("aria-hidden", "true");
    bb = document.createElement("div");
    bb.id = "bb";
    bb.innerHTML =
      '<div class="bb-head"><div class="bb-ant"></div><div class="bb-dot"></div>' +
      '<div class="bb-eyes">' +
      '<div class="bb-eye"><div class="bb-pupil"></div></div>' +
      '<div class="bb-eye"><div class="bb-pupil"></div></div>' +
      "</div></div>";
    clip.appendChild(bb);
    document.body.appendChild(clip);
    pupils = Array.prototype.slice.call(bb.querySelectorAll(".bb-pupil"));
    eyesBox = bb.querySelector(".bb-eyes");
  }

  function position() {
    if (!ta || !clip) return;
    var r = ta.getBoundingClientRect();
    if (!r.width) return;
    var left = r.left + window.pageXOffset + Math.max(r.width - W - 22, 8);
    var top = r.top + window.pageYOffset - H + 6; // bottom edge tucks behind the box
    clip.style.left = left + "px";
    clip.style.top = top + "px";
  }

  function setState(next) {
    if (!bb) return;
    state = next;
    bb.classList.toggle("bb-thinking", next === "thinking");
    bb.classList.toggle("bb-happy", next === "happy");
    bb.classList.toggle("bb-sleepy", next === "sleepy");
  }

  function show() {
    if (!bb) return;
    position();
    bb.classList.add("bb-up");
    if (state === "hidden") setState("watch");
  }

  function hide() {
    if (!bb) return;
    bb.classList.remove("bb-up");
    setState("hidden");
  }

  function maybeHide() {
    window.setTimeout(function () {
      if (ta && document.activeElement !== ta && !ta.value && state !== "thinking") hide();
    }, 550);
  }

  /* ------- eyes ------- */
  function movePupils(dx, dy) {
    for (var i = 0; i < pupils.length; i++) {
      pupils[i].style.transform = "translate(" + dx + "px," + dy + "px)";
    }
  }

  var rafPending = false, mouseX = 0, mouseY = 0;
  function onMouse(e) {
    mouseX = e.clientX; mouseY = e.clientY;
    lastActive = Date.now();
    if (state === "sleepy") setState("watch");
    if (rafPending || reduceMotion) return;
    rafPending = true;
    window.requestAnimationFrame(function () {
      rafPending = false;
      if (state !== "watch" && state !== "sleepy") return;
      if (!eyesBox) return;
      var r = eyesBox.getBoundingClientRect();
      var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      var dx = Math.max(-3.5, Math.min(3.5, (mouseX - cx) / 55));
      var dy = Math.max(-3.5, Math.min(3.5, (mouseY - cy) / 55));
      movePupils(dx, dy);
    });
  }

  function scheduleBlink() {
    blinkTimer = window.setTimeout(function () {
      if (bb && state !== "happy" && bb.classList.contains("bb-up")) {
        bb.classList.add("bb-blink");
        window.setTimeout(function () { bb.classList.remove("bb-blink"); }, 150);
      }
      scheduleBlink();
    }, 2600 + Math.random() * 3600);
  }

  /* ------- moods ------- */
  function think() {
    show();
    setState("thinking");
    window.clearTimeout(thinkSafety);
    thinkSafety = window.setTimeout(function () {
      if (state === "thinking") setState("watch");
    }, 45000);
    armResultWatcher();
  }

  function celebrate() {
    if (!bb) return;
    window.clearTimeout(thinkSafety);
    show();
    setState("happy");
    movePupils(0, 0);
    window.clearTimeout(happyTimer);
    happyTimer = window.setTimeout(function () {
      setState("watch");
      maybeHide();
    }, 2400);
  }

  function armResultWatcher() {
    if (resultWatcher) resultWatcher.disconnect();
    var started = Date.now();
    resultWatcher = new MutationObserver(function (records) {
      for (var i = 0; i < records.length; i++) {
        var added = records[i].addedNodes;
        for (var j = 0; j < added.length; j++) {
          var n = added[j];
          if (n && n.textContent && n.textContent.length > 300) {
            resultWatcher.disconnect();
            resultWatcher = null;
            position();
            celebrate();
            return;
          }
        }
      }
      if (Date.now() - started > 30000 && resultWatcher) {
        resultWatcher.disconnect();
        resultWatcher = null;
      }
    });
    resultWatcher.observe(document.body, { childList: true, subtree: true });
  }

  /* ------- smarter placeholders ------- */
  function rotatePlaceholder() {
    if (!ta) return;
    if (document.activeElement !== ta && !ta.value) {
      ta.placeholder = PLACEHOLDERS[placeholderIdx % PLACEHOLDERS.length];
      placeholderIdx++;
    }
  }

  /* ------- wiring ------- */
  function wire() {
    ta.addEventListener("focus", function () { lastActive = Date.now(); show(); });
    ta.addEventListener("mouseenter", function () { show(); });
    ta.addEventListener("input", function () {
      lastActive = Date.now();
      if (state === "sleepy") setState("watch");
    });
    ta.addEventListener("blur", maybeHide);

    document.addEventListener("mousemove", onMouse, { passive: true });

    // Build button → thinking. Matches by visible label, so no coupling
    // to the app's internal class names.
    document.addEventListener("click", function (e) {
      var el = e.target && e.target.closest && e.target.closest("button, a");
      if (!el) return;
      var label = (el.textContent || "").replace(/\s+/g, " ").trim();
      if (/build my (stack|framework)/i.test(label)) think();
    });

    window.addEventListener("resize", position);
    // Early layout shifts (fonts, images): re-anchor a few times, then stop.
    var fixes = 0;
    var fixTimer = window.setInterval(function () {
      position();
      if (++fixes >= 8) window.clearInterval(fixTimer);
    }, 1200);

    // Sleepy after ~22s of stillness.
    window.setInterval(function () {
      if (state === "watch" && Date.now() - lastActive > 22000) setState("sleepy");
    }, 5000);

    originalPlaceholder = ta.placeholder || "";
    if (originalPlaceholder) PLACEHOLDERS.unshift(originalPlaceholder);
    window.setInterval(rotatePlaceholder, 4500);

    scheduleBlink();
  }

  function init() {
    ta = findTextarea();
    if (!ta) {
      // SPA may render late — retry briefly, then give up silently.
      var tries = 0;
      var t = window.setInterval(function () {
        ta = findTextarea();
        if (ta) { window.clearInterval(t); start(); }
        else if (++tries > 20) window.clearInterval(t);
      }, 500);
      return;
    }
    start();
  }

  function start() {
    injectCss();
    buildDom();
    position();
    wire();
    window.BuilderBuddy = { show: show, hide: hide, think: think, celebrate: celebrate };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
