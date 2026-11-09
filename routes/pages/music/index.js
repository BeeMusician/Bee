const express = require('express');
const path = require('path');
const router = express.Router(); 
const { buildRelease, buildTrack } = require(path.join(process.cwd(), "utils", "releases", "releases.js"));
const releaseheader = path.join(process.cwd(), "views", "utils", "partials", "release_header.ejs");
const streamingmodule = path.join(process.cwd(), "views", "utils", "partials", "popup", "storemodule.ejs");
const Tracklist = path.join(process.cwd(), "views", "utils", "partials", "tracklist.ejs");
const Sidebar = path.join(process.cwd(), "views", "utils", "partials", "popup", "sidebar", "index.ejs");

/* =======================================
   INDIVIDUAL RELEASE PAGE (/release/:slug)
   ======================================= */
router.get('/release/:slug', async (req, res, next) => {
  try {
    const targetSlug = req.params.slug;
    const { release, releasesList } = await buildRelease(req.db, targetSlug);
    
    if (!release) {
      return next(new Error("Release not found"));
    }

    const track = (release.tracks && release.tracks.length > 0) ? release.tracks[0] : {};

    res.render('pages/music/releases/release-page/index', {
      release,
      releasesList,
      track,
      tracks: release.tracks,
      header: releaseheader,
      storemodule: streamingmodule,
      tracklist: Tracklist,
      sidebar: Sidebar
    });
  } catch (err) {
    next(err);
  }
});

/* =======================================
   INDIVIDUAL TRACK PAGE (/track/:slug)
   ======================================= */
router.get('/track/:slug', async (req, res, next) => {
  try {
    const targetSlug = req.params.slug;
    const { track, release, releasesList } = await buildTrack(req.db, targetSlug);
    
    if (!track || !release) {
      return next(new Error("Track not found"));
    }

    res.render('pages/music/tracks/track-page/index', {
      release,
      releasesList,
      track,
      tracks: release.tracks,
      header: releaseheader,
      storemodule: streamingmodule,
      tracklist: Tracklist,
      sidebar: Sidebar
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;