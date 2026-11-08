const formatDuration = (d) => {
  const [, h = "0", m = "0", s = "0"] = d?.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/) || [];
  if (h !== "0") {
    return `${h}:${m.padStart(2, "0")}:${s.padStart(2, "0")}`;
  }
  return `${m}:${s.padStart(2, "0")}`;
};

const formatReleaseDate = (dateInput) => {
  if (!dateInput) return "Unknown Date";
  const parsed = new Date(dateInput);
  if (isNaN(parsed.getTime())) {
    return typeof dateInput === "string" ? dateInput : "Unknown Date";
  }
  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
};

const formatReleaseType = (categoryKey) => {
  const typeMap = {
    singles: "Single",
    albums: "Album",
    eps: "EP",
    remixes: "Remix"
  };
  const key = (categoryKey || "").toLowerCase().trim();
  if (typeMap[key]) {
    return typeMap[key];
  }
  const singular = key.endsWith("s") ? key.slice(0, -1) : key;
  return singular ? singular.charAt(0).toUpperCase() + singular.slice(1) : "Single";
};

const formatCategoryTitle = (categoryKey) => {
  const categoryMap = {
    singles: "Singles",
    eps: "EPs",
    albums: "Albums",
    remixes: "Remixes"
  };
  const key = (categoryKey || "").toLowerCase().trim();
  return categoryMap[key] || (key ? key.charAt(0).toUpperCase() + key.slice(1) : "");
};

const buildSameAsArray = (item = {}) => {
  const links = [];
  if (Array.isArray(item.sameAs)) {
    return item.sameAs.filter((url) => typeof url === "string" && url.trim() !== "");
  }

  if (item.spotify_url) {
    links.push(item.spotify_url);
  } else if (item.spotify_id) {
    const isTrack = Boolean(item.isrc || item.duration);
    const type = isTrack ? "track" : "album";
    links.push(`https://open.spotify.com/${type}/${item.spotify_id}`);
  }

  if (item.landr_url) {
    links.push(item.landr_url);
  } else if (item.upc) {
    links.push(`https://artists.landr.com/${item.upc}`);
  }

  if (item.apple_music_url) {
    links.push(item.apple_music_url);
  } else if (item.apple_music_id) {
    links.push(`https://music.apple.com/album/${item.apple_music_id}`);
  }

  if (item.bandcamp_url) {
    links.push(item.bandcamp_url);
  }

  if (item.youtube_url) {
    links.push(item.youtube_url);
  } else if (item.youtube_id) {
    links.push(`https://www.youtube.com/watch?v=${item.youtube_id}`);
  }

  if (item.soundcloud_url) {
    links.push(item.soundcloud_url);
  }

  return links.filter((url) => typeof url === "string" && url.trim() !== "");
};

