import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GAMES_FILE = path.join(__dirname, "src", "games.json");
const COMMENTS_FILE = path.join(__dirname, "src", "comments.json");

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
          "iframeUrl": "https://d11jzht7mj96rr.cloudfront.net/games/2024/construct/219/stickman-parkour/index-gg.html"
        },
        {
          "id": "retro-snake",
          "title": "Retro Snake",
          "thumbnail": "https://picsum.photos/seed/snake/400/250",
          "type": "internal"
        }
      ], null, 2));
    }
    // Initialize comments.json if it doesn't exist
    try {
      await fs.access(COMMENTS_FILE);
    } catch {
      await fs.writeFile(COMMENTS_FILE, JSON.stringify([], null, 2));
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

  app.get("/api/comments", async (req, res) => {
    try {
      const data = await fs.readFile(COMMENTS_FILE, "utf-8");
      res.json(JSON.parse(data));
    } catch (error) {
      res.json([]); // Return empty array if file doesn't exist
    }
  });

  app.post("/api/comments", async (req, res) => {
    try {
      const { username, text } = req.body;
      if (!username || !text) {
        return res.status(400).json({ error: "Missing fields" });
      }

      let comments = [];
      try {
        const data = await fs.readFile(COMMENTS_FILE, "utf-8");
        comments = JSON.parse(data);
      } catch (e) {
        // File might not exist yet
      }

      const newComment = {
        id: Date.now(),
        username,
        text,
        timestamp: new Date().toISOString()
      };

      comments.push(newComment);
      // Keep only last 100 comments
      if (comments.length > 100) comments = comments.slice(-100);

      await fs.writeFile(COMMENTS_FILE, JSON.stringify(comments, null, 2));
      res.json(newComment);
    } catch (error) {
      res.status(500).json({ error: "Failed to save comment" });
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
    
    app.get(["/admin", "/admin.html"], async (req, res, next) => {
      try {
        const html = await fs.readFile(path.resolve(__dirname, "admin.html"), "utf-8");
        res.status(200).set({ "Content-Type": "text/html" }).end(await vite.transformIndexHtml(req.url, html));
      } catch (e) { next(e); }
    });

    app.get(["/comments", "/comments.html"], async (req, res, next) => {
      try {
        const html = await fs.readFile(path.resolve(__dirname, "comments.html"), "utf-8");
        res.status(200).set({ "Content-Type": "text/html" }).end(await vite.transformIndexHtml(req.url, html));
      } catch (e) { next(e); }
    });

    app.get(["/soundboard", "/soundboard.html"], async (req, res, next) => {
      try {
        const html = await fs.readFile(path.resolve(__dirname, "soundboard.html"), "utf-8");
        res.status(200).set({ "Content-Type": "text/html" }).end(await vite.transformIndexHtml(req.url, html));
      } catch (e) { next(e); }
    });

    app.get(["/game", "/game.html"], async (req, res, next) => {
      try {
        const html = await fs.readFile(path.resolve(__dirname, "game.html"), "utf-8");
        res.status(200).set({ "Content-Type": "text/html" }).end(await vite.transformIndexHtml(req.url, html));
      } catch (e) { next(e); }
    });
  } else {
    // Production: Serve static files from dist
    app.use(express.static("dist", { extensions: ["html"] }));
    
    // Handle routes without .html extension in production
    app.get("/", (req, res) => res.sendFile(path.join(__dirname, "dist", "index.html")));
    app.get("/admin", (req, res) => res.sendFile(path.join(__dirname, "dist", "admin.html")));
    app.get("/comments", (req, res) => res.sendFile(path.join(__dirname, "dist", "comments.html")));
    app.get("/soundboard", (req, res) => res.sendFile(path.join(__dirname, "dist", "soundboard.html")));
    app.get("/game", (req, res) => res.sendFile(path.join(__dirname, "dist", "game.html")));

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
