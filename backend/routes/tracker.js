const express = require("express");
const router = express.Router();
const axios = require("axios");
const cheerio = require("cheerio");

// ===================================================
// Helper: find the rank of a domain in SERP results
// ===================================================
function findRank(results, domain, offset = 0) {
  if (!Array.isArray(results) || results.length === 0) return "Not Found";

  const domainLower = domain.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "");
  let bestRank = null;

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const rawUrl = r.link || r.url || r.destination || "";
    const url = rawUrl.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "");

    if (url.includes(domainLower)) {
      // Force calculation using mathematical offset because some APIs (like Serper)
      // reset 'position' to 1 on every parsed page, corrupting deep rank results.
      const rank = offset + i + 1;
      
      if (bestRank === null || rank < bestRank) {
        bestRank = rank;
      }
    }
  }

  return bestRank !== null ? bestRank : "Not Found";
}

// ===================================================
// 1. Serper
// ===================================================
async function fetchSerper(keyword, apiKey, domain) {
  if (!apiKey || !apiKey.trim()) throw new Error("Serper: no API key provided");

  // Serper pagination via 'page' parameter (1-10) for 100 results max
  for (let page = 1; page <= 10; page++) {
    const { data } = await axios.post(
      "https://google.serper.dev/search",
      { q: keyword, num: 10, page: page, gl: "in", hl: "en" },
      { headers: { "X-API-KEY": apiKey.trim(), "Content-Type": "application/json" }, timeout: 15000 }
    );
    if (data.error) throw new Error(`Serper: ${data.error}`);

    const organic = data.organic || [];
    const rank = findRank(organic, domain, (page - 1) * 10);
    
    // Early exit
    if (rank !== "Not Found") return rank;
    if (organic.length < 10) break;

    if (page < 10) await new Promise(r => setTimeout(r, 800)); // Sleep between pages
  }
  return "Not Found";
}

// ===================================================
// 2. SearchAPI.io (No pagination needed, native 100)
// ===================================================
async function fetchSearchApi(keyword, apiKey, domain) {
  if (!apiKey || !apiKey.trim()) throw new Error("SearchAPI: no API key provided");

  const { data } = await axios.get("https://www.searchapi.io/api/v1/search", {
    params: { engine: "google_rank_tracking", q: keyword, api_key: apiKey.trim(), gl: "in", hl: "en", num: 100 },
    timeout: 25000
  });

  if (data.error) throw new Error(`SearchAPI: ${data.error}`);
  return findRank(data.organic_results || [], domain);
}

// ===================================================
// 3. SerpStack
// ===================================================
async function fetchSerpStack(keyword, apiKey, domain) {
  if (!apiKey || !apiKey.trim()) throw new Error("SerpStack: no API key provided");

  for (let page = 1; page <= 10; page++) {
    const { data } = await axios.get("https://api.serpstack.com/search", {
      params: { access_key: apiKey.trim(), query: keyword, gl: "in", hl: "en", type: "web", num: 10, page: page },
      timeout: 25000
    });

    if (data.success === false || data.error) {
      throw new Error(`SerpStack: ${data.error?.info || JSON.stringify(data.error)}`);
    }

    const organic = (data.organic_results || []).map(r => ({ link: r.url, position: r.position }));
    const rank = findRank(organic, domain, (page - 1) * 10);
    
    if (rank !== "Not Found") return rank;
    if (organic.length < 10) break;
    
    if (page < 10) await new Promise(r => setTimeout(r, 800));
  }
  return "Not Found";
}

// ===================================================
// 4. Zenserp
// ===================================================
async function fetchZenserp(keyword, apiKey, domain) {
  if (!apiKey || !apiKey.trim()) throw new Error("Zenserp: no API key provided");

  for (let start = 0; start < 100; start += 10) {
    const { data } = await axios.get("https://app.zenserp.com/api/v2/search", {
      params: { q: keyword, num: 10, start: start, gl: "in", hl: "en" },
      headers: { apikey: apiKey.trim() },
      timeout: 20000
    });

    if (data.error) throw new Error(`Zenserp: ${JSON.stringify(data.error)}`);

    const organic = data.organic || [];
    const rank = findRank(organic, domain, start);
    
    if (rank !== "Not Found") return rank;
    if (organic.length < 10) break;
    
    if (start < 90) await new Promise(r => setTimeout(r, 800));
  }
  return "Not Found";
}

