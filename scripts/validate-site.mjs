import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..");
const failures = [];

function check(condition, message) {
  if (!condition) failures.push(message);
}

const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
const robots = fs.readFileSync(path.join(root, "robots.txt"), "utf8");
const sitemap = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8");
const headers = fs
  .readFileSync(path.join(root, "_headers"), "utf8")
  .replace(/\r\n/g, "\n");
const assetManifest = JSON.parse(
  fs.readFileSync(path.join(root, "asset-manifest.json"), "utf8"),
);
const builder = fs.readFileSync(
  path.join(root, "build-my-framework", "index.html"),
  "utf8",
);
const enhancements = fs.readFileSync(
  path.join(root, "static", "js", "site-enhancements.js"),
  "utf8",
);
const frameworkBuilder = fs.readFileSync(
  path.join(root, "static", "js", "framework-builder.js"),
  "utf8",
);
const monetizationTracking = fs.readFileSync(
  path.join(root, "static", "js", "monetization-tracking.js"),
  "utf8",
);
const playbooks = fs.readFileSync(
  path.join(root, "playbooks", "index.html"),
  "utf8",
);
const tutorials = fs.readFileSync(
  path.join(root, "tutorials", "index.html"),
  "utf8",
);
const sportsMatchup = fs.readFileSync(
  path.join(root, "sports-matchup.html"),
  "utf8",
);
const sportsMatchupFunction = fs.readFileSync(
  path.join(root, "functions", "api", "sports-matchup.js"),
  "utf8",
);
const calculator = fs.readFileSync(
  path.join(root, "calculator", "index.html"),
  "utf8",
);
const oddsFunction = fs.readFileSync(
  path.join(root, "functions", "api", "american-odds.js"),
  "utf8",
);
const sportsResearch = fs.readFileSync(
  path.join(root, "frontend", "index.html"),
  "utf8",
);
const sportsWorker = fs.readFileSync(
  path.join(root, "worker", "src", "index.ts"),
  "utf8",
);
const sportsFetcher = fs.readFileSync(
  path.join(root, "data-fetcher", "index.js"),
  "utf8",
);

check(
  robots.includes("Sitemap: https://ai-framework.io/sitemap.xml"),
  "robots.txt does not point to the production sitemap.",
);
check(
  !robots.includes("emergent.host"),
  "robots.txt still references the retired host.",
);
check(
  headers.includes(`${assetManifest.files["main.js"]}\n  Cache-Control: public, max-age=31536000, immutable`) &&
    headers.includes(`${assetManifest.files["main.css"]}\n  Cache-Control: public, max-age=31536000, immutable`) &&
    headers.includes("X-Content-Type-Options: nosniff") &&
      headers.includes("Strict-Transport-Security: max-age=31536000") &&
      fs.existsSync(
        path.join(root, assetManifest.files["main.js"].replace(/^\/+/, "")),
      ) &&
      fs.existsSync(
        path.join(root, assetManifest.files["main.css"].replace(/^\/+/, "")),
      ),
  "Cloudflare Pages security or content-hash cache headers are incomplete.",
);
check(
  index.includes('href="/build-my-framework/"'),
  "The homepage does not contain a no-JavaScript Framework Builder link.",
);
check(
  index.includes('href="/sports-matchup"') &&
    index.includes('href="/calculator/"') &&
  index.includes('href="/sports-research/"') &&
  enhancements.includes('href="/sports-research/"') &&
  sitemap.includes("<loc>https://ai-framework.io/calculator/</loc>") &&
  sitemap.includes("<loc>https://ai-framework.io/sports-research/</loc>"),
  "A new sports tool is not linked from the homepage or a sports tool is missing from the sitemap.",
);
check(
  index.includes('property="og:image"'),
  "The homepage is missing an Open Graph image.",
);
check(
  index.includes('"@type": "WebSite"'),
  "The homepage is missing WebSite structured data.",
);
check(
  builder.includes('"@type": "WebApplication"'),
  "The Framework Builder is missing WebApplication structured data.",
);
check(
  builder.includes('id="generate-framework"'),
  "The Framework Builder markup is incomplete.",
);
check(
  enhancements.includes("outbound_tool_click"),
  "Outbound tool tracking is missing.",
);
check(
  frameworkBuilder.includes("framework_generated"),
  "Framework generation tracking is missing.",
);
check(
  monetizationTracking.includes("vault_checkout_opened") &&
    monetizationTracking.includes("custom_framework_session_requested"),
  "Monetization event tracking is incomplete.",
);

