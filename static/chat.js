const form = document.querySelector("#chat-form");
const input = document.querySelector("#message-input");
const sendButton = document.querySelector("#send-button");
const conversation = document.querySelector("#conversation");
const startOverButton = document.querySelector("#start-over");
const interviewArea = document.querySelector("#interview-area");
const history = [];
let questions = [];
let answers = {};
let questionIndex = 0;
let recommendationReady = false;
let busy = false;

function addMessage(role, content, extraClass = "", sources = [], questionId = null) {
  const row = document.createElement("article");
  row.className = `message ${role} ${extraClass}`;
  if (questionId) row.dataset.questionId = questionId;
  const label = document.createElement("div");
  label.className = "message-label";
  label.textContent = role === "user" ? "You" : role === "error" ? "Connection issue" : "Future Skills Advisor";
  const body = document.createElement("div");
  body.className = "message-body";
  body.textContent = content;
  row.append(label, body);
  if (role === "assistant" && (sources.length || extraClass === "recommendation")) {
    const disclosure = document.createElement("details");
    disclosure.className = "sources-used";
    const summary = document.createElement("summary");
    summary.textContent = "Sources used";
    const list = document.createElement("ul");
    for (const source of sources) {
      const item = document.createElement("li");
      const heading = document.createElement("strong");
      heading.textContent = `${source.name}${source.page ? ` - Page ${source.page}` : " - page unavailable"}`;
      const excerpt = document.createElement("p");
      excerpt.textContent = source.excerpt;
      item.append(heading, excerpt);
      list.append(item);
    }
    disclosure.append(summary, list);
    row.append(disclosure);
  }
  conversation.append(row);
  conversation.scrollTop = conversation.scrollHeight;
  return row;
}

function visibleQuestions() {
  return questions.filter((question) => {
    if (!question.show_if) return true;
    const value = answers[question.show_if.question];
    const values = Array.isArray(value) ? value : [value];
    return values.includes(question.show_if.includes);
  });
}

function currentQuestion() {
  const visible = visibleQuestions();
  questionIndex = Math.min(questionIndex, Math.max(0, visible.length - 1));
  return { question: visible[questionIndex], visible };
}

function renderQuestion() {
  const { question, visible } = currentQuestion();
  if (!question) return;
  interviewArea.hidden = false;
  interviewArea.replaceChildren();
  const progress = document.createElement("p");
  progress.className = "question-progress";
  progress.textContent = `Question ${questionIndex + 1} of ${visible.length}`;
  const bubble = document.createElement("article");
  bubble.className = "message assistant interview-question";
  const label = document.createElement("div");
  label.className = "message-label";
  label.textContent = "Future Skills Advisor";
  const body = document.createElement("div");
  body.className = "message-body";
  body.textContent = question.text;
  bubble.append(label, body);
  const options = document.createElement("div");
  options.className = "interview-options";
  const selected = answers[question.id];
  const selectedValues = Array.isArray(selected) ? selected : selected ? [selected] : [];
  const labels = [...question.options];
  if (question.allow_other && !labels.includes("Other")) labels.push("Other");
  for (const option of labels) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `option-button${selectedValues.includes(option) || selectedValues.some((item) => item.startsWith("Other: ") && option === "Other") ? " selected" : ""}`;
    button.textContent = option;
    button.setAttribute("aria-pressed", String(button.classList.contains("selected")));
    button.addEventListener("click", () => chooseOption(question, option));
    options.append(button);
  }
  const otherValue = selectedValues.find((value) => value.startsWith("Other: "))?.slice(7) || "";
  let otherInput;
  const showOther = question.allow_other && selectedValues.some((value) => value === "Other" || value.startsWith("Other: "));
  if (showOther) {
    otherInput = document.createElement("input");
    otherInput.className = "other-answer";
    otherInput.type = "text";
    otherInput.maxLength = 200;
    otherInput.placeholder = "Type your answer";
    otherInput.value = otherValue;
    otherInput.setAttribute("aria-label", "Other answer");
    options.append(otherInput);
    otherInput.addEventListener("input", () => {
      const value = otherInput.value.trim();
      if (question.type === "single") {
        answers[question.id] = value ? `Other: ${value}` : "Other";
      } else {
        const values = Array.isArray(answers[question.id]) ? [...answers[question.id]] : [];
        const filtered = values.filter((item) => item !== "Other" && !item.startsWith("Other: "));
        filtered.push(value ? `Other: ${value}` : "Other");
        answers[question.id] = filtered;
      }
    });
  }
  const controls = document.createElement("div");
  controls.className = "interview-controls";
  const back = document.createElement("button");
  back.type = "button";
  back.className = "secondary-button";
  back.textContent = "Back";
  back.disabled = questionIndex === 0;
  back.addEventListener("click", () => { questionIndex -= 1; renderQuestion(); });
  const skip = document.createElement("button");
  skip.type = "button";
  skip.className = "secondary-button";
  skip.textContent = "Skip";
  skip.addEventListener("click", () => commitAnswer(question, null));
  const next = document.createElement("button");
  next.type = "button";
  next.textContent = question.type === "single" && !showOther ? "" : "Continue";
  next.hidden = question.type === "single" && !showOther;
  next.addEventListener("click", () => {
    if (otherInput && otherInput.value.trim()) {
      const otherLabel = labels.includes("Other") ? "Other" : null;
      if (otherLabel && question.type === "multi") {
        const values = Array.isArray(answers[question.id]) ? [...answers[question.id]] : [];
        const filtered = values.filter((value) => value !== "Other" && !value.startsWith("Other: "));
        filtered.push(`Other: ${otherInput.value.trim()}`);
        commitAnswer(question, filtered);
      } else commitAnswer(question, `Other: ${otherInput.value.trim()}`);
    } else if (question.type === "single" && showOther) {
      return;
    } else {
      commitAnswer(question, answers[question.id] ?? null);
    }
  });
  if (question.type === "multi" || showOther) controls.append(next);
  controls.prepend(back);
  controls.append(skip);
  const recommend = document.createElement("button");
  recommend.type = "button";
  recommend.className = "recommend-now";
  recommend.textContent = "Recommend now";
  recommend.addEventListener("click", finishInterview);
  interviewArea.append(progress, bubble, options, controls, recommend);
}

