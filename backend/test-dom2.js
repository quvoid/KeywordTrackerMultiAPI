const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('dump-in.html', 'utf8');
const $ = cheerio.load(html);

console.log("Analyzing organically looking links in the HTML...");

// Let's find common domains that usually rank for "intraday stocks" in India
const targets = ["moneycontrol.com", "groww.in", "angelone.in", "zerodha.com", "screener.in", "upstox.com"];

$("a").each((i, el) => {
  const href = $(el).attr("href");
  if (href && targets.some(t => href.includes(t))) {
    console.log("\n---- Found Target Link! ----");
    console.log("Href:", href);
    console.log("Tag:", $(el).prop("tagName"));
    console.log("Classes:", $(el).attr("class"));
    console.log("Parent Element:", $(el).parent().prop("tagName"), $(el).parent().attr("class"));
    console.log("Does it contain H3?", $(el).find("h3").length);
    console.log("Does it contain div with text?", $(el).find("div").first().text().substring(0, 30));
  }
});
