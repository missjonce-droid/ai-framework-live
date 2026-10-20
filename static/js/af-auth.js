/* ============================================================
   AI Framework — Auth client (Phase 5, Step A)
   Magic-link sign-in. No fake state: every status comes from
   /api/v1/me. Logged-out behavior of every page is unchanged.
   ============================================================ */
(function () {
  "use strict";

  var cached = null;
  var pending = null;

  function me() {
    if (cached) return Promise.resolve(cached);
    if (pending) return pending;
    pending = fetch("/api/v1/me", { credentials: "same-origin" })
      .then(function (r) { return r.ok ? r.json() : { user: null }; })
      .then(function (j) {
        cached = j && j.user ? j : null;
        pending = null;
        return cached;
      })
      .catch(function () { pending = null; return null; });
    return pending;
  }

  function requestLink(email) {
    return fetch("/api/v1/auth/magic-link", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email }),
    }).then(function (r) { return r.json(); });
  }

  function logout() {
    return fetch("/api/v1/auth/logout", { method: "POST", credentials: "same-origin" })
      .then(function () { cached = null; location.reload(); })
      .catch(function () { location.reload(); });
  }

  function injectStyles() {
    if (document.getElementById("af-auth-css")) return;
    var s = document.createElement("style");
    s.id = "af-auth-css";
    s.textContent =
      ".af-auth-slot{display:inline-flex;align-items:center;gap:8px}" +
      ".af-auth-email{font-size:13px;color:var(--muted);max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}" +
      ".af-login-form{display:flex;gap:8px;align-items:center}" +
      ".af-login-form input{background:rgba(255,255,255,.05);border:1px solid var(--border);border-radius:10px;color:var(--text);font-size:13px;padding:8px 12px;font-family:var(--font-body);width:200px}" +
      ".af-login-form input:focus{outline:none;border-color:var(--accent)}" +
      ".af-auth-msg{font-size:12px;color:var(--faint);margin:4px 0 0;max-width:260px}";
    document.head.appendChild(s);
  }

  function showLoginForm(slot) {
    slot.innerHTML =
      '<form class="af-login-form" data-af-form>' +
      '<input type="email" required placeholder="you@work.com" aria-label="Email address" autocomplete="email">' +
      '<button class="btn btn-primary btn-sm" type="submit">Send link</button></form>' +
      '<p class="af-auth-msg" data-af-msg></p>';
    var form = slot.querySelector("[data-af-form]");
    var msg = slot.querySelector("[data-af-msg]");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = form.querySelector("input").value.trim();
      msg.textContent = "Sending…";
      requestLink(email).then(function (j) {
        msg.textContent = j && j.error ? j.error : "Check your email for the sign-in link.";
      }).catch(function () {
        msg.textContent = "Something went wrong. Try again.";
      });
    });
    form.querySelector("input").focus();
  }

  function renderSlots(auth) {
    document.querySelectorAll("[data-af-auth]").forEach(function (slot) {
      slot.classList.add("af-auth-slot");
      if (auth && auth.user) {
        slot.innerHTML = "";
        var em = document.createElement("span");
        em.className = "af-auth-email";
        em.textContent = auth.user.email;
        em.title = auth.user.email;
        var out = document.createElement("button");
        out.className = "btn btn-secondary btn-sm";
        out.textContent = "Sign out";
        out.addEventListener("click", logout);
        slot.appendChild(em);
        slot.appendChild(out);
      } else {
        slot.innerHTML = "";
        var btn = document.createElement("button");
        btn.className = "btn btn-secondary btn-sm";
        btn.textContent = "Sign in";
        btn.addEventListener("click", function () { showLoginForm(slot); });
        slot.appendChild(btn);
      }
    });
  }

  window.AFAuth = { me: me, requestLink: requestLink, logout: logout };

  function init() {
    injectStyles();
    me().then(renderSlots);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
