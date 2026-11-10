const axios = require("axios");

const INDEXNOW_KEY = "0905d0906e2b4b789d19077f3533ca42";
const DOMAIN = "beesyrupmusic.com";

async function notifyIndexNow(urlsArray) {
  try {
    const response = await axios.post("https://api.indexnow.org/indexnow", {
      host: DOMAIN,
      key: INDEXNOW_KEY,
      keyLocation: `https://${DOMAIN}/${INDEXNOW_KEY}.txt`,
      urlList: urlsArray
    }, {
      headers: { "Content-Type": "application/json" }
    });
    console.log("IndexNow updated search engines:", response.status);
    return true;
  } catch (err) {
    console.error("IndexNow ping failed:", err.response?.data || err.message);
    return false;
  }
}

module.exports = { notifyIndexNow };