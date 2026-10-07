import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..");
const siteUrl = "https://ai-framework.io";
const socialImage = `${siteUrl}/social-card.png`;

function extractArray(source) {
  const marker = /const\s+El\s*=\s*\[/g;
  const match = marker.exec(source);
  if (!match) {
    throw new Error("Could not locate the embedded directory data.");
  }

  const start = source.indexOf("[", match.index);
  let depth = 0;
  let quote = null;
  let escaped = false;

  for (let index = start; index < source.length; index += 1) {
    const character = source[index];

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === quote) {
        quote = null;
      }
      continue;
    }

    if (character === '"' || character === "'" || character === "`") {
      quote = character;
      continue;
    }

    if (character === "[") depth += 1;
    if (character === "]") {
      depth -= 1;
      if (depth === 0) {
        const literal = source.slice(start, index + 1);
        return vm.runInNewContext(`(${literal})`, Object.create(null), {
          timeout: 10_000,
        });
      }
    }
  }

  throw new Error("The embedded directory data did not contain a complete array.");
}

function slugify(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/\n/g, " ");
}

function cleanDescription(resource) {
  const description =
    resource.full_description ||
    resource.short_description ||
    `${resource.name} is indexed in the AI Framework directory.`;
  return String(description).replace(/\s+/g, " ").trim();
}

function resourcePath(resource) {
  if (resource.resource_type === "creator") return `/creator/${resource.slug}`;
  if (resource.resource_type === "company") return `/company/${resource.slug}`;
  return `/tool/${resource.slug}`;
}

function resourceType(resource) {
  if (resource.resource_type === "creator") return "Person";
  if (resource.resource_type === "company") return "Organization";
  return "SoftwareApplication";
}

function setMeta(html, selector, content) {
  const escaped = escapeAttribute(content);
  const pattern = new RegExp(
    `<meta\\s+${selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+content="[^"]*"\\s*\\/?\\s*>`,
    "i",
  );
  return html.replace(pattern, `<meta ${selector} content="${escaped}"/>`);
}

function renderDocument({
  title,
  description,
  canonicalPath,
  schema,
  fallback,
  type = "website",
  robots = "index, follow",
}) {
  const canonical = `${siteUrl}${canonicalPath}`;
  let html = baseTemplate;

  html = html.replace(
    /<title>[\s\S]*?<\/title>/i,
    `<title>${escapeHtml(title)}</title>`,
  );
  html = setMeta(html, 'name="description"', description);
  html = setMeta(html, 'property="og:title"', title);
  html = setMeta(html, 'property="og:description"', description);
  html = setMeta(html, 'property="og:url"', canonical);
  html = setMeta(html, 'property="og:type"', type);
  html = setMeta(html, 'property="og:image"', socialImage);
  html = setMeta(html, 'name="twitter:title"', title);
  html = setMeta(html, 'name="twitter:description"', description);
  html = setMeta(html, 'name="twitter:image"', socialImage);
  html = setMeta(html, 'name="robots"', robots);
  html = html.replace(
    /<link rel="canonical" href="[^"]*"\/>/i,
    `<link rel="canonical" href="${escapeAttribute(canonical)}"/>`,
  );
  html = html.replace(
    /<!-- SITE_SCHEMA_START -->[\s\S]*?<!-- SITE_SCHEMA_END -->/,
    `<!-- SITE_SCHEMA_START -->\n<script type="application/ld+json">\n${JSON.stringify(schema, null, 2).replace(/</g, "\\u003c")}\n</script>\n<!-- SITE_SCHEMA_END -->`,
  );
  html = html.replace(
    /<!-- SEO_FALLBACK_START -->[\s\S]*?<!-- SEO_FALLBACK_END -->/,
    `<!-- SEO_FALLBACK_START -->\n<noscript>${fallback}</noscript>\n<!-- SEO_FALLBACK_END -->`,
  );

  return html;
}

