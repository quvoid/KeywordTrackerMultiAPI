const fs = require('fs');
const cheerio = require('cheerio');

// Let's load the exact HTML dump we have from ScrapingRobot
const html = fs.readFileSync('dump-in.html', 'utf8');
const $ = cheerio.load(html);

console.log("=== DEEP SERP ANALYSIS ===");

// Strategy: Let's find known ranking links like 'groww.in' and trace their Ancestor tree perfectly.
// We know Groww and Kotak rank organically. Let's find exactly how they are nested.

console.log("\n--- TRACING ORGANIC ANCESTORS ---");
$("a[href^='http']").each((i, el) => {
    const href = $(el).attr("href");
    if (href.includes('groww.in') || href.includes('kotak')) {
        const text = $(el).text().trim().substring(0, 30);
        if (text.length > 3) {
            console.log(`\nLink: ${href} | Text: ${text}`);
            
            // Traverse upwards to see the class path
            let path = [];
            let current = $(el);
            for (let depth = 0; depth < 5; depth++) {
                current = current.parent();
                if (!current.length) break;
                const tagName = current.prop('tagName');
                const className = current.attr('class') || '';
                path.push(`${tagName}.${className.split(' ').join('.')}`);
            }
            console.log(`Ancestry (bottom-up): ${path.join('  <  ')}`);
        }
    }
});

console.log("\n--- EXAMINING KNOWN CLASSES ---");
// Let's also check standard mobile classes
const mobileClasses = ['.xpd', '.ZINbbc', '.kCrYT', '.vvjwJb'];
mobileClasses.forEach(cls => {
    console.log(`Found ${$(cls).length} elements with class ${cls}`);
});