// ===================================================
// 5. SerpHouse
// ===================================================
async function fetchSerpHouse(keyword, apiKey, domain) {
  if (!apiKey || !apiKey.trim()) throw new Error("SerpHouse: no API key provided");

  for (let page = 1; page <= 10; page++) {
    const { data } = await axios.post(
      "https://api.serphouse.com/serp/live",
      { data: { q: keyword, domain: "google.com", loc: "India", lang: "en", device: "desktop", serp_type: "web", page: String(page), verbatim: "0" } },
      { headers: { accept: "application/json", "content-type": "application/json", authorization: `Bearer ${apiKey.trim()}` }, timeout: 20000 }
    );

    if (data.error) throw new Error(`SerpHouse: ${JSON.stringify(data.error)}`);

    const organic = data?.results?.results?.organic || data?.results?.organic || [];
    const normalized = organic.map((r, i) => ({ link: r.url || r.link || "", position: r.rank || r.position || ((page - 1) * 10 + i + 1) }));
    
    const rank = findRank(normalized, domain, (page - 1) * 10);
    if (rank !== "Not Found") return rank;

    if (organic.length < 10) break;
    if (page < 10) await new Promise(r => setTimeout(r, 1000));
  }
  return "Not Found";
}

// ===================================================
// 6. SerpAPI
// ===================================================
async function fetchSerpApi(keyword, apiKey, domain) {
  if (!apiKey || !apiKey.trim()) throw new Error("SerpAPI: no API key provided");

  for (let start = 0; start < 100; start += 10) {
    const { data } = await axios.get("https://serpapi.com/search", {
      params: { engine: "google", q: keyword, api_key: apiKey.trim(), gl: "in", hl: "en", google_domain: "google.co.in", num: 10, start },
      timeout: 20000
    });

    if (data.error) throw new Error(`SerpAPI: ${data.error}`);
    
    const organic = data.organic_results || [];
    const rank = findRank(organic, domain, start);
    
    if (rank !== "Not Found") return rank;
    if (organic.length < 10) break;
    
    if (start < 90) await new Promise(r => setTimeout(r, 600));
  }
  return "Not Found";
}

// ===================================================
// 7. Scrape.do
// ===================================================
async function fetchScrapeDo(keyword, apiKey, domain) {
  if (!apiKey || !apiKey.trim()) throw new Error("Scrape.do: no API key provided");

  for (let start = 0; start < 100; start += 10) {
    const { data } = await axios.get("https://api.scrape.do/plugin/google/search", {
      params: { token: apiKey.trim(), q: keyword, gl: "in", hl: "en", google_domain: "google.co.in", device: "desktop", start },
      timeout: 30000
    });

    if (data.error) throw new Error(`Scrape.do: ${data.message || JSON.stringify(data.error)}`);
    
    const organic = data.organic_results || [];
    const rank = findRank(organic, domain, start);
    
    if (rank !== "Not Found") return rank;
    if (organic.length < 10) break;
    
    if (start < 90) await new Promise(r => setTimeout(r, 600));
  }
  return "Not Found";
}

// ===================================================
// 8. ScrapingRobot
// ===================================================
async function scrapeGoogleDeep(keyword, domain, apiKey) {
  if (!apiKey || !apiKey.trim()) throw new Error("ScrapingRobot: no API key provided");

  const maxPages = 10;
  let currentRank = 0;
  const domainLower = domain.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "");

  for (let page = 0; page < maxPages; page++) {
    const start = page * 10;
    const targetUrl = `https://www.google.com/search?q=${encodeURIComponent(keyword)}&start=${start}&num=10&hl=en&gl=in`;
    const srUrl = `https://api.scrapingrobot.com/?token=${apiKey.trim()}&render=false&url=${encodeURIComponent(targetUrl)}`;
    
    const { data } = await axios.get(srUrl, { timeout: 45000 });
    const htmlStr = data.result || data.html || (typeof data === "string" ? data : JSON.stringify(data));
    const $ = cheerio.load(htmlStr);
    
    let foundOnPage = false;
    let rankFound = -1;
    let pageLinks = [];
    let semanticBlocks = $("div.MjjYud");
    
    if (semanticBlocks.length === 0) {
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
        if (linksInBlock.length > 0) pageLinks.push(linksInBlock[0]);
      });
    }

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

    if (pageLinks.length === 0) break; // If Google completely blocked us, stop
    if (page < maxPages - 1) await new Promise(r => setTimeout(r, 1000));
  }
  
  return "Not Found";
}