function writePage(route, html) {
  const destination = path.join(root, route.replace(/^\/+/, ""), "index.html");
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, html);
}

const assetManifest = JSON.parse(
  fs.readFileSync(path.join(root, "asset-manifest.json"), "utf8"),
);
const mainBundlePath = path.join(
  root,
  assetManifest.files["main.js"].replace(/^\/+/, ""),
);
const bundle = fs.readFileSync(mainBundlePath, "utf8");
// app.html, not index.html. index.html is the hand-written static homepage
// and carries neither #root nor the bundle, so rendering from it would
// produce 1,600 pages that can never mount the application.
const baseTemplate = fs.readFileSync(path.join(root, "app.html"), "utf8");
const allResources = extractArray(bundle).filter(
  (resource) => resource && resource.status === "active",
);
const publicResources = allResources.filter(
  (resource) => !(resource.badges || []).includes("advanced_gated"),
);
const indexableResources = publicResources.filter(
  (resource) => cleanDescription(resource).length >= 80,
);
const indexableResourcePaths = new Set(indexableResources.map(resourcePath));
const tools = publicResources.filter(
  (resource) =>
    !resource.resource_type || resource.resource_type === "tool",
);

// Grouped from every public resource rather than tools alone. Creator and
// company pages link back to their own category in the same way tool pages
// do, so building this map from `tools` left /category/creators-influencers
// and /category/companies with no page to link to.
const categories = new Map();
for (const resource of publicResources) {
  if (!resource.primary_category) continue;
  if (!categories.has(resource.primary_category)) {
    categories.set(resource.primary_category, []);
  }
  categories.get(resource.primary_category).push(resource);
}

for (const resource of publicResources) {
  const route = resourcePath(resource);
  const description = cleanDescription(resource);
  const isIndexable = indexableResourcePaths.has(route);
  const category = resource.primary_category || "AI Tools";
  const title =
    resource.resource_type === "creator"
      ? `${resource.name} — AI Creator Profile | AI Framework`
      : resource.resource_type === "company"
        ? `${resource.name} — AI Company Profile | AI Framework`
        : `${resource.name}: Features, Pricing & Alternatives | AI Framework`;
  const canonical = `${siteUrl}${route}`;
  const schemaType = resourceType(resource);
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": schemaType,
        "@id": `${canonical}#resource`,
        name: resource.name,
        url: canonical,
        description,
        ...(schemaType === "SoftwareApplication"
          ? {
              applicationCategory: category,
              operatingSystem: (resource.platform || []).join(", ") || "Web",
              isAccessibleForFree: ["free", "freemium", "open_source"].includes(
                resource.pricing_type,
              ),
            }
          : {}),
        ...(resource.logo ? { image: resource.logo } : {}),
        ...(resource.last_reviewed || resource.updated_at
          ? {
              dateModified: resource.last_reviewed || resource.updated_at,
            }
          : {}),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: `${siteUrl}/`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: category,
            item: `${siteUrl}/category/${slugify(category)}`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: resource.name,
            item: canonical,
          },
        ],
      },
    ],
  };
  const tags = (resource.tags || [])
    .slice(0, 10)
    .map((tag) => `<li>${escapeHtml(tag)}</li>`)
    .join("");
  const fallback = `
    <main class="seo-fallback">
      <p class="seo-eyebrow">${escapeHtml(category)} · ${escapeHtml(resource.pricing_type || "AI resource")}</p>
      <h1>${escapeHtml(resource.name)}</h1>
      <p>${escapeHtml(description)}</p>
      <p><a href="/go/${encodeURIComponent(resource.slug)}?ref=${encodeURIComponent(route)}">Visit ${escapeHtml(resource.name)}</a> · <a href="/alternatives/${encodeURIComponent(resource.slug)}">See alternatives</a> · <a href="/build-my-framework/?tool=${encodeURIComponent(resource.slug)}">Build a stack with this tool</a></p>
      ${tags ? `<h2>What it helps with</h2><ul class="seo-fallback-grid">${tags}</ul>` : ""}
      <p><a href="/category/${slugify(category)}">Browse more ${escapeHtml(category)} tools</a></p>
    </main>`;

  writePage(
    route,
    renderDocument({
      title,
      description,
      canonicalPath: route,
      schema,
      fallback,
      type: schemaType === "SoftwareApplication" ? "article" : "profile",
      robots: isIndexable ? "index, follow" : "noindex, follow",
    }),
  );
}

