const express = require("express");
const path = require('path');
const router = express.Router({ strict: true });
const { fetchTracksList } = require(path.join(process.cwd(), "utils", "releases", "releases.js"));
const { notifyIndexNow } = require(path.join(process.cwd(), 'utils', 'indexNow'));
const ADMIN_SECRET = process.env.ADMIN_SECRET || "2Agcd/)e7hI9g[P8Ja8r9rl0Cw/ypkNQ";
const DOMAIN = "beesyrupmusic.com";
const Tracklist = path.join(process.cwd(), "views", "utils", "partials", "tracklist.ejs");

/* ==========================================================================
   TRACKS INDEX PAGE (Listing all tracks at /tracks)
   ========================================================================== */
router.get("/", async (req, res, next) => {
  try {
    const tracksList = await fetchTracksList(req.db);
    return res.render("pages/music/tracks/index", {
      tracks: tracksList,
      tracklist: Tracklist
    });
  } catch (err) {
    console.error("Error rendering tracks listing:", err);
    next(err);
  }
});

module.exports = router;