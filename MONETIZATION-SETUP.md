# AI Framework: affiliate setup and directory growth

The homepage is a static, beginner-oriented entrance to the directory. It loads a separate search index only when a visitor searches and displays 24 results per page. It does not load the full React catalog bundle.

## Activate affiliate tracking

No affiliate programs or tracking links have been invented or activated. Apply to programs you want to work with and obtain your approved tracking URLs. Add only approved links to `data/affiliate-links.json`:

```json
{
  "links": {
    "existing-tool-slug": {
      "url": "https://provider.example/your-approved-tracking-link",
      "approved": true
    }
  }
}
```

Replace the example slug and URL with a real catalog listing and approved provider URL. The redirect generator rejects unknown tools, unapproved entries, non-HTTPS destinations, embedded credentials, and links back to this site's own hosting domain.

Run:

```bash
node scripts/generate-redirects.mjs
node scripts/export-directory.mjs
node scripts/test-homepage.mjs
node scripts/validate-site.mjs
```

The existing `/go/<slug>` route then uses the tracking URL. Search results identify configured affiliate links next to the provider action; the shared enhancement script labels outbound affiliate links on existing profiles. General disclosure is visible on the homepage. Affiliate configuration does not change search ranking. Existing analytics record clicks; provider dashboards determine commissions and completed referrals.

## Grow toward 10,000 listings

The public search index currently excludes gated listings and contains real catalog entries, not placeholders. The 10k fixture is a scalability check, not a claim that 10k tools are already listed.

1. Import permitted source records into a canonical database, keeping official website, categories, source, review date, and lifecycle status.
2. Deduplicate names and domains; check destinations; review descriptions; publish new batches around 3k, 5k, then 10k.
3. Generate profile pages, redirects, and the homepage search index from that database. Keep `schemaVersion: 1` while using this client.
4. At larger scale, add server-side paginated search and filters while retaining the homepage's 24-card presentation.
5. Keep affiliate URLs separate from editorial metadata, label sponsored placements, and maintain recurring link checks.

The current exporter still reads the existing compiled catalog. It is a migration bridge, not a completed database migration. The SEO generator uses `app.html` for profile pages so future regeneration does not duplicate the new homepage across tool pages.
