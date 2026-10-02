const express = require("express");
const path = require("path");
const router = express.Router({ strict: true });
const { buildRelease } = require(path.join(process.cwd(), "utils", "releases", "releases.js"));
const { notifyIndexNow } = require(path.join(process.cwd(), "utils", "indexNow"));
const ADMIN_SECRET = process.env.ADMIN_SECRET || "2Agcd/)e7hI9g[P8Ja8r9rl0Cw/ypkNQ";
const DOMAIN = "beesyrupmusic.com";
const Tracklist = path.join(process.cwd(), "views", "utils", "partials", "tracklist.ejs");
const release_header = path.join(process.cwd(), "views", "utils", "partials", "release_header.ejs");
const storeModule = path.join(process.cwd(), "views", "utils", "partials", "popup", "streamingmodule.ejs");

/* =======================================
   REDIRECT SINGULAR /release TO /releases
   ======================================= */
router.get("/", (req, res) => {
  return res.redirect(301, "/releases");
});

/* =================================================================
   ALBUM / RELEASE VIEW PAGE (Single release by slug - MUST BE LAST)
   ================================================================= */
router.get("/:slug", async (req, res, next) => {
  try {
    const targetSlug = req.params.slug;
    const { release, releasesList } = await buildRelease(req.db, targetSlug);
    if (!release) {
      console.log(`[404] No release found matching slug: ${targetSlug}`);
      return res.status(404).render("utils/status/404/index");
    }
    return res.render("pages/music/release/index", {
      release: release,
      releases: releasesList,
      tracklist: Tracklist,
      header: release_header,
      storemodule: storeModule,
    });
  } catch (err) {
    next(err);
  }
});

/* =================================================================
   REDIRECT FROM TRAILING SLASH
   ================================================================= */
router.get("/:slug/", async (req, res, next) => {
  const targetSlug = req.params.slug;
  return res.redirect(301, `/release/${targetSlug}`);
});

module.exports = router;