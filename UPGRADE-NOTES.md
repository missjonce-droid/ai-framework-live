# AI Framework launch upgrade

This folder is a deploy-ready static build for `ai-framework.io`. The existing
directory, playbooks, Premium Vault, Stripe checkout, tutorials, and resource
data remain in place.

## What changed

- Fixed a navigation freeze caused by the enhancement observer repeatedly
  reacting to its own metadata updates.
- Added the interactive `/build-my-framework/` experience with eight
  outcome-based frameworks, budget and experience options, recommended tool
  stacks, implementation sequences, shareable URLs, saved frameworks, and
  print-to-PDF support.
- Added tool saving on resource profiles and a direct path from each profile
  into the Framework Builder.
- Replaced empty social-proof states such as zero clicks and unrated blocks
  with more useful trust and action elements.
- Added a $149 Custom AI Framework Session lead path. It currently opens an
  email to `hello@ai-framework.io`.
- Preserved both existing $39 Premium Vault Stripe checkout calls to action.
- Corrected the production robots and sitemap references.
- Added unique static HTML, canonical metadata, social metadata, crawlable
  fallback content, and structured data for resource and category routes.
- Added a quality gate: all 1,526 public directory profiles remain available,
  while the 120 profiles with substantive descriptions are indexable. Thin
  profiles use `noindex, follow` and are excluded from the sitemap.
- Added a 1200×630 social sharing card.
- Corrected the invalid Featured Partner placement and labeled its link
  `sponsored nofollow`.
- Added responsive navigation fixes and valid metadata to Playbooks and
  Tutorials.

## Deployment

This archive contains a compiled static deployment, not the editable React
source. No production build command is required.

1. Replace the contents of the live deployment branch with this folder.
2. Keep the existing Netlify site/domain settings.
3. Deploy the branch.
4. Verify these routes:
   - `/`
   - `/build-my-framework/`
   - `/tool/chatgpt`
   - `/category/text-writing`
   - `/playbooks/`
   - `/tutorials/`
   - `/sitemap.xml`
   - `/robots.txt`
5. If the embedded resource data changes, run:

   ```bash
   node scripts/generate-seo.mjs
   node scripts/validate-site.mjs
   ```

Because the main application is a minified production bundle, future React
rebuilds should move these improvements into the original source application
before replacing this deployment.

## Analytics events

The site pushes these events to the existing Google Tag Manager data layer:

- `framework_builder_opened`
- `framework_generated`
- `tool_saved`
- `tool_unsaved`
- `outbound_tool_click`
- `newsletter_signup`
- `vault_checkout_opened`
- `affiliate_partner_clicked`
- `custom_framework_session_requested`

In GA4, mark `framework_generated`, `vault_checkout_opened`, and
`custom_framework_session_requested` as key events. Confirm that the existing
GTM container forwards the other events to GA4.

## Search launch checklist

1. Submit `https://ai-framework.io/sitemap.xml` in Google Search Console.
2. Inspect the homepage, Framework Builder, one category page, and several
   substantive tool profiles.
3. Request indexing only for important indexable pages, not the thin profiles.
4. Track coverage, duplicate canonicals, crawl errors, impressions, and
   non-brand queries weekly for the first month.
5. Expand the best 20–30 commercial-intent tool profiles with original
   screenshots, pricing verification, a clear “best for” judgment, limitations,
   and a human review date.

## Monetization follow-up

The immediate funnel is:

`Framework Builder → saved/recommended stack → $149 custom session`

The $39 Vault remains the existing lower-cost purchase. Before paid promotion,
replace the custom-session email link with a direct booking and payment flow,
then verify the entire purchase journey on mobile.
