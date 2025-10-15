// server.mjs
import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(cors());
app.use(express.json());

// Serve index.html and chat.js
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(__dirname));

// Hardcoded key for quick testing
const API_KEY = "csk-y9yf4yy4mxdvxw4382kyn68mf6ycek8mvehmhx8nth89fcj6";
const MODEL = "qwen-3-235b-a22b-instruct-2507";

app.post("/chat", async (req, res) => {
  try {
    const response = await fetch("https://api.cerebras.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: req.body.messages || [],
      }),
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).json({ error: "Server error: " + err.message });
  }
});

app.listen(5000, "0.0.0.0", () => {
  console.log("🚀 Cerebras proxy running on port 5000");
});