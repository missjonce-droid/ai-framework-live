// ============================================================
// a11y-enhancements.js
//
// Accessibility patches for the compiled React bundle, which we do
// not have the source for.
//
// Hard rule in this file: never create, move or remove nodes inside
// #root. React owns that subtree, and restructuring it from outside
// causes reconciliation crashes. Everything below either sets an
// attribute on a node that already exists, or inserts an element as
// a sibling of #root, where React will never look.
// ============================================================

(function () {
  "use strict";

  // Every form control needs an accessible name. Today a screen reader
  // announces both search boxes and the newsletter field as just "edit
  // text", because they carry only placeholder text, and a placeholder
  // is not a label.
  function labelFormControls() {
    var controls = document.querySelectorAll("input, select, textarea");
    for (var i = 0; i < controls.length; i++) {
      var el = controls[i];
      if (el.type === "hidden") continue;
      if (el.getAttribute("aria-label")) continue;
      if (el.getAttribute("aria-labelledby")) continue;
      if (el.closest("label")) continue;
      if (el.id && document.querySelector('label[for="' + CSS.escape(el.id) + '"]')) continue;

      var name = el.getAttribute("placeholder") || el.getAttribute("name") || el.type;
      if (!name) continue;
      el.setAttribute("aria-label", String(name).replace(/\u2026\s*$/, "").trim());
    }
  }

  // Name each top-level section after its own heading. A <section> that
  // has an accessible name is exposed as a landmark, which is what lets
  // a screen reader user jump between blocks of the page instead of
  // arrowing through all of it. Returns the first section so the skip
  // link has somewhere to point.
  function nameSections() {
    var page = document.querySelector(".page");
    if (!page) return null;

    var first = null;
    for (var i = 0; i < page.children.length; i++) {
      var el = page.children[i];
      if (el.tagName !== "SECTION") continue;
      if (!first) first = el;
      if (el.getAttribute("aria-label")) continue;
      if (el.getAttribute("aria-labelledby")) continue;

      var heading = el.querySelector("h1, h2, h3");
      if (!heading || !heading.textContent) continue;
      var text = heading.textContent.replace(/\s+/g, " ").trim();
      if (!text) continue;
      el.setAttribute("aria-label", text.slice(0, 80));
    }
    return first;
  }

  // The standard way to let keyboard users jump past the header. It is
  // inserted before #root so it sits outside React's tree, and it is the
  // first thing focus reaches. tabindex="-1" on the target makes the jump
  // actually move focus rather than only scrolling.
  function addSkipLink(target) {
    if (!target) return;
    if (document.querySelector(".skip-to-content")) return;

    var root = document.getElementById("root");
    if (!root || !root.parentNode) return;

    if (!target.id) target.id = "main-content";
    if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");

    var link = document.createElement("a");
    link.className = "skip-to-content";
    link.href = "#" + target.id;
    link.textContent = "Skip to main content";
    root.parentNode.insertBefore(link, root);
  }

  function apply() {
    try {
      labelFormControls();
      addSkipLink(nameSections());
    } catch (e) {
      // Deliberately silent. This is presentation polish, not core
      // functionality, and it must never surface an error to a visitor.
    }
  }

  // React renders after this script runs and re-renders on client-side
  // navigation, so the patches have to be reapplied when the DOM changes.
  // The observer watches childList only, and this file only ever sets
  // attributes, so it cannot retrigger itself into a loop. The debounce
  // keeps a busy render from turning this into a hot path.
  var queued = false;
  function schedule() {
    if (queued) return;
    queued = true;
    setTimeout(function () {
      queued = false;
      apply();
    }, 200);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", apply);
  } else {
    apply();
  }

  if (window.MutationObserver) {
    new MutationObserver(schedule).observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }
})();
