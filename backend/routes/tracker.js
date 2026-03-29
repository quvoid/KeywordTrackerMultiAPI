const express = require("express");
const router = express.Router();
const axios = require("axios");
const cheerio = require("cheerio");

// ===================================================
// Helper: find the rank of a domain in SERP results
// Handles different field names across APIs:
//   Serper / SearchAPI  → result.link
//   SerpStack           → result.url
//   Zenserp             → result.url || result.destination
// Also uses result.position when present (authoritative rank)
// ===================================================
function findRank(results, domain) {
  if (!Array.isArray(results) || results.length === 0) return "Not Found";

  const domainLower = domain.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "");

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const rawUrl = r.link || r.url || r.destination || "";
    const url = rawUrl.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "");

    if (url.includes(domainLower)) {
      // Use position field if the API provides it, else fall back to 1-based index
      return typeof r.position === "number" ? r.position : i + 1;
    }
  }
  return "Not Found";
}

// ===================================================
// 1. Serper  —  POST https://google.serper.dev/search
//    Header : X-API-KEY
//    Body   : { q, num }
//    Result : data.organic[]  →  result.link
// ===================================================
async function fetchSerper(keyword, apiKey) {
  if (!apiKey || !apiKey.trim()) throw new Error("Serper: no API key provided");

  const { data } = await axios.post(
    "https://google.serper.dev/search",
    { q: keyword, num: 10 },
    {
      headers: {
        "X-API-KEY": apiKey.trim(),
        "Content-Type": "application/json"
      },
      timeout: 15000
    }
  );

  if (data.error) throw new Error(`Serper: ${data.error}`);
  return data.organic || [];
}

// ===================================================
// 2. SearchAPI.io  —  GET https://www.searchapi.io/api/v1/search
//    Param  : api_key, engine=google, q
//    Result : data.organic_results[]  →  result.link
// ===================================================
async function fetchSearchApi(keyword, apiKey) {
  if (!apiKey || !apiKey.trim()) throw new Error("SearchAPI: no API key provided");

  const { data } = await axios.get("https://www.searchapi.io/api/v1/search", {
    params: {
      engine: "google",
      q: keyword,
      api_key: apiKey.trim(),
      num: 10
    },
    timeout: 15000
  });

  if (data.error) throw new Error(`SearchAPI: ${data.error}`);
  return data.organic_results || [];
}

// ===================================================
// 3. SerpStack  —  GET https://api.serpstack.com/search
//    Param  : access_key, query
//    Result : data.organic_results[]  →  result.url
// ===================================================
async function fetchSerpStack(keyword, apiKey) {
  if (!apiKey || !apiKey.trim()) throw new Error("SerpStack: no API key provided");

  const { data } = await axios.get("http://api.serpstack.com/search", {
    params: {
      access_key: apiKey.trim(),
      query: keyword,
      num: 10,
      type: "web"
    },
    timeout: 15000
  });

  if (data.error) throw new Error(`SerpStack: ${JSON.stringify(data.error)}`);
  return data.organic_results || [];
}

// ===================================================
// 4. Zenserp  —  GET https://app.zenserp.com/api/v2/search
//    Header : apikey
//    Param  : q
//    Result : data.organic[]  →  result.url || result.destination
// ===================================================
async function fetchZenserp(keyword, apiKey) {
  if (!apiKey || !apiKey.trim()) throw new Error("Zenserp: no API key provided");

  const { data } = await axios.get("https://app.zenserp.com/api/v2/search", {
    params: { q: keyword, num: 10 },
    headers: { apikey: apiKey.trim() },
    timeout: 15000
  });

  if (data.error) throw new Error(`Zenserp: ${JSON.stringify(data.error)}`);
  return data.organic || [];
}

// ===================================================
// 5. ScrapingRobot (Deep Search Google UI)
// ===================================================
async function scrapeGoogleDeep(keyword, domain, apiKey) {
  if (!apiKey || !apiKey.trim()) throw new Error("ScrapingRobot: no API key provided");

  const maxPages = 3; // Check top 3 pages (30 results)
  let currentRank = 0;
  const domainLower = domain.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "");

  for (let page = 0; page < maxPages; page++) {
    const start = page * 10;
    // We scrape Google Desktop India (gl=in) since keywords are Indian market
    const targetUrl = `https://www.google.com/search?q=${encodeURIComponent(keyword)}&start=${start}&num=10&hl=en&gl=in`;
    
    const srUrl = `https://api.scrapingrobot.com/?token=${apiKey.trim()}&render=false&url=${encodeURIComponent(targetUrl)}`;
    
    // timeout 45s because ScrapingRobot might take a while to solve captchas
    const { data } = await axios.get(srUrl, { timeout: 45000 });
    
    // ScrapingRobot can return JSON { result: "<html>..." }
    const htmlStr = data.result || data.html || (typeof data === "string" ? data : JSON.stringify(data));
    const $ = cheerio.load(htmlStr);
    
    let foundOnPage = false;
    let rankFound = -1;

    // Extract semantic SERP blocks. Google Mobile DOM wraps each organic result in div.MjjYud or similar.
    // If .MjjYud exists, it perfectly aligns 1 block = 1 rank for the human eye, eliminating sitelink noise.
    let pageLinks = [];
    let semanticBlocks = $("div.MjjYud");
    
    // Fallback if MjjYud isn't present, try generic fallback
    if (semanticBlocks.length === 0) {
      // Extremely rare in current DOM, fallback to legacy tracking
      $("a[href^='http']").each((i, el) => {
        const h = $(el).attr("href");
        if (!h.includes("google.") && !h.includes("youtube.") && !h.includes("blogger.com")) {
          if ($(el).text().trim().length > 5) pageLinks.push(h);
        }
      });
      pageLinks = [...new Set(pageLinks)];
    } else {
      semanticBlocks.each((i, block) => {
        const linksInBlock = [];
        $(block).find("a[href^='http']").each((_, el) => {
          const h = $(el).attr("href");
          if (!h.includes("google.") && !h.includes("youtube.") && !h.includes("blogger.com")) {
            if ($(el).text().trim().length > 5) linksInBlock.push(h);
          }
        });
        
        if (linksInBlock.length > 0) {
          // Take the primary structural link of this block
          pageLinks.push(linksInBlock[0]);
        }
      });
    }

    // Now scan through collected organic links (1 per visual rank block)
    for (const link of pageLinks) {
      currentRank++;
      const urlLower = link.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "");
      if (urlLower.includes(domainLower)) {
        foundOnPage = true;
        rankFound = currentRank;
        break;
      }
    }

    if (foundOnPage) return rankFound;

    // Polite delay for ScrapingRobot
    await new Promise(r => setTimeout(r, 1000));
  }
  
  return "Not Found (Top 30)";
}

