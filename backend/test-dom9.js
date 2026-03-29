const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('dump-in.html', 'utf8');
const $ = cheerio.load(html);

let results = "Analyzing .MjjYud blocks:\n";
let blueRanks = 0;
$("div.MjjYud").each((i, block) => {
    const links = [];
    $(block).find("a[href^='http']").each((_, el) => {
        const href = $(el).attr("href");
        if (!href.includes("google.") && !href.includes("youtube.") && !href.includes("blogger.com")) {
            const text = $(el).text().trim();
            if(text.length > 5) {
                links.push(href);
            }
        }
    });

    const uniqueLinks = [...new Set(links)];
    
    if (uniqueLinks.length > 0) {
        const uniqueDomains = new Set(uniqueLinks.map(l => {
           try { return new URL(l).hostname.replace('www.', ''); } catch(e) { return l; }
        }));
        
        if (uniqueDomains.size > 2) {
            results += `[IGNORE] Block ${i} looks like Top Stories/Carousel! Domains: ${uniqueDomains.size}, Links: ${uniqueLinks.length}\n`;
        } else {
            blueRanks++;
            results += `[RANK ${blueRanks}] Block ${i}: Domain=${[...uniqueDomains][0]}\nMain Link: ${uniqueLinks[0]}\n`;
        }
    }
});

fs.writeFileSync('dom9_clean.txt', results, 'utf8');
console.log("Written to dom9_clean.txt");
