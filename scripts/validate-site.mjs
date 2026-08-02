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
const prompts = fs.readFileSync(
  path.join(root, "prompts", "index.html"),
  "utf8",
);
const promptScript = fs.readFileSync(
  path.join(root, "static", "js", "prompts.js"),
  "utf8",
);
const personalize = fs.readFileSync(
  path.join(root, "personalize-ai", "index.html"),
  "utf8",
);
const personalizeScript = fs.readFileSync(
  path.join(root, "static", "js", "personalize-ai.js"),
  "utf8",
);
const worldAi = fs.readFileSync(
  path.join(root, "world-ai", "index.html"),
  "utf8",
);
const contentPolicy = fs.readFileSync(
  path.join(root, "content-policy", "index.html"),
  "utf8",
);
const listingReport = fs.readFileSync(
  path.join(root, "report", "index.html"),
  "utf8",
);
const thankYou = fs.readFileSync(
  path.join(root, "vault-thank-you", "index.html"),
  "utf8",
);
const advanced = fs.readFileSync(
  path.join(root, "advanced", "index.html"),
  "utf8",
);
const advancedScript = fs.readFileSync(
  path.join(root, "static", "js", "advanced-directory.js"),
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
  enhancements.includes("document.title !== title") &&
    enhancements.includes("bodyChanged"),
  "The navigation freeze guard is missing from the enhancement observer.",
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
  prompts.includes(
    '<link rel="canonical" href="https://ai-framework.io/prompts/">',
  ) &&
    (prompts.match(/ENTRY \d{2}\.\d{2} · FREE/g) || []).length === 8,
  "The free Prompt Codex page is incomplete.",
);
check(
  promptScript.includes("free_prompt_copied"),
  "Free prompt copy tracking is missing.",
);
check(
  fs.existsSync(
    path.join(root, "vault", "AI-Framework-Prompt-Codex.pdf"),
  ) &&
    fs.statSync(
      path.join(root, "vault", "AI-Framework-Prompt-Codex.pdf"),
    ).size > 300_000,
  "The paid 100-entry Prompt Codex PDF is missing or unexpectedly small.",
);
check(
  thankYou.includes("/vault/AI-Framework-Prompt-Codex.pdf") &&
    thankYou.includes("/vault/The-Premium-Vault.pdf"),
  "The purchase thank-you page does not provide both paid downloads.",
);
check(
  personalize.includes('id="capsule-form"') &&
    personalize.includes('"@type":"HowTo"') &&
    personalizeScript.includes("context_capsule_copied"),
  "The Personalize AI guide or Context Capsule builder is incomplete.",
);
check(
  worldAi.includes("Build a <span>BRIDGE.</span>") &&
    worldAi.includes("https://www.unesco.org/") &&
    worldAi.includes("https://au.int/") &&
    worldAi.includes("https://asean.org/"),
  "The international AI hub is missing its policy framework or primary sources.",
);
check(
  contentPolicy.includes("non-consensual intimate imagery") &&
    listingReport.includes('data-netlify="true"') &&
    listingReport.includes('name="listing-report"'),
  "The content policy or safety-reporting route is incomplete.",
);
check(
  enhancements.includes("noindex, nofollow, noarchive") &&
    enhancements.includes("/content-policy/") &&
    enhancements.includes("/report/"),
  "The Advanced section is missing noindex and safety safeguards.",
);
check(
  advanced.includes(
    '<meta name="robots" content="noindex, nofollow, noarchive">',
  ) &&
    advanced.includes('id="policy-confirmation"') &&
    (advancedScript.match(/^\s*\["/gm) || []).length === 100,
  "The standalone Advanced directory is missing its gate or 100-entry collection.",
);
check(
  !sitemap.includes("<loc>https://ai-framework.io/advanced"),
  "The restricted Advanced directory must not appear in the sitemap.",
);
check(
  sitemap.includes("<loc>https://ai-framework.io/prompts/</loc>") &&
    sitemap.includes("<loc>https://ai-framework.io/personalize-ai/</loc>") &&
    sitemap.includes("<loc>https://ai-framework.io/world-ai/</loc>"),
  "The sitemap is missing a new content hub.",
);

if (failures.length) {
  console.error("Validation failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(
  `Validation passed: ${sitemapCount} quality-gated indexable URLs plus the full directory and interactive Framework Builder.`,
);
