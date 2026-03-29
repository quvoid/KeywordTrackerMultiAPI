const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('dump-in.html', 'utf8');
const $ = cheerio.load(html);

let results = "ALL A TAGS WITH TEXT > 5 AND HREF HTTP:\n\n";
let counter = 0;

$("a[href^='http']").each((i, el) => {
    const href = $(el).attr("href");
    if (!href.includes("google.") && !href.includes("blogger.com") && !href.includes("youtube.com")) {
        const text = $(el).text().trim().replace(/\n/g, ' ');
        if (text.length > 5) {
            counter++;
            // We want to see what classes wrap this anchor to identify patterns
            let parentClass = $(el).parent().attr('class') || 'none';
            let grandParentClass = $(el).parent().parent().attr('class') || 'none';
            results += `[${counter}] [P:${parentClass}] [GP:${grandParentClass}] Text: ${text.substring(0, 50)}...\nURL: ${href}\n\n`;
        }
    }
});

fs.writeFileSync('dom11_full_links.txt', results, 'utf8');
console.log("Written to dom11_full_links.txt");
