const axios = require("axios");
const fs = require("fs");

const SERPER_KEY    = "1a8f4ef636dbdfb24e3010104dff7f8d005e7d6d";
const SEARCHAPI_KEY = "ZBF05FU8pHNktev37DR4LJOO";
const SERPSTACK_KEY = "a6b96de83b973ed6053585e09ae";
const ZENSERP_KEY   = "5adb02c0-2b40-11f1-afe0-ed867"; // Fix user's typo from image `5adb02c0`

const KEYWORD = "live mcx gold price";
const DOMAIN  = "5paisa.com";

let logOutput = "";
function log(msg) {
  console.log(msg);
  logOutput += msg + "\n";
}

async function testAll() {
  log("--- Testing SERPER ---");
  try {
    const { data } = await axios.post("https://google.serper.dev/search", { q: KEYWORD, num: 10 }, { headers: { "X-API-KEY": SERPER_KEY } });
    log("✅ Success, organic results: " + (data.organic?.length || 0));
  } catch (e) {
    log("❌ Error: " + JSON.stringify(e.response?.data || e.message));
  }

  log("\n--- Testing SEARCHAPI.IO ---");
  try {
    const { data } = await axios.get("https://www.searchapi.io/api/v1/search", { params: { engine: "google", q: KEYWORD, api_key: SEARCHAPI_KEY } });
    log("✅ Success, organic results: " + (data.organic_results?.length || 0));
  } catch (e) {
    log("❌ Error: " + JSON.stringify(e.response?.data || e.message));
  }

  log("\n--- Testing SERPSTACK ---");
  try {
    const { data } = await axios.get("http://api.serpstack.com/search", { params: { access_key: SERPSTACK_KEY, query: KEYWORD } });
    if (data.error) log("❌ Error in data: " + JSON.stringify(data.error));
    else log("✅ Success, organic results: " + (data.organic_results?.length || 0));
  } catch (e) {
    log("❌ Error: " + JSON.stringify(e.response?.data || e.message));
  }

  log("\n--- Testing ZENSERP ---");
  try {
    const { data } = await axios.get("https://app.zenserp.com/api/v2/search", { params: { q: KEYWORD }, headers: { apikey: ZENSERP_KEY } });
    if (data.error) log("❌ Error in data: " + JSON.stringify(data.error));
    else log("✅ Success, organic results: " + (data.organic?.length || 0));
  } catch (e) {
    log("❌ Error: " + JSON.stringify(e.response?.data || e.message));
  }

  fs.writeFileSync("api-test-log.txt", logOutput);
}

testAll();
