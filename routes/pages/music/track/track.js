const express = require("express");
const path = require('path');
const router = express.Router({ strict: true });
const { buildTrack } = require(path.join(process.cwd(), "utils", "releases", "releases.js"));
const { notifyIndexNow } = require(path.join(process.cwd(), 'utils', 'indexNow'));
const ADMIN_SECRET = process.env.ADMIN_SECRET || "2Agcd/)e7hI9g[P8Ja8r9rl0Cw/ypkNQ";
const DOMAIN = "beesyrupmusic.com";
const Tracklist = path.join(process.cwd(), "views", "utils", "partials", "tracklist.ejs");

/* ==========================================================================
   REDIRECT SINGULAR /track TO /tracks
   ========================================================================== */
router.get("/", (req, res) => {
  return res.redirect(301, "/tracks");
});

/* ==========================================================================
   INDIVIDUAL TRACK VIEW ROUTE
   ========================================================================== */
router.get("/:slug", async (req, res, next) => {
  try {
    const targetSlug = req.params.slug;
    const { track, release, releasesList } = await buildTrack(req.db, targetSlug);
    if (!track || !release) {
      console.log(`[404] No track found matching slug: ${targetSlug}`);
      return res.status(404).render("utils/status/404/index");
    }
    return res.render("pages/music/track/index", {
      release,
      track,
      releasesList,
      tracklist: Tracklist
    });
  } catch (err) {
    console.error("Error rendering track page:", err);
    next(err);
  }
});

module.exports = router;