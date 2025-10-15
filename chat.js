const chatbox = document.getElementById("chatbox");
const input = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

// Load chat history
const history = JSON.parse(localStorage.getItem("chatHistory") || "[]");

// Render chat history
function renderChat() {
  chatbox.innerHTML = "";
  history.forEach(msg => {
    const div = document.createElement("div");
    div.classList.add(msg.role);
    div.textContent = `${msg.role === "user" ? "🧑" : "⚡"} ${msg.content}`;
    chatbox.appendChild(div);
  });
  chatbox.scrollTop = chatbox.scrollHeight;
}
renderChat();

// Typewriter effect for assistant replies
function typeWriterEffect(message, callback) {
  const div = document.createElement("div");
  div.classList.add("assistant");
  chatbox.appendChild(div);

  let i = 0;
  function type() {
    if (i < message.length) {
      div.textContent = "⚡ " + message.slice(0, i + 1);
      i++;
      chatbox.scrollTop = chatbox.scrollHeight;
      setTimeout(type, 30); // typing speed
    } else if (callback) {
      callback();
    }
  }
  type();
}

// Handle message send
async function sendMessage() {
  const text = input.value.trim();
  if (!text) return;
  input.value = "";

  history.push({ role: "user", content: text });
  renderChat();

  // Placeholder while waiting
  const thinkingDiv = document.createElement("div");
  thinkingDiv.classList.add("assistant");
  thinkingDiv.textContent = "⚡ The heavens are thinking...";
  chatbox.appendChild(thinkingDiv);
  chatbox.scrollTop = chatbox.scrollHeight;

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
    const reply = data.choices?.[0]?.message?.content || "⚠️ The heavens were silent.";
    chatbox.removeChild(thinkingDiv);

    // Animate the assistant's reply
    typeWriterEffect(reply, () => {
      history.push({ role: "assistant", content: reply });
      localStorage.setItem("chatHistory", JSON.stringify(history));
    });

  } catch (err) {
    chatbox.removeChild(thinkingDiv);
    const errDiv = document.createElement("div");
    errDiv.classList.add("assistant");
    errDiv.textContent = "❌ A thunderstorm blocked the signal: " + err.message;
    chatbox.appendChild(errDiv);
  }
}

sendBtn.onclick = sendMessage;
input.addEventListener("keypress", e => e.key === "Enter" && sendMessage());