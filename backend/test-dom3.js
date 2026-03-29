const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('dump-in.html', 'utf8');
const $ = cheerio.load(html);

const linksFound = [];
$("a[href^='http']").each((i, el) => {
    const href = $(el).attr("href");
    if (!href.includes("google.") && !href.includes("blogger.com") && !href.includes("youtube.com")) {
        // filter out empty links that are just icons
        if ($(el).text().trim().length > 5) {
            linksFound.push(href);
        }
    }
});

// Deduplicate identical links (sitelink spam mitigation)
const uniqueLinks = [...new Set(linksFound)];

console.log(`Found ${uniqueLinks.length} unique external links.`);
uniqueLinks.slice(0, 15).forEach((l, i) => {
    console.log(`${i+1}: ${l}`);
});
