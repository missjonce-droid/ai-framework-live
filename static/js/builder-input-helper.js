/* AI Framework — builder input helper
 *
 * Replaces the earlier "Builder Buddy" robot mascot, which was removed:
 * it read as cartoony against the rest of the site, and its fixed-position
 * stage sat over the input on narrow screens.
 *
 * What's kept is the one thing that actually helped people: rotating real
 * example prompts through the textarea's placeholder, so someone staring at
 * an empty box can see the shape of a good answer. Rotation pauses the
 * moment they start typing and never returns, so it can't move under them
 * mid-thought.
 *
 * No dependencies, no injected chrome, no fixed positioning, no cursor
 * tracking. Attaches to the first <textarea> on the page; if there isn't
 * one, it does nothing.
 */
(function () {
  "use strict";

  var EXAMPLES = [
    "e.g. I run a cleaning business and keep missing calls while I'm working\u2026",
    "e.g. I make TikToks about cooking and want to post daily without burning out\u2026",
    "e.g. I sell candles online and need product photos that don't look homemade\u2026",
    "e.g. I'm a realtor and want every listing turned into a video tour automatically\u2026",
    "e.g. I have a podcast and want clips, show notes, and posts from each episode\u2026",
  ];

  var ROTATE_MS = 5000;

  var textarea = null;
  var index = 0;
  var timer = null;
  var stopped = false;

  function stop() {
    if (stopped) return;
    stopped = true;
    if (timer) window.clearInterval(timer);
    timer = null;
  }

  function rotate() {
    if (stopped || !textarea) return;
    // Never swap text out from under someone mid-sentence.
    if (textarea.value || document.activeElement === textarea) {
      stop();
      return;
    }
    textarea.placeholder = EXAMPLES[index % EXAMPLES.length];
    index += 1;
  }

  function start() {
    var original = (textarea.placeholder || "").trim();
    if (original && EXAMPLES.indexOf(original) === -1) {
      EXAMPLES.unshift(original);
    }

    // Respect people who've asked their system to cut down on motion.
    var reduceMotion = false;
    try {
      reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (e) {}
    if (reduceMotion) return;

    textarea.addEventListener("input", stop);
    textarea.addEventListener("focus", stop);
    timer = window.setInterval(rotate, ROTATE_MS);
  }

  function init() {
    textarea = document.querySelector("textarea");
    if (textarea) {
      start();
      return;
    }
    // The builder is a single-page app; the box may render after this runs.
    var tries = 0;
    var poll = window.setInterval(function () {
      textarea = document.querySelector("textarea");
      if (textarea) {
        window.clearInterval(poll);
        start();
      } else if (++tries > 20) {
        window.clearInterval(poll);
      }
    }, 500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