for (const [category, categoryTools] of categories.entries()) {
  const categorySlug = slugify(category);
  const route = `/category/${categorySlug}`;
  const count = categoryTools.length;
  const description = `Compare ${count} ${category} AI tools by use case, price, and capabilities. Find the right option and add it to a working AI framework.`;
  const title = `${category} AI Tools — Compare ${count} Options | AI Framework`;
  const sorted = [...categoryTools].sort((left, right) => {
    const leftScore = Number(left.featured) * 10 + Number(left.verified) * 5;
    const rightScore = Number(right.featured) * 10 + Number(right.verified) * 5;
    return rightScore - leftScore || left.name.localeCompare(right.name);
  });
  const itemList = sorted.slice(0, 50).map((tool, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: tool.name,
    url: `${siteUrl}${resourcePath(tool)}`,
  }));
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${siteUrl}${route}#collection`,
        name: title.replace(" | AI Framework", ""),
        url: `${siteUrl}${route}`,
        description,
      },
      {
        "@type": "ItemList",
        name: `${category} AI Tools`,
        numberOfItems: count,
        itemListElement: itemList,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: `${siteUrl}/`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: category,
            item: `${siteUrl}${route}`,
          },
        ],
      },
    ],
  };
  const cards = sorted
    .slice(0, 36)
    .map(
      (tool) =>
        `<li><a href="${resourcePath(tool)}">${escapeHtml(tool.name)}</a><br><small>${escapeHtml(cleanDescription(tool).slice(0, 130))}</small></li>`,
    )
    .join("");
  const fallback = `
    <main class="seo-fallback">
      <p class="seo-eyebrow">AI tool category</p>
      <h1>${escapeHtml(category)} AI Tools</h1>
      <p>${escapeHtml(description)}</p>
      <ul class="seo-fallback-grid">${cards}</ul>
      <p><a href="/browse">Browse every category</a> · <a href="/build-my-framework/">Build My Framework</a></p>
    </main>`;

  writePage(
    route,
    renderDocument({
      title,
      description,
      canonicalPath: route,
      schema,
      fallback,
    }),
  );
}

const staticRoutes = [
  ["/", "daily", "1.0"],
  ["/browse", "weekly", "0.9"],
  ["/discover", "weekly", "0.9"],
  ["/build-my-framework/", "weekly", "1.0"],
  ["/playbooks/", "weekly", "0.9"],
  ["/tutorials/", "weekly", "0.8"],
  ["/submit", "monthly", "0.5"],
  ["/disclosure", "yearly", "0.3"],
  ["/contact", "yearly", "0.3"],
];
const categoryRoutes = [...categories.keys()].map((category) => [
  `/category/${slugify(category)}`,
  "weekly",
  "0.8",
]);
const resourceRoutes = indexableResources.map((resource) => [
  resourcePath(resource),
  "monthly",
  resource.featured ? "0.8" : "0.6",
]);
const sitemapRoutes = [...staticRoutes, ...categoryRoutes, ...resourceRoutes];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapRoutes
  .map(
    ([route, changefreq, priority]) => `  <url>
    <loc>${siteUrl}${route}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>
`;

fs.writeFileSync(path.join(root, "sitemap.xml"), sitemap);

console.log(
  JSON.stringify(
    {
      resources: publicResources.length,
      indexableResources: indexableResources.length,
      tools: tools.length,
      categories: categories.size,
      sitemapUrls: sitemapRoutes.length,
    },
    null,
    2,
  ),
);
