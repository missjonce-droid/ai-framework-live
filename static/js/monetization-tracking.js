(function () {
  "use strict";

  if (
    document.documentElement.getAttribute("data-monetization-tracking") ===
    "true"
  )
    return;
  document.documentElement.setAttribute("data-monetization-tracking", "true");

  document.addEventListener("click", function (event) {
    var link = event.target.closest && event.target.closest("a[href]");
    if (!link) return;

    var href = link.getAttribute("href") || "";
    var eventName = "";

    if (href.indexOf("https://buy.stripe.com/") === 0) {
      eventName = "vault_checkout_opened";
    } else if (href.indexOf("https://try.elevenlabs.io/") === 0) {
      eventName = "affiliate_partner_clicked";
    } else if (
      href.indexOf("mailto:hello@ai-framework.io") === 0 &&
      href.indexOf("Custom%20AI%20Framework%20Session") >= 0
    ) {
      eventName = "custom_framework_session_requested";
    } else if (href.indexOf("/build-my-framework") === 0) {
      eventName = "framework_builder_opened";
    }

    if (!eventName) return;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: eventName,
      source_path: window.location.pathname,
      link_label: (link.textContent || "").replace(/\s+/g, " ").trim(),
    });
  });
})();
