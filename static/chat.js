const form = document.querySelector("#chat-form");
const input = document.querySelector("#message-input");
const sendButton = document.querySelector("#send-button");
const conversation = document.querySelector("#conversation");
const chatNotice = document.querySelector("#chat-notice");
const history = [];

document.querySelectorAll(".example-question").forEach((button) => {
  button.addEventListener("click", () => {
    input.value = button.textContent;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.focus();
  });
});

function addMessage(role, content, extraClass = "") {
  const row = document.createElement("article");
  row.className = `message ${role} ${extraClass}`;
  const label = document.createElement("div");
  label.className = "message-label";
  label.textContent = role === "user" ? "You" : role === "error" ? "Connection issue" : "Future Skills Advisor";
  const body = document.createElement("div");
  body.className = "message-body";
  if (role === "assistant") {
    const urlPattern = /https?:\/\/[^\s<>"']+/gi;
    let lastIndex = 0;
    for (const match of content.matchAll(urlPattern)) {
      const rawUrl = match[0];
      const url = rawUrl.replace(/[.,!?;:)\]]+$/, "");
      const trailing = rawUrl.slice(url.length);
      body.append(document.createTextNode(content.slice(lastIndex, match.index)));
      try {
        const parsedUrl = new URL(url);
        if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") throw new Error("Unsupported link protocol");
        const link = document.createElement("a");
        link.href = parsedUrl.href;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = url;
        body.append(link, document.createTextNode(trailing));
      } catch {
        body.append(document.createTextNode(rawUrl));
      }
      lastIndex = match.index + rawUrl.length;
    }
    body.append(document.createTextNode(content.slice(lastIndex)));
  } else {
    body.textContent = content;
  }
  row.append(label, body);
  conversation.querySelector(".welcome")?.remove();
  conversation.append(row);
  conversation.scrollTop = conversation.scrollHeight;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text || sendButton.disabled) return;

  addMessage("user", text);
  chatNotice.hidden = true;
  chatNotice.textContent = "";
  input.value = "";
  input.style.height = "auto";
  sendButton.disabled = true;
  sendButton.querySelector("span:first-child").textContent = "…";

  const pending = document.createElement("article");
  pending.className = "message assistant pending";
  pending.textContent = "Future Skills Advisor is thinking…";
  conversation.append(pending);
  conversation.scrollTop = conversation.scrollHeight;

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [...history, { role: "user", content: text }] }),
    });
    const result = await response.json();
    pending.remove();
    if (!response.ok) throw new Error(result.error || "The request failed.");
    if (result.notice) {
      chatNotice.textContent = result.notice;
      chatNotice.hidden = false;
    }
    history.push({ role: "user", content: text }, result.message);
    addMessage("assistant", result.message.content);
  } catch (error) {
    pending.remove();
    addMessage("error", error.message || "Could not contact the chat server.", "error-message");
  } finally {
    sendButton.disabled = false;
    sendButton.querySelector("span:first-child").textContent = "Send";
    input.focus();
  }
});

input.addEventListener("input", () => {
  input.style.height = "auto";
  input.style.height = `${Math.min(input.scrollHeight, 160)}px`;
});
input.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    form.requestSubmit();
  }
});


