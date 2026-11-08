const express = require("express");
const path = require("path");
const router = express.Router({ strict: true });
const { buildFeaturedRelease, fetchTracksList } = require(path.join(process.cwd(), "utils", "releases", "releases.js"));
const { notifyIndexNow } = require(path.join(process.cwd(), "utils", "indexNow"));
const ADMIN_SECRET = process.env.ADMIN_SECRET || "2Agcd/)e7hI9g[P8Ja8r9rl0Cw/ypkNQ";
const DOMAIN = "beesyrupmusic.com";
const Tracklist = path.join(process.cwd(), "views", "utils", "partials", "tracklist.ejs");
const Header = path.join(process.cwd(), "views", "utils", "partials", "header.ejs");

/* =======================================
   HOME PAGE ROUTE
   ======================================= */
router.get("/", async (req, res, next) => {
  try {
    const { release: featuredRelease, releasesList } = await buildFeaturedRelease(req.db);
    const tracksList = await fetchTracksList(req.db);
    return res.render("pages/index", {
      release: featuredRelease,
      featuredRelease: featuredRelease,
      releases: releasesList,
      tracks: tracksList,
      tracklist: Tracklist,
      header: Header,
    });
  } catch (err) {
    next(err);
  }
});

/* =======================================
   EPK PAGE ROUTE
   ======================================= */
router.get("/epk", async (req, res, next) => {
  try {
    const { release: featuredRelease, releasesList } = await buildFeaturedRelease(req.db);
    const tracksList = await fetchTracksList(req.db);
    return res.render("pages/epk/index", {
      release: featuredRelease,
      featuredRelease: featuredRelease,
      releases: releasesList,
      tracks: tracksList,
      tracklist: Tracklist,
      header: Header,
    });
  } catch (err) {
    next(err);
  }
});

/* =======================================
   ABOUT PAGE ROUTE
   ======================================= */
router.get("/about", async (req, res, next) => {
  try {
    const { release: featuredRelease, releasesList } = await buildFeaturedRelease(req.db);
    const tracksList = await fetchTracksList(req.db);
    return res.render("pages/about/index", {
      release: featuredRelease,
      featuredRelease: featuredRelease,
      releases: releasesList,
      tracks: tracksList,
      tracklist: Tracklist,
      header: Header,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;