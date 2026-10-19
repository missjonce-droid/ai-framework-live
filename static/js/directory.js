/* ============================================================
   AI Framework — Directory page (Phase 4)
   Consumes /data/directory-index.json through the repo's own
   FrameworkDirectory module (static/js/directory-search.js).
   No invented data: everything rendered comes from the index.
   Favorites persist in this browser (localStorage).
   ============================================================ */
(function () {
  "use strict";

  var PAGE = 48;
  var FAV_KEY = "af_dir_favs_v1";

  var state = {
    entries: [], categories: [],
    q: "", plan: "all", cat: "all", favOnly: false, sort: "relevance",
    shown: PAGE, favs: {}
  };

  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function loadFavs() {
    try { state.favs = JSON.parse(localStorage.getItem(FAV_KEY) || "{}"); }
    catch (e) { state.favs = {}; }
  }
  function saveFavs() {
    try { localStorage.setItem(FAV_KEY, JSON.stringify(state.favs)); } catch (e) {}
  }

  function priceBand(p) {
    var v = String(p || "").toLowerCase();
    if (v === "free") return ["free", "Free"];
    if (v === "freemium" || v === "open-source") return ["freemium", "Freemium"];
    if (v === "paid" || v === "subscription" || v === "usage-based") return ["paid", "Paid"];
    return ["other", v ? v.charAt(0).toUpperCase() + v.slice(1) : "—"];
  }

  function currentList() {
    var FD = window.FrameworkDirectory;
    var list = FD.filter(state.entries, state.q, state.plan);
    if (state.cat !== "all") {
      list = list.filter(function (e) { return (e.categories || []).indexOf(state.cat) !== -1; });
    }
    if (state.favOnly) {
      list = list.filter(function (e) { return state.favs[e.slug]; });
    }
    if (state.sort === "az") {
      list = list.slice().sort(function (a, b) { return a.name.localeCompare(b.name); });
    }
    return list;
  }

  function cardHTML(e) {
    var band = priceBand(e.pricing);
    var fav = state.favs[e.slug] ? " on" : "";
    var star = state.favs[e.slug] ? "★" : "☆";
    return '<article class="card d-card">'
      + '<div class="d-top"><span class="d-avatar" aria-hidden="true">' + esc(e.name.charAt(0)) + "</span>"
      + "<div><h3><a href=\"https://ai-framework.io" + esc(e.path) + "\">" + esc(e.name) + "</a></h3>"
      + '<span class="d-cat">' + esc(e.category || "") + "</span></div></div>"
      + '<p class="d-desc">' + esc(e.description || "") + "</p>"
      + '<div class="d-foot"><span class="d-price ' + band[0] + '">' + esc(band[1]) + "</span>"
      + '<button class="d-fav' + fav + '" data-fav="' + esc(e.slug) + '" aria-label="Save ' + esc(e.name) + ' to favorites" aria-pressed="' + (state.favs[e.slug] ? "true" : "false") + '">' + star + "</button></div>"
      + "</article>";
  }

  function render() {
    var grid = document.getElementById("dirGrid");
    var meta = document.getElementById("dirMeta");
    var more = document.getElementById("dirMore");
    var list = currentList();
    var shown = list.slice(0, state.shown);

    meta.innerHTML = "<span aria-live=\"polite\">" + list.length + " tool" + (list.length === 1 ? "" : "s")
      + (state.q ? ' for "' + esc(state.q) + '"' : "") + "</span>"
      + (Object.keys(state.favs).length ? "<span>★ " + Object.keys(state.favs).length + " saved</span>" : "");

    if (!list.length) {
      grid.innerHTML = '<div class="dir-empty"><h3>No tools match</h3><p>Try fewer words, a different category, or clear the filters.</p></div>';
    } else {
      grid.innerHTML = shown.map(cardHTML).join("");
    }
    more.style.display = list.length > state.shown ? "block" : "none";

    grid.querySelectorAll("[data-fav]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var slug = btn.getAttribute("data-fav");
        if (state.favs[slug]) delete state.favs[slug]; else state.favs[slug] = true;
        saveFavs();
        render();
      });
    });
  }

  function wire() {
    var q = document.getElementById("dirQ");
    var go = document.getElementById("dirGo");
    var planChips = document.querySelectorAll("#planChips .f-chip");
    var catSel = document.getElementById("dirCat");
    var sortSel = document.getElementById("dirSort");
    var favChip = document.getElementById("favChip");
    var moreBtn = document.getElementById("dirMoreBtn");
    var timer = null;

    function apply() { state.shown = PAGE; render(); }

    q.addEventListener("input", function () {
      clearTimeout(timer);
      timer = setTimeout(function () { state.q = q.value; apply(); }, 220);
    });
    q.addEventListener("keydown", function (e) { if (e.key === "Enter") { state.q = q.value; apply(); } });
    go.addEventListener("click", function () { state.q = q.value; apply(); });

    planChips.forEach(function (c) {
      c.addEventListener("click", function () {
        planChips.forEach(function (x) { x.classList.remove("active"); });
        c.classList.add("active");
        state.plan = c.getAttribute("data-plan");
        apply();
      });
    });
    catSel.addEventListener("change", function () { state.cat = catSel.value; apply(); });
    sortSel.addEventListener("change", function () { state.sort = sortSel.value; apply(); });
    favChip.addEventListener("click", function () {
      state.favOnly = !state.favOnly;
      favChip.classList.toggle("active", state.favOnly);
      apply();
    });
    moreBtn.addEventListener("click", function () { state.shown += PAGE; render(); });
  }

  function fail(msg) {
    document.getElementById("dirGrid").innerHTML =
      '<div class="dir-empty"><h3>Couldn\'t load the directory</h3><p>' + esc(msg) + "</p></div>";
  }

  function init() {
    if (!window.FrameworkDirectory) { fail("Search module not loaded."); return; }
    loadFavs();
    wire();
    fetch("../data/directory-index.json")
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (data) {
        state.entries = window.FrameworkDirectory.prepare(data);
        state.categories = (data.categories || []).slice().sort();
        var sel = document.getElementById("dirCat");
        state.categories.forEach(function (c) {
          var o = document.createElement("option");
          o.value = c; o.textContent = c;
          sel.appendChild(o);
        });
        render();
      })
      .catch(function (err) { fail("The tool index didn't load. Check your connection and refresh. (" + err.message + ")"); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  window.AFDirectory = { currentList: currentList, priceBand: priceBand };
})();
