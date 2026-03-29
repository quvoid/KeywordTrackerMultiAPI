const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('dump-in.html', 'utf8');
const $ = cheerio.load(html);

console.log("Looking for xpd classes...");
const xpdLinks = [];
$(".xpd").each((i, el) => {
    const a = $(el).find("a[href^='http']").first();
    if(a.length) {
       const href = a.attr('href');
       if (!href.includes("google.") && !href.includes("blogger.com") && !href.includes("youtube.com")) {
          xpdLinks.push(href);
       }
    }
});

console.log(`Found ${xpdLinks.length} links inside .xpd`);
xpdLinks.slice(0, 15).forEach((l, i) => console.log(`${i+1}: ${l}`));
