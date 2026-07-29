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

check(
  robots.includes("Sitemap: https://ai-framework.io/sitemap.xml"),
  "robots.txt does not point to the production sitemap.",
);
check(
  !robots.includes("emergent.host"),
  "robots.txt still references the retired host.",
);
check(
  index.includes('href="/build-my-framework/"'),
  "The homepage does not contain a no-JavaScript Framework Builder link.",
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

if (failures.length) {
  console.error("Validation failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(
  `Validation passed: ${sitemapCount} quality-gated indexable URLs plus the full directory and interactive Framework Builder.`,
);
