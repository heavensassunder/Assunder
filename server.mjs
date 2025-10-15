// mini-chat/server.js
import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

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
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(5000, "127.0.0.1", () =>
  console.log("🚀 Cerebras proxy running on http://127.0.0.1:5000")
);
