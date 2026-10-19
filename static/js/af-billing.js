/* ============================================================
   AI Framework — Billing UI (Phase 5, Step B)
   Pricing buttons become real Checkout buttons ONLY when
   /api/v1/me reports billing_ready. Otherwise they stay as
   "Notify me" mailto links. No fake checkout, ever.
   ============================================================ */
(function () {
  "use strict";

  var PLAN_PRICES = { pro: "29", business: "99", agency: "299" };

  function startCheckout(plan, btn) {
    var original = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Starting checkout…";
    fetch("/api/v1/billing/checkout", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: plan }),
    })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        if (res.ok && res.j.url) { location.href = res.j.url; return; }
        btn.disabled = false;
        btn.textContent = (res.j && res.j.error) || "Try again";
        setTimeout(function () { btn.textContent = original; }, 2200);
      })
      .catch(function () { btn.disabled = false; btn.textContent = original; });
  }

  function addManageButton(auth) {
    if (!auth.user || !auth.plan || auth.plan === "free") return;
    var note = document.querySelector(".pricing-note");
    if (!note || document.querySelector("[data-manage-billing]")) return;
    var b = document.createElement("button");
    b.setAttribute("data-manage-billing", "1");
    b.className = "btn btn-secondary btn-sm";
    b.textContent = "Manage subscription";
    b.style.marginBottom = "12px";
    b.addEventListener("click", function () {
      b.disabled = true;
      b.textContent = "Opening…";
      fetch("/api/v1/billing/portal", { method: "POST", credentials: "same-origin" })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (j.url) location.href = j.url;
          else { b.disabled = false; b.textContent = "Manage subscription"; }
        })
        .catch(function () { b.disabled = false; b.textContent = "Manage subscription"; });
    });
    note.parentNode.insertBefore(b, note);
  }

  function init() {
    if (!window.AFAuth) return;
    window.AFAuth.me().then(function (auth) {
      if (!auth) return;
      addManageButton(auth);
      if (!auth.billing_ready) return;
      document.querySelectorAll("[data-plan-checkout]").forEach(function (btn) {
        var plan = btn.getAttribute("data-plan-checkout");
        btn.textContent = "Subscribe — $" + (PLAN_PRICES[plan] || "") + "/mo";
        btn.removeAttribute("href");
        btn.style.cursor = "pointer";
        btn.addEventListener("click", function (e) {
          e.preventDefault();
          if (!auth.user) {
            var slot = document.querySelector("[data-af-auth]");
            if (slot) slot.scrollIntoView({ behavior: "smooth", block: "center" });
            return;
          }
          startCheckout(plan, btn);
        });
      });
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
