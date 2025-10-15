const chatbox = document.getElementById("chatbox");
const input = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const recordBtn = document.getElementById("recordBtn");
const voiceReply = document.getElementById("voiceReply");

const history = JSON.parse(localStorage.getItem("chatHistory") || "[]");
const API_BASE = "https://assunder.onrender.com"; // replace if deployed elsewhere

function renderChat() {
  chatbox.innerHTML = "";
  history.forEach(msg => {
    const div = document.createElement("div");
    div.classList.add(msg.role);
    div.textContent = `${msg.role === "user" ? "🧑" : "🤖"} ${msg.content}`;
    chatbox.appendChild(div);
  });
  chatbox.scrollTop = chatbox.scrollHeight;
}
renderChat();

async function sendMessage() {
  const text = input.value.trim();
  if (!text) return;
  input.value = "";

  history.push({ role: "user", content: text });
  renderChat();

  try {
    const res = await fetch(`${API_BASE}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "qwen-3-235b-a22b-instruct-2507",
        messages: history
      }),
    });

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || "⚠️ No response";
    history.push({ role: "assistant", content: reply });
    localStorage.setItem("chatHistory", JSON.stringify(history));
    renderChat();
  } catch (err) {
    history.push({ role: "assistant", content: "❌ Network error: " + err.message });
    renderChat();
  }
}

sendBtn.onclick = sendMessage;
input.addEventListener("keypress", e => e.key === "Enter" && sendMessage());

// === Voice recording ===
let mediaRecorder, audioChunks = [];

recordBtn.onmousedown = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];
    recordBtn.classList.add("recording");
    mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
    mediaRecorder.start();
  } catch (err) {
    alert("🎙️ Microphone access denied: " + err.message);
  }
};

recordBtn.onmouseup = async () => {
  if (!mediaRecorder) return;
  recordBtn.classList.remove("recording");
  mediaRecorder.stop();

  mediaRecorder.onstop = async () => {
    const blob = new Blob(audioChunks, { type: "audio/webm" });
    const formData = new FormData();
    formData.append("audio", blob);

    try {
      const res = await fetch(`${API_BASE}/voice`, { method: "POST", body: formData });
      const data = await res.json();

      if (data.text) {
        history.push({ role: "assistant", content: data.text });
        localStorage.setItem("chatHistory", JSON.stringify(history));
        renderChat();
      }

      if (data.replyAudio) {
        voiceReply.src = data.replyAudio;
        voiceReply.hidden = false;
        voiceReply.play();
      }
    } catch (err) {
      alert("❌ Voice send failed: " + err.message);
    }
  };
};