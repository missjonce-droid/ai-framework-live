(function () {
  'use strict';
  document.querySelectorAll('[data-copy]').forEach(function (button) {
    button.addEventListener('click', async function () {
      var text = document.getElementById(button.getAttribute('data-copy')).textContent;
      var status = document.getElementById('copy-status');
      try { await navigator.clipboard.writeText(text); status.textContent = 'Copied. Paste it into your assistant and replace the bracketed text.'; }
      catch (error) { status.textContent = 'Select the example text and copy it using your device’s copy command.'; }
    });
  });
})();
