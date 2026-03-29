const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('dump-in.html', 'utf8');
const $ = cheerio.load(html);

$("a[href^='http']").each((i, el) => {
    const href = $(el).attr("href");
    if (href.includes('groww.in/stocks') || href.includes('kotak')) {
        const text = $(el).text().trim();
        if (text.length > 5) {
            console.log("\nFound Target. HTML of its grand-parent:");
            console.log($(el).parent().parent().parent().parent().html()?.substring(0, 500));
            
            console.log("\nWhat is the class of the wrapper div?");
            let current = $(el);
            for (let depth = 0; depth < 8; depth++) {
                current = current.parent();
                if (!current.length) break;
                if (current.prop('tagName') === 'DIV' && current.attr('class')) {
                    console.log(`Depth ${depth}: DIV class="${current.attr('class')}"`);
                }
            }
            return false; // break loop
        }
    }
});
