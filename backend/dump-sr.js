const axios = require("axios");
const fs = require("fs");

async function dump() {
  const keyword = "intraday stocks";
  const apiKey = "f0badedd-eddc-43ec-aa4c-762a8ade1fd6";
  const targetUrl = `https://www.google.com/search?q=${encodeURIComponent(keyword)}&start=0&num=10&hl=en&gl=in`;
  const srUrl = `https://api.scrapingrobot.com/?token=${apiKey}&render=false&url=${encodeURIComponent(targetUrl)}`;
  
  try {
    const { data } = await axios.get(srUrl, { timeout: 45000 });
    const htmlStr = data.result || data.html || (typeof data === "string" ? data : JSON.stringify(data));
    fs.writeFileSync("dump-in.html", htmlStr);
    console.log("Dumped to dump-in.html");
  } catch (e) {
    console.error("Error:", e.message);
  }
}
dump();
