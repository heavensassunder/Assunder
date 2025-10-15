// ===== server.mjs =====
import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import multer from "multer";
import fs from "fs";

const app = express();
const upload = multer({ dest: "uploads/" });
app.use(cors());
app.use(express.json());
app.use(express.static("."));

// 🔒 Hardcoded (test only!)
const ASSEMBLY_KEY = "14a50415a54745748e14b026b1c55864";
const QWEN_API = "https://api.cerebras.ai/v1/chat/completions";
const QWEN_MODEL = "qwen-3-235b-a22b-instruct-2507";
const QWEN_KEY = "csk-y9yf4yy4mxdvxw4382kyn68mf6ycek8mvehmhx8nth89fcj6"; // your test Cerebras key

// ====== Chat text route ======
app.post("/chat", async (req, res) => {
  try {
    const response = await fetch(QWEN_API, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${QWEN_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: QWEN_MODEL,
        messages: req.body.messages || [],
      }),
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Chat proxy error:", err);
    res.status(500).json({ error: "Chat proxy error" });
  }
});

// ====== Voice recording route ======
app.post("/voice", upload.single("audio"), async (req, res) => {
  try {
    const filePath = req.file.path;
    const audioData = fs.readFileSync(filePath);

    // 1️⃣ Upload to AssemblyAI
    const uploadRes = await fetch("https://api.assemblyai.com/v2/upload", {
      method: "POST",
      headers: { authorization: ASSEMBLY_KEY },
      body: audioData,
    });
    const uploadUrl = (await uploadRes.json()).upload_url;

    // 2️⃣ Start transcription
    const transcribeRes = await fetch("https://api.assemblyai.com/v2/transcript", {
      method: "POST",
      headers: {
        authorization: ASSEMBLY_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ audio_url: uploadUrl }),
    });
    const transcript = await transcribeRes.json();

    // 3️⃣ Poll until finished
    let text = "";
    while (true) {
      const poll = await fetch(`https://api.assemblyai.com/v2/transcript/${transcript.id}`, {
        headers: { authorization: ASSEMBLY_KEY },
      });
      const json = await poll.json();
      if (json.status === "completed") {
        text = json.text;
        break;
      }
      if (json.status === "error") throw new Error(json.error);
      await new Promise(r => setTimeout(r, 3000));
    }

    console.log("🎤 Transcribed:", text);

    // 4️⃣ Send text to Qwen
    const aiRes = await fetch(QWEN_API, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${QWEN_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: QWEN_MODEL,
        messages: [{ role: "user", content: text }],
      }),
    });
    const aiData = await aiRes.json();
    const reply = aiData.choices?.[0]?.message?.content || "No reply.";

    console.log("🤖 AI Reply:", reply);

    // 5️⃣ Convert AI text reply to speech
    const ttsRes = await fetch("https://api.assemblyai.com/v2/text-to-speech", {
      method: "POST",
      headers: {
        authorization: ASSEMBLY_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: reply, voice: "alloy" }),
    });

    const ttsJson = await ttsRes.json();

    // Return both text and audio URL
    res.json({ text: reply, replyAudio: ttsJson.audio_url });
    fs.unlinkSync(filePath);
  } catch (err) {
    console.error("🎙️ Voice error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ====== Start server ======
app.listen(5000, () => console.log("🌩️ Server online at http://127.0.0.1:5000"));