function buildCandidates(safeApiKeys) {
  return [
    { name: "Serper",     key: safeApiKeys.serper,      fn: fetchSerper    },
    { name: "SearchAPI",  key: safeApiKeys.serpapi,     fn: fetchSearchApi },
    { name: "SerpStack",  key: safeApiKeys.serpstack,   fn: fetchSerpStack },
    { name: "Zenserp",   key: safeApiKeys.zenserp,     fn: fetchZenserp   },
    { name: "SerpHouse", key: safeApiKeys.serphouse,   fn: fetchSerpHouse },
    { name: "SerpAPI",   key: safeApiKeys.serpApiKey,  fn: fetchSerpApi   },
    { name: "Scrape.do", key: safeApiKeys.scrapedo,    fn: fetchScrapeDo  }
  ].filter(c => c.key && c.key.trim());
}

router.post("/run-direct", async (req, res) => {
  try {
    const { domain, keywords, api_keys = {}, useScrapingRobot, scrapingRobotKey } = req.body;

    if (!domain || typeof domain !== "string" || !domain.trim()) {
      return res.status(400).json({ error: "Missing domain" });
    }
    if (!Array.isArray(keywords) || keywords.length === 0) {
      return res.status(400).json({ error: "Missing keywords" });
    }

    if (useScrapingRobot) {
      if (!scrapingRobotKey || !scrapingRobotKey.trim()) return res.status(400).json({ error: "Missing ScrapingRobot API Key" });
      const results = [];
      for (let i = 0; i < keywords.length; i++) {
        const keyword = keywords[i];
        try {
          console.log(`[/run-direct] Checking "${keyword}" via ScrapingRobot...`);
          const rank = await scrapeGoogleDeep(keyword, domain.trim(), scrapingRobotKey);
          results.push({ keyword, rank });
        } catch (err) {
          results.push({ keyword, rank: "error", detail: err.message });
        }
      }
      return res.json(results);
    }

    if (!api_keys || typeof api_keys !== "object") return res.status(400).json({ error: "Missing API keys" });

    const safeApiKeys = {
      serper:      api_keys.serper      ?? "",
      serpapi:     api_keys.serpapi     ?? "",
      serpstack:   api_keys.serpstack   ?? "",
      zenserp:     api_keys.zenserp     ?? "",
      serphouse:   api_keys.serphouse   ?? "",
      serpApiKey:  api_keys.serpApiKey  ?? "",
      scrapedo:    api_keys.scrapedo    ?? ""
    };

    const candidates = buildCandidates(safeApiKeys);
    if (candidates.length === 0) {
      return res.status(400).json({ error: "Please provide at least one API key" });
    }

    const results = [];
    let candidateIndex = 0;

    for (let i = 0; i < keywords.length; i++) {
      const keyword = keywords[i];
      let success = false;
      let lastError = null;

      for (let attempt = 0; attempt < candidates.length; attempt++) {
        const candidate = candidates[candidateIndex % candidates.length];
        candidateIndex++;

        try {
          console.log(`[/run-direct] Checking "${keyword}" via ${candidate.name} (Attempt ${attempt + 1}/${candidates.length})...`);
          
          // API returns the rank INT or 'Not Found' immediately via Early Exit
          const rank = await candidate.fn(keyword, candidate.key, domain.trim());
          
          console.log(`[/run-direct]   → Rank: ${rank}`);
          results.push({ keyword, rank });
          success = true;

          if (i < keywords.length - 1) {
             await new Promise(r => setTimeout(r, 2500));
          }
          break;
        } catch (err) {
          console.error(`[/run-direct] Error for "${keyword}" (${candidate.name}):`, err.message);
          lastError = err.message;
          if (attempt < candidates.length - 1) {
            console.log(`[/run-direct] Failing over to next API...`);
            await new Promise(r => setTimeout(r, 2500));
          }
        }
      }

      if (!success) {
        results.push({ keyword, rank: "error", detail: lastError });
      }
    }

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;