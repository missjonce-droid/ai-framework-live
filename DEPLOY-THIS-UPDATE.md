# AI Framework complete update

This package is the complete deployable site. Upload its contents to the **root of the existing GitHub repository** that Netlify already deploys.

## Before uploading

1. Download and extract the ZIP on your computer.
2. Open the existing `ai-framework-live` repository on GitHub.
3. Make sure you are on the branch Netlify deploys, usually `main`.

## Upload location

Upload the **contents inside** the `ai-framework-live-main` folder to the repository root.

Correct:

```text
index.html
_redirects
static/
prompts/
personalize-ai/
world-ai/
vault/
```

Incorrect:

```text
ai-framework-live-main/
  index.html
  static/
```

The repository root should show `index.html` immediately, not another folder containing it.

## Important files in this update

- `static/js/site-enhancements.js` - includes the navigation freeze fix and Advanced-section safeguards.
- `prompts/index.html` - free encyclopedia-style Prompt Codex page.
- `vault/AI-Framework-Prompt-Codex.pdf` - the real 100-entry paid product.
- `vault-thank-you/index.html` - delivers both paid PDFs after checkout.
- `personalize-ai/index.html` - interactive Context Capsule builder.
- `world-ai/index.html` - AI Around the World, applied ecosystems, and BRIDGE policy framework.
- `advanced/index.html` - replaces the old incorrectly labeled 300-item list with a real 100-entry Advanced shelf. It includes 18 adult/uncensored entries plus local models, synthetic media, safety, privacy, OSINT, and defensive security.
- `content-policy/`, `report/`, `terms/`, `privacy/`, and `affiliate-disclosure/` - essential trust and safety pages.

## After GitHub finishes the upload

1. Wait for the Netlify deployment to finish.
2. Open these pages in a private/incognito window:
   - `https://ai-framework.io/`
   - `https://ai-framework.io/prompts/`
   - `https://ai-framework.io/personalize-ai/`
   - `https://ai-framework.io/world-ai/`
   - `https://ai-framework.io/advanced`
3. On the Advanced page, confirm the 18+ gate and the stronger safety notice appear.
4. Test a free prompt copy button and the Context Capsule copy button.
5. Confirm the Stripe product's success URL is:
   `https://ai-framework.io/vault-thank-you/`
6. Run a real low-cost checkout test before marketing the paid product.

## Do not publish 100 additional adult-specific listings yet

The Advanced section now has a real 100-entry collection, stronger warnings, reporting, and noindex protection. Only 18 entries are adult/uncensored; the remaining listings cover local models, synthetic media, detection and safety, privacy, OSINT, forensics, and defensive security.

Adding 100 more adult-specific products still requires individual review. Confirm that every product excludes minors and non-consensual imagery, has a legitimate consensual adult use, has a working abuse-reporting process, and does not create a conflict with the site's payment processor, advertising accounts, or affiliate program.