// ===================================================
// Map each api_keys field to its fetcher function
// Only candidates where the key is non-empty are used
// Round-robin across available APIs per keyword
// ===================================================
function buildCandidates(safeApiKeys) {
  return [
    { name: "Serper",     key: safeApiKeys.serper,    fn: fetchSerper    },
    { name: "SearchAPI",  key: safeApiKeys.serpapi,   fn: fetchSearchApi },
    { name: "SerpStack",  key: safeApiKeys.serpstack,  fn: fetchSerpStack },
    { name: "Zenserp",   key: safeApiKeys.zenserp,   fn: fetchZenserp   }
  ].filter(c => c.key && c.key.trim());
}

// ===== DIRECT TRACK (NO DB) =====
router.post("/run-direct", async (req, res) => {
  try {
    console.log("[/run-direct] req.body:", JSON.stringify(req.body, null, 2));

    const { domain, keywords, api_keys = {}, useScrapingRobot, scrapingRobotKey } = req.body;

    // --- Granular validation ---
    if (!domain || typeof domain !== "string" || !domain.trim()) {
      return res.status(400).json({ error: "Missing domain" });
    }
    if (!Array.isArray(keywords) || keywords.length === 0) {
      return res.status(400).json({ error: "Missing keywords" });
    }

    // Branch logic: if ScrapingRobot is toggled on
    if (useScrapingRobot) {
      if (!scrapingRobotKey || !scrapingRobotKey.trim()) {
        return res.status(400).json({ error: "Missing ScrapingRobot API Key" });
      }

      console.log(`[/run-direct] Using ScrapingRobot for ${keywords.length} keywords`);
      const results = [];
      
      for (let i = 0; i < keywords.length; i++) {
        const keyword = keywords[i];
        try {
          console.log(`[/run-direct] Checking "${keyword}" via ScrapingRobot...`);
          const rank = await scrapeGoogleDeep(keyword, domain.trim(), scrapingRobotKey);
          console.log(`[/run-direct]   → rank: ${rank}`);
          results.push({ keyword, rank });
        } catch (err) {
          console.error(`[/run-direct] Error for "${keyword}" (ScrapingRobot):`, err.message);
          results.push({ keyword, rank: "error", detail: err.message });
        }
      }
      return res.json(results);
    }

    // Fallback: standard multi-API routing
    if (!api_keys || typeof api_keys !== "object") {
      return res.status(400).json({ error: "Missing API keys" });
    }

    const safeApiKeys = {
      serper:    api_keys.serper    ?? "",
      serpapi:   api_keys.serpapi   ?? "",
      serpstack: api_keys.serpstack ?? "",
      zenserp:   api_keys.zenserp  ?? ""
    };

    const candidates = buildCandidates(safeApiKeys);
    if (candidates.length === 0) {
      return res.status(400).json({
        error: "Please provide at least one API key (Serper, SearchAPI, SerpStack, or Zenserp)"
      });
    }

    console.log(`[/run-direct] Using APIs: ${candidates.map(c => c.name).join(", ")}`);

    const results = [];

    for (let i = 0; i < keywords.length; i++) {
      const keyword = keywords[i];
      const candidate = candidates[i % candidates.length];

      try {
        console.log(`[/run-direct] Checking "${keyword}" via ${candidate.name}...`);
        const data = await candidate.fn(keyword, candidate.key);
        const rank = findRank(data, domain.trim());
        console.log(`[/run-direct]   → rank: ${rank}`);
        results.push({ keyword, rank });

        // Polite delay between requests to avoid rate limiting
        if (i < keywords.length - 1) {
          await new Promise(r => setTimeout(r, 800));
        }
      } catch (err) {
        console.error(`[/run-direct] Error for "${keyword}" (${candidate.name}):`, err.message);
        results.push({ keyword, rank: "error", detail: err.message });
      }
    }

    res.json(results);

  } catch (err) {
    console.error("[/run-direct] Unexpected error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;