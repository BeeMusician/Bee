const express = require('express');
const path = require('path');
const router = express.Router(); 
const { fetchReleasesList, buildRelease, buildTrack, fetchTracksList } = require(path.join(process.cwd(), "utils", "releases", "releases.js"));

const releaseheader = path.join(process.cwd(), "views", "utils", "partials", "release_header.ejs");
const streamingmodule = path.join(process.cwd(), "views", "utils", "partials", "popup", "storemodule.ejs");
const Tracklist = path.join(process.cwd(), "views", "utils", "partials", "tracklist.ejs");
const Sidebar = path.join(process.cwd(), "views", "utils", "partials", "popup", "sidebar", "index.ejs");

const DEFAULT_ARTIST = "BeeSyrup";

/* =======================================
   RELEASES LIST PAGE (/releases)
   ======================================= */
router.get('/releases', async (req, res, next) => {
  try {
    const releasesList = await fetchReleasesList(req.db);

    res.render('pages/music/releases/index', {
      releases: releasesList,
      releasesList,
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
   REDIRECT BARE RELEASE (/release -> /releases)
   ======================================= */
router.get('/release', (req, res) => {
  res.redirect('/releases');
});

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

    res.render('pages/music/releases/release-page/index', {
      release,
      releasesList,
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
   TRACKS LIST PAGE (/tracks)
   ======================================= */
router.get('/tracks', async (req, res, next) => {
  try {
    const allTracks = await fetchTracksList(req.db);
    const releasesList = await fetchReleasesList(req.db);

    res.render('pages/music/tracks/index', {
      tracks: allTracks,
      releasesList,
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
   REDIRECT BARE TRACK (/track -> /tracks)
   ======================================= */
router.get('/track', (req, res) => {
  res.redirect('/tracks');
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
      track,
      release,
      releasesList,
      artist: DEFAULT_ARTIST,
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