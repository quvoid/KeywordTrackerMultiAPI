const axios = require('axios');

async function check() {
  try {
    const { data } = await axios.post("http://localhost:5000/tracker/run-direct", {
      domain: "5paisa.com",
      keywords: ["test keyword"],
      api_keys: { serper: "1a8f4ef636dbdfb24e3010104dff7f8d005e7d6d", serpapi: "", serpstack: "", zenserp: "" }
    });
    console.log("RESPONSE:", data);
  } catch (e) {
    console.log("ERROR:", e.response?.data || e.message);
  }
}
check();
