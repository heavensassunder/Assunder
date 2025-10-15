const chatbox = document.getElementById("chatbox");
const input = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

const history = JSON.parse(localStorage.getItem("chatHistory") || "[]");

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
    const res = await fetch("https://assunder.onrender.com/chat", {
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