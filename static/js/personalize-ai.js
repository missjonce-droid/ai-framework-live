(function () {
  "use strict";

  var form = document.getElementById("capsule-form");
  var output = document.getElementById("capsule-output");
  var copyButton = document.getElementById("copy-capsule");
  var copyStatus = document.getElementById("copy-status");
  if (!form || !output || !copyButton) return;

  function value(id, fallback) {
    var field = document.getElementById(id);
    var result = field && field.value.trim();
    return result || fallback;
  }

  function render() {
    output.textContent = [
      "MY CONTEXT CAPSULE",
      "",
      "ROLE AND SITUATION",
      value("role", "[Describe your role and current situation]"),
      "",
      "CURRENT GOALS",
      value("goals", "[List the outcomes that matter now]"),
      "",
      "AUDIENCE OR STAKEHOLDERS",
      value("audience", "[Who the work is for or affects]"),
      "",
      "HOW TO COMMUNICATE WITH ME",
      value("voice", "Use clear, direct language. Explain unfamiliar terms and lead with the conclusion."),
      "",
      "DELIVERABLES I PREFER",
      value("formats", "Give a concise recommendation followed by concrete next steps. Use a table only when it makes a comparison easier."),
      "",
      "CONSTRAINTS AND NON-NEGOTIABLES",
      value("constraints", "[List budget, time, tool, accessibility, brand, legal, or approval constraints]"),
      "",
      "AVOID",
      value("avoid", "Do not invent facts, hide uncertainty, overpromise results, or agree with me merely to be agreeable."),
      "",
      "QUALITY AND DECISION RULES",
      value("quality", "Separate facts, assumptions, and recommendations. Verify facts that may have changed. Identify the most important risk and the smallest useful next step."),
      "",
      "WORKING AGREEMENT",
      "Use this capsule as context, not as permission to expose private information or take external actions. Ask before making an irreversible decision, spending money, publishing, sending, deleting, or sharing. If a request involves legal, medical, financial, safety, or other high-stakes judgment, explain the limits of the answer and recommend appropriate verification.",
      "",
      "Before finalizing important work, check that the result follows these instructions, addresses the actual goal, respects the constraints, and clearly labels uncertainty."
    ].join("\n");
  }

  form.addEventListener("input", render);
  copyButton.addEventListener("click", function () {
    var text = output.textContent;
    var copy = navigator.clipboard && navigator.clipboard.writeText
      ? navigator.clipboard.writeText(text)
      : Promise.reject(new Error("Clipboard unavailable"));

    copy.then(function () {
      copyButton.textContent = "Copied";
      copyStatus.textContent = "Copied. Review it again before pasting into an AI platform.";
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: "context_capsule_copied" });
      window.setTimeout(function () {
        copyButton.textContent = "Copy Context Capsule";
      }, 1800);
    }).catch(function () {
      var selection = window.getSelection();
      var range = document.createRange();
      range.selectNodeContents(output);
      selection.removeAllRanges();
      selection.addRange(range);
      copyStatus.textContent = "Clipboard access is blocked. The capsule is selected for manual copying.";
    });
  });

  render();
})();
