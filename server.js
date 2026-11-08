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
  serviceAccount = require('./beesyrup-35p4c-firebase-adminsdk-fbsvc-17167ae478.json');
}

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
    databaseURL: "https://beesyrup-35p4c-default-rtdb.europe-west1.firebasedatabase.app"
  });
}

console.log("🔥 Firebase Admin SDK initialized successfully!");

// --- VIEW ENGINE & VIEWS SETUP ---
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// --- GLOBAL MIDDLEWARE & ASSETS ---
app.use(express.static("public"));
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/media', express.static(path.join(__dirname, 'public', 'media')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- DATABASE & WEBSITE NAME MIDDLEWARE ---
app.use(async (req, res, next) => {
  try {
    req.db = getDatabase();
    const snapshot = await req.db.ref('website_name').once('value');
    res.locals.website_name = snapshot.val() || "Beely";
    next();
  } catch (err) {
    console.error("Failed to fetch website name from database:", err);
    res.locals.website_name = "Beely";
    next();
  }
});

// --- SITEMAP ROUTE ---
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

// --- IMPORT & MOUNT ROUTES ---
const mainRoutes = require("./routes/pages/index");
const musicRoutes = require("./routes/pages/music/index");

app.use("/", mainRoutes);
app.use("/", musicRoutes);

// --- ERROR HANDLING MIDDLEWARE ---
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
  res.status(502).render(path.join(process.cwd(), "views", "utils", "status", "502", "index.ejs"));
});

// --- START SERVER ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}!`);
});