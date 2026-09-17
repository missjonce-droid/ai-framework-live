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
  // arrowing through all of it.
  //
  // ".page" is the application shell. The hand-written pages - the
  // homepage, the wire, the receipt, the prompt lab - wrap their content
  // in <main> instead, so both are checked.
  function nameSections() {
    var page = document.querySelector(".page") || document.querySelector("main");
    if (!page) return;

    for (var i = 0; i < page.children.length; i++) {
      var el = page.children[i];
      if (el.tagName !== "SECTION") continue;
      if (el.getAttribute("aria-label")) continue;
      if (el.getAttribute("aria-labelledby")) continue;

      var heading = el.querySelector("h1, h2, h3");
      if (!heading || !heading.textContent) continue;
      var text = heading.textContent.replace(/\s+/g, " ").trim();
      if (!text) continue;
      el.setAttribute("aria-label", text.slice(0, 80));
    }
  }

  // Where the skip link should land. <main> is the correct target wherever
  // one exists; the application shell has no <main>, so there the first
  // top-level section of ".page" is the closest equivalent.
  function findSkipTarget() {
    var main = document.querySelector("main");
    if (main) return main;

    var page = document.querySelector(".page");
    if (!page) return null;
    for (var i = 0; i < page.children.length; i++) {
      if (page.children[i].tagName === "SECTION") return page.children[i];
    }
    return null;
  }

  // The standard way to let keyboard users jump past the header, and the
  // first thing focus reaches. tabindex="-1" on the target makes the jump
  // actually move focus rather than only scrolling.
  //
  // On application pages it goes immediately before #root, so it sits
  // outside React's tree. On the hand-written pages there is no #root and
  // it becomes the first child of <body> instead.
  function addSkipLink(target) {
    if (!target) return;
    if (document.querySelector(".skip-to-content")) return;

    var root = document.getElementById("root");
    var parent = root && root.parentNode ? root.parentNode : document.body;
    if (!parent) return;

    if (!target.id) target.id = "main-content";
    if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");

    var link = document.createElement("a");
    link.className = "skip-to-content";
    link.href = "#" + target.id;
    link.textContent = "Skip to main content";
    parent.insertBefore(link, root || parent.firstChild);
  }

  function apply() {
    try {
      labelFormControls();
      nameSections();
      addSkipLink(findSkipTarget());
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