const sitemapCount = (sitemap.match(/<url>/g) || []).length;
check(
  sitemapCount > 175 && sitemapCount < 500,
  `The sitemap has ${sitemapCount} URLs; expected a quality-gated set between 176 and 499.`,
);
check(
  sitemap.includes("<loc>https://ai-framework.io/tool/chatgpt</loc>"),
  "The sitemap is missing a known tool profile.",
);
check(
  fs.existsSync(path.join(root, "tool", "chatgpt", "index.html")),
  "The generated ChatGPT profile page is missing.",
);
check(
  fs.existsSync(
    path.join(root, "category", "text-writing", "index.html"),
  ),
  "The generated Text & Writing category page is missing.",
);
const thinProfile = fs.readFileSync(
  path.join(root, "tool", "comparative-political-data", "index.html"),
  "utf8",
);
check(
  thinProfile.includes('name="robots" content="noindex, follow"'),
  "Thin resource profiles are not protected with noindex, follow.",
);
check(
  !sitemap.includes(
    "<loc>https://ai-framework.io/tool/comparative-political-data</loc>",
  ),
  "A thin resource profile was included in the sitemap.",
);
check(
  playbooks.includes(
    '<link rel="canonical" href="https://ai-framework.io/playbooks/">',
  ),
  "The playbooks page is missing its canonical URL.",
);
check(
  !playbooks.split("</head>")[0].includes("Featured Partner"),
  "The featured partner card is still inside the document head.",
);
check(
  playbooks.includes('rel="sponsored nofollow noopener"'),
  "The featured partner link is missing its sponsored disclosure.",
);
check(
  tutorials.includes(
    '<link rel="canonical" href="https://ai-framework.io/tutorials/">',
  ),
  "The tutorials page is missing its canonical URL.",
);
check(
  sportsMatchup.includes('id="matchup-form"') &&
    sportsMatchup.includes("/api/sports-matchup"),
  "The sports matchup demo form is incomplete.",
);
check(
  sportsMatchup.includes("No predictions or betting information") &&
    sportsMatchup.includes("No live data provider or predictive model is connected"),
  "The sports matchup demo is missing its prominent data and betting disclaimer.",
);
check(
  sportsMatchupFunction.includes('mode: "illustrative-demo"') &&
    sportsMatchupFunction.includes("modelOutput: null") &&
    sportsMatchupFunction.includes("bettingOdds: null") &&
    !sportsMatchupFunction.includes("Math.random"),
  "The sports matchup endpoint must remain an input-only demo without simulated betting output.",
);
check(
  calculator.includes('id="calculator-form"') &&
    calculator.includes("/api/american-odds"),
  "The American odds calculator form is incomplete.",
);
check(
  calculator.toLowerCase().includes("not a prediction or betting recommendation") &&
    calculator.toLowerCase().includes("no purchase available"),
  "The calculator is missing its limitations or honest Data Pack status.",
);
check(
  oddsFunction.includes('mode: "user-input-calculation"') &&
    oddsFunction.includes("modelOutput: null") &&
    oddsFunction.includes("user-provided American odds"),
  "The odds endpoint must identify mathematical conversions and exclude model predictions.",
);
check(
  sportsResearch.includes('name="sports-api-base"') &&
    sportsResearch.includes("/api/college-football/odds") &&
    sportsResearch.includes("/api/college-football/summary") &&
    sportsResearch.includes("not a statistically validated forecast"),
  "The live college-football market board is missing its Worker API or forecast disclaimer.",
);
check(
  sportsWorker.includes('@cf/meta/llama-3.1-8b-instruct-fp8') &&
    sportsWorker.includes("SPORTS_INGEST_TOKEN") &&
    sportsWorker.includes("MAX_INGEST_BYTES") &&
    sportsWorker.includes("access-control-allow-origin"),
  "The college-sports Worker is missing supported AI, protected ingest, or request size limits.",
);
check(
  sportsFetcher.includes("americanfootball_ncaaf") &&
    sportsFetcher.includes("ODDS_API_KEY") &&
    sportsFetcher.includes("h2h") &&
    sportsFetcher.includes("spreads") &&
    sportsFetcher.includes("totals"),
  "The scheduled data fetcher is missing its CFB provider configuration.",
);

if (failures.length) {
  console.error("Validation failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(
  `Validation passed: ${sitemapCount} quality-gated indexable URLs plus the full directory and interactive Framework Builder.`,
);
