require('dotenv').config();
const express = require("express");
const app = express();
const path = require("path");
const session = require("express-session");
const admin = require("firebase-admin");
const { cert, getApps, initializeApp } = require('firebase-admin/app');
const { getDatabase } = require('firebase-admin/database');
const { generateSitemapXML } = require('./utils/releases/releases.js');
let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
  serviceAccount = require('./serviceAccountKey.json');
}

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
    databaseURL: "https://beesyrup-674fd-default-rtdb.europe-west1.firebasedatabase.app"
  });
}

app.use((req, res, next) => {
  req.db = getDatabase();
  next();
});
console.log("🔥 Firebase Admin SDK initialized successfully!");

// Server public assets and middleware
app.use(express.static("public"));
app.use('/media', express.static(path.join(__dirname, 'public', 'media')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/sitemap.xml', async (req, res, next) => {
  try {
    const sitemap = await generateSitemapXML(req.db);
    res.header('Content-Type', 'application/xml');
    res.status(200).send(sitemap);
  } catch (err) {
    console.error('Failed to generate sitemap:', err);
    next(err);
  }
});

// --- 1. IMPORT ROUTES ---
const mainRoutes = require("./routes/pages/main-pages");
const releaseRoutes = require("./routes/pages/music/release/release");
const releaseListRoutes = require("./routes/pages/music/releases/releases");
const trackRoutes = require("./routes/pages/music/track/track");
const trackListRoutes = require("./routes/pages/music/tracks/tracks");

app.use("/", mainRoutes);
app.use("/release", releaseRoutes);
app.use("/releases", releaseListRoutes);
app.use("/track", trackRoutes);
app.use("/tracks", trackListRoutes);

// --- 2. GLOBAL SETTINGS & MIDDLEWARE ---
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Serve static assets first
app.use(express.static("public"));
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- 4. ERROR HANDLING MIDDLEWARE ---
app.use((err, req, res, next) => {
  console.error("[HTTP 404: Not Found / Does Not Exist]:", err.stack || err.message || err);
  res.status(404).render(path.join(process.cwd(), "views", "utils", "status", "404", "index.ejs"));
});
app.use((err, req, res, next) => {
  console.error("[HTTP 500: Internal Server Error]:", err.stack || err.message || err);
  res.status(500).render(path.join(process.cwd(), "views", "utils", "status", "500", "index.ejs"));
});
app.use((err, req, res, next) => {
  console.error("[HTTP 503: Inability To Handle Request]:", err.stack || err.message || err);
  res.status(503).render(path.join(process.cwd(), "views", "utils", "status", "503", "index.ejs"));
});

// --- 5. START SERVER ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}!`);
});