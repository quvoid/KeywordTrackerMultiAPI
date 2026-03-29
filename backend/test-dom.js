const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('test.html', 'utf8');
const $ = cheerio.load(html);

console.log("Searching for 5paisa.com in the HTML...");

$("a").each((i, el) => {
  const href = $(el).attr("href");
  if (href && href.includes("5paisa.com")) {
    console.log("---- Found Match! ----");
    console.log("Href:", href);
    console.log("Parent Chain:", $(el).parents().map((i, p) => p.tagName + (p.attribs.class ? '.' + p.attribs.class : '')).get().slice(0, 5).join(' > '));
    console.log("H3 inside?", $(el).find('h3').length > 0);
    console.log("H3 parent?", $(el).parents('h3').length > 0);
  }
});
