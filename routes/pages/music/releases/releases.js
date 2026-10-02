const express = require("express");
const path = require('path');
const router = express.Router({ strict: true });
const { fetchReleasesList } = require(path.join(process.cwd(), "utils", "releases", "releases.js"));
const { notifyIndexNow } = require(path.join(process.cwd(), "utils", "indexNow"));
const ADMIN_SECRET = process.env.ADMIN_SECRET || "2Agcd/)e7hI9g[P8Ja8r9rl0Cw/ypkNQ";
const DOMAIN = "beesyrupmusic.com";
const Tracklist = path.join(process.cwd(), "views", "utils", "partials", "tracklist.ejs");

/* ==========================================================================
   RELEASES INDEX PAGE (Listing all releases at /releases)
   ========================================================================== */
router.get("/", async (req, res, next) => {
  try {
    const releasesList = await fetchReleasesList(req.db);
    return res.render("pages/music/releases/index", {
      releases: releasesList,
      release: null,
      tracklist: Tracklist
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;