const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('dump-in.html', 'utf8');
const $ = cheerio.load(html);

console.log("Headers:");
console.log("H1:", $("h1").length);
console.log("H2:", $("h2").length);
console.log("H3:", $("h3").length);
console.log("H4:", $("h4").length);
console.log("H5:", $("h5").length);
console.log("H6:", $("h6").length);

let blueLinks = [];
$("div.MjjYud").each((i, block) => {
    // How many links in this block?
    const links = $(block).find("a[href^='http']").filter((idx, el) => {
        const h = $(el).attr("href");
        return !h.includes("google.") && !h.includes("youtube.") && !h.includes("blogger.com");
    });
    
    if (links.length > 0) {
        console.log(`Block ${i} has ${links.length} external links. First: ${links.first().attr('href')} - Text: ${links.first().text().substring(0, 30)}`);
    }
});
