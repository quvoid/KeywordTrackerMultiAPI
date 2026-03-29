const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('dump-in.html', 'utf8');
const $ = cheerio.load(html);

const linksFound = [];
$("a[href^='http']").each((i, el) => {
    const href = $(el).attr("href");
    if (!href.includes("google.") && !href.includes("blogger.com") && !href.includes("youtube.com")) {
        if ($(el).text().trim().length > 5) {
            linksFound.push(href);
        }
    }
});

const uniqueLinks = [...new Set(linksFound)];
let rankFound = -1;
let currentRank = 0;

for (const link of uniqueLinks) {
  currentRank++;
  console.log(`${currentRank}: ${link}`);
  const urlLower = link.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "");
  if (urlLower.includes("5paisa.com")) {
    rankFound = currentRank;
  }
}

console.log("\nFinal Rank for 5paisa:", rankFound);
