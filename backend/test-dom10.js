const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('dump-in.html', 'utf8');
const $ = cheerio.load(html);

console.log("Extracting all fallback links:");
let pageLinks = [];
$("a[href^='http']").each((i, el) => {
    const href = $(el).attr("href");
    if (!href.includes("google.") && !href.includes("blogger.com") && !href.includes("youtube.com")) {
        // filter out tiny tracking pixels or empty structural wrappers
        if ($(el).text().trim().length > 5) {
            pageLinks.push(href);
        }
    }
});

const filteredLinks = [...new Set(pageLinks)];

filteredLinks.forEach((link, i) => {
    console.log(`${i+1}: ${link}`);
});
