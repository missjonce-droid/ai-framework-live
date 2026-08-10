// Netlify Function: pulls the latest AI headlines from public RSS feeds and
// returns them as clean JSON for the /news page.
//
// Why RSS and not a news API: no signup, no API key, no per-request cost, no
// quota to blow through. These are the publishers' own public feeds, which
// exist precisely to be read this way. Each item links straight back to the
// original article - we show a headline, source, and timestamp, never the
// article body.
//
// Results are cached at the edge for 30 minutes (see the Cache-Control
// header below), so a burst of visitors doesn't mean a burst of fetches.
//
// Zero npm dependencies - the XML parsing here is deliberately minimal
// (regex against well-formed feed markup) because this site has no build
// step to install a real parser with.

const FEEDS = [
  { name: "TechCrunch AI", url: "https://techcrunch.com/category/artificial-intelligence/feed/" },
  { name: "VentureBeat AI", url: "https://venturebeat.com/category/ai/feed/" },
  { name: "MIT Technology Review", url: "https://www.technologyreview.com/topic/artificial-intelligence/feed" },
  { name: "The Verge AI", url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml" },
  { name: "Ars Technica AI", url: "https://arstechnica.com/ai/feed/" },
];

const MAX_PER_FEED = 6;
const MAX_TOTAL = 30;
const FETCH_TIMEOUT_MS = 6000;

function decodeEntities(text) {
  return String(text)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#8217;/g, "\u2019")
    .replace(/&#8216;/g, "\u2018")
    .replace(/&#8220;/g, "\u201c")
    .replace(/&#8221;/g, "\u201d")
    .replace(/&#8211;/g, "\u2013")
    .replace(/&#8212;/g, "\u2014")
    .replace(/&amp;/g, "&")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function firstMatch(block, patterns) {
  for (const pattern of patterns) {
    const match = block.match(pattern);
    if (match && match[1]) return match[1];
  }
  return "";
}

// Handles both RSS (<item>) and Atom (<entry>) shapes.
function parseFeed(xml, sourceName) {
  const items = [];
  const blocks = xml.match(/<(item|entry)\b[\s\S]*?<\/\1>/g) || [];

  for (const block of blocks.slice(0, MAX_PER_FEED)) {
    const title = decodeEntities(
      firstMatch(block, [/<title[^>]*>([\s\S]*?)<\/title>/]),
    );

    // Atom puts the URL in an href attribute; RSS uses element text.
    let link = firstMatch(block, [
      /<link[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)["']/,
      /<link[^>]*href=["']([^"']+)["']/,
      /<link[^>]*>([\s\S]*?)<\/link>/,
      /<guid[^>]*>(https?:[\s\S]*?)<\/guid>/,
    ]).trim();
    link = decodeEntities(link);

    const dateRaw = firstMatch(block, [
      /<pubDate[^>]*>([\s\S]*?)<\/pubDate>/,
      /<published[^>]*>([\s\S]*?)<\/published>/,
      /<updated[^>]*>([\s\S]*?)<\/updated>/,
      /<dc:date[^>]*>([\s\S]*?)<\/dc:date>/,
    ]);

    let published = null;
    if (dateRaw) {
      const parsed = new Date(dateRaw.trim());
      if (!isNaN(parsed.getTime())) published = parsed.toISOString();
    }

    if (!title || !/^https?:\/\//.test(link)) continue;

    items.push({ title, link, source: sourceName, published });
  }

  return items;
}

async function fetchFeed(feed) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(feed.url, {
      signal: controller.signal,
      headers: { "user-agent": "ai-framework.io news reader" },
    });
    if (!response.ok) return [];
    const xml = await response.text();
    return parseFeed(xml, feed.name);
  } catch {
    // One dead feed shouldn't take down the whole page.
    return [];
  } finally {
    clearTimeout(timer);
  }
}

export async function onRequest(context) {
  const request = context.request;
  const env = context.env;
  const settled = await Promise.all(FEEDS.map(fetchFeed));
  const all = settled.flat();

  // Drop duplicate stories that several outlets syndicated.
  const seen = new Set();
  const deduped = [];
  for (const item of all) {
    const key = item.title.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 60);
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(item);
  }

  deduped.sort((a, b) => {
    if (!a.published) return 1;
    if (!b.published) return -1;
    return new Date(b.published) - new Date(a.published);
  });

  const items = deduped.slice(0, MAX_TOTAL);

  return new Response(
    JSON.stringify({ items, fetched: new Date().toISOString() }),
    {
      status: 200,
      headers: {
        "content-type": "application/json",
        // Serve cached copies for 30 min; refresh in the background for an
        // hour after that rather than making a visitor wait.
        "cache-control": "public, max-age=0, s-maxage=1800, stale-while-revalidate=3600",
      },
    },
  );
}
