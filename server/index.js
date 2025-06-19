const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Store uploaded files in /uploads
const upload = multer({ dest: "uploads/" });

// In-memory store for episodes (replace with DB later if needed)
let episodes = [];

// Upload Endpoint
app.post("/upload", upload.single("audio"), (req, res) => {
  const { title, description } = req.body;
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const fileUrl = `http://localhost:${PORT}/uploads/${req.file.filename}`;
  const episodeData = {
    title,
    description,
    fileUrl,
    filename: req.file.filename,
    pubDate: new Date().toUTCString(),
  };

  episodes.push(episodeData);
  res.json({ success: true, episode: episodeData });
});

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// RSS Feed Endpoint
app.get("/rss.xml", (req, res) => {
  const rssItems = episodes
    .map(
      (ep) => `
    <item>
      <title>${ep.title}</title>
      <description>${ep.description}</description>
      <enclosure url="${ep.fileUrl}" type="audio/mpeg" />
      <guid>${ep.fileUrl}</guid>
      <pubDate>${ep.pubDate}</pubDate>
    </item>`
    )
    .join("");

  const rssFeed = `
  <rss version="2.0">
    <channel>
      <title>My Podcast</title>
      <link>http://localhost:${PORT}</link>
      <description>A sample podcast feed</description>
      <language>en-us</language>
      ${rssItems}
    </channel>
  </rss>`;

  res.type("application/xml");
  res.send(rssFeed);
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
