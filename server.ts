import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GAMES_FILE = path.join(__dirname, "src", "games.json");

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Ensure src directory exists for data files
  try {
    await fs.mkdir(path.join(__dirname, "src"), { recursive: true });
    // Initialize games.json if it doesn't exist
    try {
      await fs.access(GAMES_FILE);
    } catch {
      await fs.writeFile(GAMES_FILE, JSON.stringify([
        {
          "id": "stickman-parkour",
          "title": "Stickman Parkour",
          "thumbnail": "https://picsum.photos/seed/stickman/400/250",
          "iframeUrl": "https://d11jzht7mj96rr.cloudfront.net/games/2024/construct/219/stickman-parkour/index-gg.html",
          "category": "Action"
        },
        {
          "id": "retro-snake",
          "title": "Retro Snake",
          "thumbnail": "https://picsum.photos/seed/snake/400/250",
          "type": "internal",
          "category": "Classic"
        },
        {
          "id": "bitlife",
          "title": "BitLife",
          "thumbnail": "https://picsum.photos/seed/bitlife/400/250",
          "iframeUrl": "https://macvg-games.github.io/strategy-games/bitlife/",
          "category": "Simulation"
        },
        {
          "id": "basketball-shoutout",
          "title": "Basketball Shoutout",
          "thumbnail": "https://picsum.photos/seed/basketball/400/250",
          "iframeUrl": "https://app-197304.games.s3.yandex.net/197304/kj9rcykboy6eol5xnn250jesr7v0hoh1/index.html",
          "category": "Sports"
        },
        {
          "id": "atari-breakout",
          "title": "Atari Breakout",
          "thumbnail": "https://picsum.photos/seed/atari/400/250",
          "iframeUrl": "/atari.html",
          "category": "Classic"
        },
        {
          "id": "dune-game",
          "title": "Dune Dash",
          "thumbnail": "https://picsum.photos/seed/dune/400/250",
          "iframeUrl": "/dune.html",
          "category": "Action"
        },
        {
          "id": "snow-rider-3d",
          "title": "Snow Rider 3D",
          "thumbnail": "https://picsum.photos/seed/snowrider/400/250",
          "iframeUrl": "/snow-rider.html",
          "category": "Action"
        }
      ], null, 2));
    }
  } catch (e) {
    console.error("Error initializing data directory:", e);
  }

  // API routes
  app.get("/api/games", async (req, res) => {
    try {
      const data = await fs.readFile(GAMES_FILE, "utf-8");
      res.json(JSON.parse(data));
    } catch (error) {
      res.status(500).json({ error: "Failed to read games file" });
    }
  });

  app.post("/api/games", async (req, res) => {
    try {
      const games = req.body;
      if (!Array.isArray(games)) {
        return res.status(400).json({ error: "Invalid data format" });
      }
      await fs.writeFile(GAMES_FILE, JSON.stringify(games, null, 2));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to save games" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom", // Changed to custom to handle multi-page better
    });
    app.use(vite.middlewares);
    
    // In dev, Vite handles the HTML files, but we can help it
    app.get(["/", "/index", "/index.html"], async (req, res, next) => {
      try {
        const html = await fs.readFile(path.resolve(__dirname, "index.html"), "utf-8");
        res.status(200).set({ "Content-Type": "text/html" }).end(await vite.transformIndexHtml(req.url, html));
      } catch (e) { next(e); }
    });
    
    app.get(["/game", "/game.html"], async (req, res, next) => {
      try {
        const html = await fs.readFile(path.resolve(__dirname, "game.html"), "utf-8");
        res.status(200).set({ "Content-Type": "text/html" }).end(await vite.transformIndexHtml(req.url, html));
      } catch (e) { next(e); }
    });

    app.get(["/atari", "/atari.html"], async (req, res, next) => {
      try {
        const html = await fs.readFile(path.resolve(__dirname, "atari.html"), "utf-8");
        res.status(200).set({ "Content-Type": "text/html" }).end(await vite.transformIndexHtml(req.url, html));
      } catch (e) { next(e); }
    });

    app.get(["/dune", "/dune.html"], async (req, res, next) => {
      try {
        const html = await fs.readFile(path.resolve(__dirname, "dune.html"), "utf-8");
        res.status(200).set({ "Content-Type": "text/html" }).end(await vite.transformIndexHtml(req.url, html));
      } catch (e) { next(e); }
    });

    app.get(["/snow-rider", "/snow-rider.html"], async (req, res, next) => {
      try {
        const html = await fs.readFile(path.resolve(__dirname, "snow-rider.html"), "utf-8");
        res.status(200).set({ "Content-Type": "text/html" }).end(await vite.transformIndexHtml(req.url, html));
      } catch (e) { next(e); }
    });
  } else {
    // Production: Serve static files from dist
    app.use(express.static("dist", { extensions: ["html"] }));
    
    // Handle routes without .html extension in production
    app.get("/", (req, res) => res.sendFile(path.join(__dirname, "dist", "index.html")));
    app.get("/game", (req, res) => res.sendFile(path.join(__dirname, "dist", "game.html")));
    app.get("/atari", (req, res) => res.sendFile(path.join(__dirname, "dist", "atari.html")));
    app.get("/dune", (req, res) => res.sendFile(path.join(__dirname, "dist", "dune.html")));
    app.get("/snow-rider", (req, res) => res.sendFile(path.join(__dirname, "dist", "snow-rider.html")));

    // Catch-all for SPA-like behavior on index.html if needed, but we have specific routes above
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