const populateTracks = (r) => {
  if (!r) {
    console.log("Received null or undefined release object.");
    return r;
  }
  const rawTracks = r.tracks || r.track_list || [];
  let t = [];
  if (Array.isArray(rawTracks)) {
    t = rawTracks.map((track) => ({
      slug: track.slug || (track.name || track.title || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      ...track
    }));
  } else if (typeof rawTracks === "object" && rawTracks !== null) {
    t = Object.entries(rawTracks).map(([trackKey, trackVal]) => {
      const trackObj = typeof trackVal === "object" && trackVal !== null ? trackVal : { duration: trackVal };
      return {
        ...trackObj,
        slug: trackObj.slug || trackKey.trim().toLowerCase(),
        name: trackObj.name || trackObj.title || trackKey
      };
    });
  }
  t.sort((a, b) => (a.track_number || 0) - (b.track_number || 0));
  r.tracks = t.map((track) => {
    const trackDataForSameAs = {
      upc: r.upc,
      ...track
    };
    return {
      ...track,
      formattedDuration: formatDuration(track.duration),
      sameAs: buildSameAsArray(trackDataForSameAs)
    };
  });
  r.track_count = r.tracks.length;
  r.track_list = r.tracks.length ? r.tracks.slice(0, 2).map((x) => `${x.name} (${x.formattedDuration})`).join(" • ") + (r.tracks.length > 2 ? "..." : "") : "";
  return r;
};

const fetchReleasesList = async (db) => {
  if (!db) {
    console.log("🔥 [fetchReleasesList] Error: db instance is missing/null.");
    return [];
  }
  try {
    const snapshot = await db.ref("/music/releases").once("value");
    const releasesData = snapshot.val() || {};
    
    console.log("🔥 [fetchReleasesList] Raw Firebase Data Categories:", Object.keys(releasesData));
    
    const releasesList = [];

    for (const categoryKey in releasesData) {
      const categoryNode = releasesData[categoryKey];
      if (categoryNode && typeof categoryNode === "object") {
        console.log(`📁 [fetchReleasesList] Checking category '${categoryKey}', items:`, Object.keys(categoryNode));
        
        for (const [releaseKey, releaseVal] of Object.entries(categoryNode)) {
          if (releaseVal && typeof releaseVal === "object") {
            const hasValidIndicators = releaseVal.name || releaseVal.title || releaseVal.tracks || releaseVal.release_date;
            
            if (!hasValidIndicators) {
              console.log(`⏭️ [fetchReleasesList] Skipping non-release node '${releaseKey}' inside '${categoryKey}'`);
              continue;
            }

            const artist = releaseVal.artist || "BeeSyrup";
            const title = releaseVal.name || releaseVal.title || "Unknown Release";
            const slug = releaseVal.slug || releaseKey.trim().toLowerCase();
            const rawGenres = releaseVal.genres || [];
            const genres = (Array.isArray(rawGenres) ? rawGenres : Object.values(rawGenres)).filter((g) => g && typeof g === "string" && g.trim() !== "");
            const genre = genres[0] || "";
            const subgenre = genres[1] || "";
            const release_date = releaseVal.release_date || "";
            const date = formatReleaseDate(release_date);
            const duration = releaseVal.duration || "";
            const release_duration = formatDuration(duration);
            const modified_date = releaseVal.modified_date || "";
            const sameAs = buildSameAsArray(releaseVal);

            const baseRelease = {
              ...releaseVal,
              artist,
              title,
              slug,
              category: categoryKey,
              category_title: formatCategoryTitle(categoryKey),
              type: formatReleaseType(categoryKey),
              genres,
              genre,
              subgenre,
              release_date,
              date,
              duration,
              release_duration,
              modified_date,
              index: 0,
              sameAs
            };

            const populated = populateTracks(baseRelease);
            releasesList.push(populated);
            console.log(`🎵 [fetchReleasesList] Successfully parsed release: slug='${slug}', title='${title}'`);
          }
        }
      }
    }
    console.log(`✅ [fetchReleasesList] Total parsed releases: ${releasesList.length}`);
    return releasesList;
  } catch (err) {
    console.error("❌ [fetchReleasesList] Error fetching releases from Firebase:", err);
    return [];
  }
};

const buildRelease = async (db, targetSlug) => {
  const slug = targetSlug?.trim().toLowerCase();
  console.log(`🔍 [buildRelease] Searching for target slug: '${slug}'`);
  
  const releasesList = await fetchReleasesList(db);
  console.log("📋 [buildRelease] Available slugs in list:", releasesList.map(r => r.slug));

  const foundRelease = releasesList.find((r) => r.slug && r.slug.trim().toLowerCase() === slug);
  
  if (!foundRelease) {
    console.log(`⚠️ [buildRelease] No matching release found for slug: '${slug}'`);
    return { release: null, releasesList };
  }

  console.log(`🎉 [buildRelease] Found release matching '${slug}':`, foundRelease.title);
  return { release: populateTracks(foundRelease), releasesList };
};

const buildFeaturedRelease = async (db) => {
  const releasesList = await fetchReleasesList(db);
  releasesList.sort((a, b) => new Date(b.release_date || 0) - new Date(a.release_date || 0));
  const latestRelease = releasesList[0] || null;
  return { release: populateTracks(latestRelease), releasesList };
};

const buildTrack = async (db, targetSlug) => {
  const slug = targetSlug?.trim().toLowerCase();
  const releasesList = await fetchReleasesList(db);
  for (const release of releasesList) {
    const populated = populateTracks(release);
    if (populated.tracks && Array.isArray(populated.tracks)) {
      const match = populated.tracks.find(
        (t) => t.slug && t.slug.trim().toLowerCase() === slug
      );
      if (match) {
        return { track: match, release: populated, releasesList };
      }
    }
  }
  return { track: null, release: null, releasesList };
};

const fetchTracksList = async (db) => {
  const releasesList = await fetchReleasesList(db);
  let allTracks = [];
  for (const release of releasesList) {
    const populated = populateTracks(release);
    if (populated.tracks && Array.isArray(populated.tracks)) {
      const tracksWithRelease = populated.tracks.map((track) => ({
        ...track,
        release: populated
      }));
      allTracks = allTracks.concat(tracksWithRelease);
    }
  }
  return allTracks;
};

const generateSitemapXML = async (db) => {
  const releasesList = await fetchReleasesList(db);
  const tracksList = await fetchTracksList(db);
  const today = new Date().toISOString().split("T")[0];
  const staticPages = [
    { loc: "https://beesyrupmusic.com/", priority: "1.0", changefreq: "daily" },
    { loc: "https://beesyrupmusic.com/epk", priority: "0.8", changefreq: "weekly" },
    { loc: "https://beesyrupmusic.com/about", priority: "0.8", changefreq: "monthly" }
  ];
  let urls = "";
  staticPages.forEach((page) => {
    urls += `   <url>\n    <loc>${page.loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${page.changefreq}</changefreq>\n    <priority>${page.priority}</priority>\n   </url>\n`;
  });
  urls += `   <url>\n    <loc>https://beesyrupmusic.com/releases</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.9</priority>\n   </url>\n`;
  releasesList.forEach((release) => {
    if (release.slug) {
      let lastMod = today;
      if (release.release_date) {
        const parsed = new Date(release.release_date);
        if (!isNaN(parsed.getTime())) {
          lastMod = parsed.toISOString().split("T")[0];
        }
      }
      urls += `   <url>\n    <loc>https://beesyrupmusic.com/release/${release.slug}</loc>\n    <lastmod>${lastMod}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n   </url>\n`;
    }
  });
  urls += `   <url>\n    <loc>https://beesyrupmusic.com/tracks</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.9</priority>\n   </url>\n`;
  tracksList.forEach((track) => {
    if (track.slug) {
      let trackMod = today;
      if (track.release && track.release.release_date) {
        const parsed = new Date(track.release.release_date);
        if (!isNaN(parsed.getTime())) {
          trackMod = parsed.toISOString().split("T")[0];
        }
      }
      urls += `   <url>\n    <loc>https://beesyrupmusic.com/track/${track.slug}</loc>\n    <lastmod>${trackMod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n   </url>\n`;
    }
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}</urlset>`;
};

module.exports = { 
  formatDuration, 
  formatReleaseDate, 
  formatReleaseType, 
  formatCategoryTitle, 
  buildSameAsArray,
  fetchReleasesList, 
  buildRelease, 
  buildFeaturedRelease, 
  buildTrack, 
  fetchTracksList,
  generateSitemapXML 
};