function chooseOption(question, option) {
  if (question.type === "single") {
    if (option === "Other" && question.allow_other) {
      answers[question.id] = "Other";
      renderQuestion();
    } else commitAnswer(question, option);
    return;
  }
  let selected = Array.isArray(answers[question.id]) ? [...answers[question.id]] : [];
  const selectedOther = selected.find((value) => value.startsWith("Other: "));
  const active = selected.includes(option) || (option === "Other" && !!selectedOther);
  if (active) selected = selected.filter((value) => value !== option && !(option === "Other" && value.startsWith("Other: ")));
  else {
    const max = question.max_select;
    if (max && selected.length >= max) return;
    selected.push(option);
  }
  answers[question.id] = selected;
  renderQuestion();
}

function answerLabel(value) {
  return Array.isArray(value) ? value.join(", ") : value || "Skipped";
}

function commitAnswer(question, value) {
  conversation.querySelectorAll(`[data-question-id="${CSS.escape(question.id)}"]`).forEach((item) => item.remove());
  if (value === null) delete answers[question.id];
  else answers[question.id] = value;
  if (question.id === "direction" && !((Array.isArray(value) ? value : []).includes("Not sure yet"))) {
    delete answers.activities;
    conversation.querySelector('[data-question-id="activities"]')?.remove();
  }
  addMessage("assistant", question.text, "interview-question-log", [], question.id);
  addMessage("user", answerLabel(value), "", [], question.id);
  const visible = visibleQuestions();
  const currentIndex = visible.findIndex((item) => item.id === question.id);
  if (currentIndex >= 0) questionIndex = currentIndex + 1;
  if (questionIndex >= visible.length) {
    interviewArea.hidden = true;
    finishInterview();
  } else renderQuestion();
}

async function finishInterview() {
  if (busy || recommendationReady) return;
  const activeQuestion = currentQuestion().question;
  if (activeQuestion && answers[activeQuestion.id] !== undefined && !conversation.querySelector(`[data-question-id="${CSS.escape(activeQuestion.id)}"]`)) {
    addMessage("assistant", activeQuestion.text, "interview-question-log", [], activeQuestion.id);
    addMessage("user", answerLabel(answers[activeQuestion.id]), "", [], activeQuestion.id);
  }
  busy = true;
  startOverButton.disabled = true;
  interviewArea.hidden = true;
  const pending = addMessage("assistant", "Thinking...", "pending");
  try {
    const response = await fetch("/api/recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile: answers }),
    });
    const result = await response.json();
    pending.remove();
    if (!response.ok) throw new Error(result.error || "The recommendation could not be created.");
    recommendationReady = true;
    addMessage("assistant", result.message.content, "recommendation", result.sources || []);
    history.push({ role: "assistant", content: result.message.content });
    form.hidden = false;
  } catch (error) {
    pending.remove();
    addMessage("error", error.message || "Could not create the recommendation.", "error-message");
    interviewArea.hidden = false;
    renderQuestion();
  } finally {
    busy = false;
    startOverButton.disabled = false;
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text || busy || !recommendationReady) return;
  busy = true;
  startOverButton.disabled = true;
  addMessage("user", text);
  history.push({ role: "user", content: text });
  input.value = "";
  input.style.height = "auto";
  sendButton.disabled = true;
  const pending = addMessage("assistant", "Thinking...", "pending");
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history, profile: answers }),
    });
    const result = await response.json();
    pending.remove();
    if (!response.ok) throw new Error(result.error || "The request failed.");
    history.push(result.message);
    addMessage("assistant", result.message.content);
  } catch (error) {
    pending.remove();
    addMessage("error", error.message || "Could not contact the chat server.", "error-message");
  } finally {
    sendButton.disabled = false;
    busy = false;
    startOverButton.disabled = false;
    input.focus();
  }
});

startOverButton.addEventListener("click", () => {
  if (busy) return;
  history.length = 0;
  answers = {};
  questionIndex = 0;
  recommendationReady = false;
  conversation.replaceChildren();
  interviewArea.replaceChildren();
  interviewArea.hidden = false;
  form.hidden = true;
  addMessage("assistant", "Hello! I’ll ask a few quick questions to tailor skill recommendations to you.");
  renderQuestion();
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

async function start() {
  sendButton.disabled = true;
  startOverButton.disabled = true;
  const pending = addMessage("assistant", "Thinking...", "pending");
  try {
    const response = await fetch("/api/questions");
    const result = await response.json();
    if (!response.ok || !Array.isArray(result)) throw new Error(result.error || "Could not load interview questions.");
    questions = result;
    pending.remove();
    addMessage("assistant", "Hello! I’ll ask a few quick questions to tailor skill recommendations to you.");
    renderQuestion();
  } catch (error) {
    pending.remove();
    addMessage("error", error.message, "error-message");
  } finally {
    sendButton.disabled = false;
    startOverButton.disabled = false;
  }
}

start();
