const axios = require("axios");
const cheerio = require("cheerio");

async function test() {
  const keyword = "intraday stocks";
  const domain = "5paisa.com";
  const apiKey = "f0badedd-eddc-43ec-aa4c-762a8ade1fd6";
  const start = 0;
  const targetUrl = `https://www.google.com/search?q=${encodeURIComponent(keyword)}&start=${start}&num=10&hl=en&gl=in`;
  const srUrl = `https://api.scrapingrobot.com/?token=${apiKey}&render=false&url=${encodeURIComponent(targetUrl)}`;
  
  try {
    const { data } = await axios.get(srUrl, { timeout: 45000 });
    const htmlStr = data.result || data.html || (typeof data === "string" ? data : JSON.stringify(data));
    const $ = cheerio.load(htmlStr);
    
    let currentRank = 0;
    const domainLower = domain.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "");
    
    const linksFound = [];
    $("h3").each((i, el) => {
      const aTag = $(el).closest("a").length ? $(el).closest("a") : $(el).parent("a");
      if (aTag.length) {
        const href = aTag.attr("href");
        if (href && href.startsWith("http") && !href.includes("google.com")) {
          linksFound.push(href);
        }
      }
    });

    if (linksFound.length === 0) {
      console.log("Fallback triggered!");
      $("div.g").each((i, el) => {
        const aTag = $(el).find("a").first();
        const href = aTag.attr("href");
        if (href && href.startsWith("http") && !href.includes("google.com")) {
          linksFound.push(href);
        }
      });
    }
    
    console.log("Total Organic Links Parsed:", linksFound.length);
    let found = false;

    for (const link of linksFound) {
      currentRank++;
      const urlLower = link.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "");
      if (urlLower.includes(domainLower)) {
        console.log(`✅ MATCH FOUND! Domain inside link: ${link}`);
        console.log(`   --> RANK: ${currentRank}`);
        found = true;
        break;
      }
    }
    if (!found) console.log("❌ Not Found");

  } catch (e) {
    console.error("Error:", e.message);
  }
}
test();
