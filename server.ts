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
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
