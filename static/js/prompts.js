(function () {
  "use strict";

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }

    var textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
    return Promise.resolve();
  }

  Array.prototype.forEach.call(
    document.querySelectorAll("[data-copy-target]"),
    function (button) {
      button.addEventListener("click", function () {
        var target = document.getElementById(
          button.getAttribute("data-copy-target"),
        );
        if (!target) return;

        copyText(target.textContent.trim()).then(function () {
          var original = button.textContent;
          button.textContent = "Copied";
          button.classList.add("copied");
          window.setTimeout(function () {
            button.textContent = original;
            button.classList.remove("copied");
          }, 1800);

          window.dataLayer = window.dataLayer || [];
          window.dataLayer.push({
            event: "free_prompt_copied",
            prompt_id: target.id,
          });
        });
      });
    },
  );
})();
