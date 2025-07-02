const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Use environment variable for deployed BASE_URL or fallback to localhost
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

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

  const ext = path.extname(req.file.originalname);
  const newFilename = `${req.file.filename}${ext}`;
  const newPath = path.join("uploads", newFilename);
  fs.renameSync(req.file.path, newPath);

  const fileUrl = `${BASE_URL}/uploads/${newFilename}`;
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
app.get("/uploads/:filename", (req, res) => {
  const filePath = path.join(__dirname, "uploads", req.params.filename);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) return res.sendStatus(404);

    const range = req.headers.range;
    if (!range) {
      res.writeHead(200, {
        "Content-Length": stats.size,
        "Content-Type": "audio/mpeg",
      });
      fs.createReadStream(filePath).pipe(res);
    } else {
      const [startStr, endStr] = range.replace(/bytes=/, "").split("-");
      const start = parseInt(startStr, 10);
      const end = endStr ? parseInt(endStr, 10) : stats.size - 1;

      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${stats.size}`,
        "Accept-Ranges": "bytes",
        "Content-Length": end - start + 1,
        "Content-Type": "audio/mpeg",
      });

      fs.createReadStream(filePath, { start, end }).pipe(res);
    }
  });
});

// RSS Feed Endpoint (Apple/Spotify compatible)
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
        <itunes:author>Satyam</itunes:author>
        <itunes:explicit>no</itunes:explicit>
        <itunes:duration>00:02:00</itunes:duration> <!-- optional placeholder -->
      </item>`
    )
    .join("");

  const rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
 <rss version="2.0"
     xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
     xmlns:media="http://search.yahoo.com/mrss/"
     xmlns:podcast="https://podcastindex.org/namespace/1.0"
     xmlns:atom="http://www.w3.org/2005/Atom">
    <channel>
    <atom:link href="https://rss-feed-production-109c.up.railway.app/rss.xml" rel="self" type="application/rss+xml" />
      <title>My Podcast</title>
      <link>${BASE_URL}</link>
      <language>en-us</language>
      <description>A podcast where I explore the world of software, technology, and creative tools in depth every week.</description>
      <itunes:author>Satyam</itunes:author>
      <itunes:summary>Join me every week as I dive into the latest in software development, creative tools, and behind-the-scenes stories from tech creators.</itunes:summary>
      <itunes:owner>
        <itunes:name>Satyam</itunes:name>
        <itunes:email>dhanush@koolio.ai</itunes:email>
      </itunes:owner>
      <itunes:image href="${BASE_URL}/uploads/podcast-cover.jpg"/>
      <itunes:explicit>no</itunes:explicit>
      <itunes:category text="Technology">
        <itunes:category text="Software"/>
      </itunes:category>
      ${rssItems}
    </channel>
  </rss>`;

  res.type("application/xml");
  res.send(rssFeed);
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running at ${BASE_URL}`);
});
