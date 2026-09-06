/**
 * BhashaBot Embeddable Web Chat Widget
 * Fully themed (Daylight / Nightfall), responsive, zero external dependencies, 0 emojis.
 */

(function () {
  if (window.__BHASHABOT_WIDGET_LOADED__) return;
  window.__BHASHABOT_WIDGET_LOADED__ = true;

  // Configuration extraction
  const currentScript =
    document.currentScript ||
    Array.from(document.querySelectorAll("script")).find(
      (s) => s.src && s.src.includes("widget.js")
    );
  const apiUrl = (currentScript && currentScript.getAttribute("data-api")) || window.location.origin;
  const widgetTitle = (currentScript && currentScript.getAttribute("data-title")) || "BhashaBot";
  const greetingText =
    (currentScript && currentScript.getAttribute("data-greeting")) ||
    "Hello! How can I assist you today? I can answer in English, বাংলা, or Banglish.";
  const primaryColor = (currentScript && currentScript.getAttribute("data-primary-color")) || "#E27D60";

  // Persistent anonymous visitor ID
  let visitorId = localStorage.getItem("bhashabot_visitor_id");
  if (!visitorId) {
    visitorId = "web-" + Math.random().toString(36).substring(2, 11);
    localStorage.setItem("bhashabot_visitor_id", visitorId);
  }

  // Persistent theme preference
  let currentTheme = localStorage.getItem("bhashabot_widget_theme") || "dark";

  // Inject Styles
  const style = document.createElement("style");
  style.id = "bhashabot-widget-styles";
  style.textContent = `
    #bhashabot-widget-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 999999;
      font-family: "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      --bb-primary: ${primaryColor};
    }

    /* Launcher Floating Button */
    #bhashabot-launcher {
      width: 58px;
      height: 58px;
      border-radius: 29px;
      background: var(--bb-primary);
      box-shadow: 0 8px 28px rgba(0, 0, 0, 0.32), 0 0 0 1px rgba(255, 255, 255, 0.12);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s;
    }
    #bhashabot-launcher:hover {
      transform: scale(1.08);
      box-shadow: 0 10px 32px rgba(0, 0, 0, 0.42);
    }
    #bhashabot-launcher svg {
      width: 26px;
      height: 26px;
    }

    /* Chat Window */
    #bhashabot-window {
      position: absolute;
      bottom: 74px;
      right: 0;
      width: 390px;
      max-width: calc(100vw - 32px);
      height: 560px;
      max-height: calc(100vh - 110px);
      border-radius: 22px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      opacity: 0;
      pointer-events: none;
      transform: translateY(16px) scale(0.96);
      transition: opacity 0.28s cubic-bezier(0.16, 1, 0.3, 1), transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
    }
    #bhashabot-window.open {
      opacity: 1;
      pointer-events: auto;
      transform: translateY(0) scale(1);
    }

    /* ---- Dark Theme (Nightfall) ---- */
    #bhashabot-window.bb-theme-dark {
      background: #110F0E;
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: 0 20px 56px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.08);
      --bb-text: #F6F3ED;
      --bb-subtext: #9A958D;
      --bb-header-bg: #181615;
      --bb-body-bg: #0D0C0B;
      --bb-bot-bubble: #1E1C1A;
      --bb-bot-border: rgba(255, 255, 255, 0.06);
      --bb-input-bg: #181615;
      --bb-input-border: rgba(255, 255, 255, 0.08);
      --bb-chip-bg: #1E1C1A;
      --bb-chip-border: rgba(255, 255, 255, 0.08);
      --bb-btn-hover: rgba(255, 255, 255, 0.08);
    }

    /* ---- Light Theme (Daylight) ---- */
    #bhashabot-window.bb-theme-light {
      background: #FDFBF7;
      border: 1px solid rgba(0, 0, 0, 0.08);
      box-shadow: 0 20px 56px rgba(45, 35, 25, 0.16), 0 0 0 1px rgba(0, 0, 0, 0.06);
      --bb-text: #1A1815;
      --bb-subtext: #6E675C;
      --bb-header-bg: #FFFFFF;
      --bb-body-bg: #F6F3ED;
      --bb-bot-bubble: #FFFFFF;
      --bb-bot-border: rgba(0, 0, 0, 0.08);
      --bb-input-bg: #FFFFFF;
      --bb-input-border: rgba(0, 0, 0, 0.1);
      --bb-chip-bg: #FFFFFF;
      --bb-chip-border: rgba(0, 0, 0, 0.08);
      --bb-btn-hover: rgba(0, 0, 0, 0.05);
    }

    /* Header */
    #bhashabot-header {
      padding: 14px 18px;
      background: var(--bb-header-bg);
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--bb-bot-border);
      transition: background 0.2s;
    }
    .bb-header-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .bb-avatar-box {
      width: 36px;
      height: 36px;
      border-radius: 12px;
      background: var(--bb-primary);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }
    .bb-avatar-box svg {
      width: 18px;
      height: 18px;
    }
    .bb-header-text h4 {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: var(--bb-text);
      letter-spacing: -0.01em;
    }
    .bb-status-row {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      color: var(--bb-subtext);
      margin-top: 1px;
    }
    .bb-live-dot {
      width: 6px;
      height: 6px;
      background: #22c55e;
      border-radius: 50%;
      box-shadow: 0 0 6px rgba(34, 197, 94, 0.6);
    }

    .bb-header-actions {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .bb-icon-btn {
      width: 30px;
      height: 30px;
      border-radius: 8px;
      background: transparent;
      border: none;
      color: var(--bb-subtext);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }
    .bb-icon-btn:hover {
      background: var(--bb-btn-hover);
      color: var(--bb-text);
    }
    .bb-icon-btn svg {
      width: 16px;
      height: 16px;
    }

    /* Message Stream */
    #bhashabot-messages {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: var(--bb-body-bg);
      transition: background 0.2s;
    }
    .bb-msg-group {
      display: flex;
      flex-direction: column;
      max-width: 84%;
    }
    .bb-msg-group.user {
      align-self: flex-end;
      align-items: flex-end;
    }
    .bb-msg-group.bot {
      align-self: flex-start;
      align-items: flex-start;
    }

    .bb-msg {
      padding: 10px 14px;
      border-radius: 16px;
      font-size: 13px;
      line-height: 1.5;
      word-break: break-word;
    }
    .bb-msg-group.user .bb-msg {
      background: var(--bb-primary);
      color: #ffffff;
      border-bottom-right-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.12);
    }
    .bb-msg-group.bot .bb-msg {
      background: var(--bb-bot-bubble);
      color: var(--bb-text);
      border: 1px solid var(--bb-bot-border);
      border-bottom-left-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    }
    .bb-msg-time {
      font-size: 10px;
      color: var(--bb-subtext);
      margin-top: 3px;
      padding: 0 4px;
      font-family: "JetBrains Mono", monospace;
    }

    /* Starter suggestion chips */
    #bb-chips-container {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 8px;
    }
    .bb-chip {
      background: var(--bb-chip-bg);
      border: 1px solid var(--bb-chip-border);
      color: var(--bb-text);
      padding: 5px 10px;
      border-radius: 9999px;
      font-size: 11px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .bb-chip:hover {
      border-color: var(--bb-primary);
      color: var(--bb-primary);
    }

    /* Typing wave */
    .bb-typing {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 10px 14px;
      background: var(--bb-bot-bubble);
      border: 1px solid var(--bb-bot-border);
      border-radius: 16px;
      align-self: flex-start;
    }
    .bb-typing span {
      width: 5px;
      height: 5px;
      background: var(--bb-subtext);
      border-radius: 50%;
      animation: bbBounce 1.2s infinite ease-in-out;
    }
    .bb-typing span:nth-child(2) { animation-delay: 0.2s; }
    .bb-typing span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes bbBounce {
      0%, 80%, 100% { transform: translateY(0); }
      40% { transform: translateY(-4px); }
    }

    /* Input Bar */
    #bhashabot-input-area {
      padding: 12px 14px;
      background: var(--bb-header-bg);
      border-top: 1px solid var(--bb-bot-border);
      display: flex;
      align-items: center;
      gap: 8px;
      transition: background 0.2s;
    }
    #bhashabot-input {
      flex: 1;
      background: var(--bb-input-bg);
      border: 1px solid var(--bb-input-border);
      border-radius: 12px;
      padding: 10px 14px;
      color: var(--bb-text);
      font-size: 13px;
      outline: none;
      transition: border-color 0.2s;
    }
    #bhashabot-input:focus {
      border-color: var(--bb-primary);
    }
    #bhashabot-send {
      background: var(--bb-primary);
      border: none;
      border-radius: 12px;
      width: 38px;
      height: 38px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      transition: opacity 0.2s, transform 0.15s;
    }
    #bhashabot-send:hover {
      opacity: 0.92;
      transform: scale(1.04);
    }
    #bhashabot-send:active {
      transform: scale(0.96);
    }
    #bhashabot-send svg {
      width: 16px;
      height: 16px;
    }
  `;
  document.head.appendChild(style);

  // SVG icon templates (0 emojis)
  const ICONS = {
    chat: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>`,
    sun: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`,
    moon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
    close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    send: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`,
  };

  // Build Container
  const container = document.createElement("div");
  container.id = "bhashabot-widget-container";
  container.innerHTML = `
    <div id="bhashabot-window" class="bb-theme-${currentTheme}">
      <!-- Header -->
      <div id="bhashabot-header">
        <div class="bb-header-left">
          <div class="bb-avatar-box">${ICONS.chat}</div>
          <div class="bb-header-text">
            <h4>${widgetTitle}</h4>
            <div class="bb-status-row">
              <span class="bb-live-dot"></span>
              <span>Multilingual Desk · Online</span>
            </div>
          </div>
        </div>

        <div class="bb-header-actions">
          <button id="bb-theme-toggle" class="bb-icon-btn" title="Toggle Daylight / Nightfall mode">
            ${currentTheme === "dark" ? ICONS.sun : ICONS.moon}
          </button>
          <button id="bhashabot-close" class="bb-icon-btn" title="Close chat">
            ${ICONS.close}
          </button>
        </div>
      </div>

      <!-- Messages Stream -->
      <div id="bhashabot-messages">
        <div class="bb-msg-group bot">
          <div class="bb-msg">${greetingText}</div>
          <span class="bb-msg-time">Just now</span>
        </div>

        <!-- Quick starter chips -->
        <div id="bb-chips-container">
          <button class="bb-chip" data-query="কেমন আছেন?">কেমন আছেন?</button>
          <button class="bb-chip" data-query="How does BhashaBot work?">How does it work?</button>
          <button class="bb-chip" data-query="Apnader pricing koto?">Pricing koto?</button>
        </div>
      </div>

      <!-- Input Form -->
      <form id="bhashabot-input-area">
        <input id="bhashabot-input" type="text" placeholder="Type in Bangla, English or Banglish..." autocomplete="off" />
        <button id="bhashabot-send" type="submit" title="Send message">
          ${ICONS.send}
        </button>
      </form>
    </div>

    <!-- Floating Launcher -->
    <button id="bhashabot-launcher" title="Open chat desk">
      ${ICONS.chat}
    </button>
  `;
  document.body.appendChild(container);

  // Elements
  const launcher = document.getElementById("bhashabot-launcher");
  const win = document.getElementById("bhashabot-window");
  const closeBtn = document.getElementById("bhashabot-close");
  const themeToggle = document.getElementById("bb-theme-toggle");
  const form = document.getElementById("bhashabot-input-area");
  const input = document.getElementById("bhashabot-input");
  const msgContainer = document.getElementById("bhashabot-messages");
  const chipsContainer = document.getElementById("bb-chips-container");

  // Toggle Chat Window
  function toggleChat() {
    win.classList.toggle("open");
    if (win.classList.contains("open")) {
      setTimeout(() => input.focus(), 120);
    }
  }

  launcher.addEventListener("click", toggleChat);
  closeBtn.addEventListener("click", () => win.classList.remove("open"));

  // Toggle Theme
  function setTheme(theme) {
    currentTheme = theme;
    localStorage.setItem("bhashabot_widget_theme", theme);
    win.className = `bb-theme-${theme} ${win.classList.contains("open") ? "open" : ""}`;
    themeToggle.innerHTML = theme === "dark" ? ICONS.sun : ICONS.moon;
  }

  themeToggle.addEventListener("click", () => {
    setTheme(currentTheme === "dark" ? "light" : "dark");
  });

  // Global theme switcher for parent page integration
  window.__BHASHABOT_SET_THEME__ = setTheme;

  // Format Time
  function getTimestamp() {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  // Format markdown bold & linebreaks
  function formatReply(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n/g, "<br />");
  }

  // Append Message
  function appendMessage(text, isUser = false) {
    const group = document.createElement("div");
    group.className = `bb-msg-group ${isUser ? "user" : "bot"}`;

    const bubble = document.createElement("div");
    bubble.className = "bb-msg";
    bubble.innerHTML = isUser ? text.replace(/</g, "&lt;").replace(/>/g, "&gt;") : formatReply(text);

    const time = document.createElement("span");
    time.className = "bb-msg-time";
    time.textContent = getTimestamp();

    group.appendChild(bubble);
    group.appendChild(time);
    msgContainer.appendChild(group);
    msgContainer.scrollTop = msgContainer.scrollHeight;
  }

  function showTyping() {
    const typing = document.createElement("div");
    typing.className = "bb-typing";
    typing.id = "bb-typing-wave";
    typing.innerHTML = `<span></span><span></span><span></span>`;
    msgContainer.appendChild(typing);
    msgContainer.scrollTop = msgContainer.scrollHeight;
  }

  function removeTyping() {
    const el = document.getElementById("bb-typing-wave");
    if (el) el.remove();
  }

  async function sendMessage(text) {
    const clean = text.trim();
    if (!clean) return;

    if (chipsContainer) {
      chipsContainer.remove();
    }

    appendMessage(clean, true);
    input.value = "";
    showTyping();

    try {
      const res = await fetch(`${apiUrl}/api/channels/web`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: clean,
          senderId: visitorId,
          senderName: "Web Visitor",
          platform: "web",
        }),
        signal: AbortSignal.timeout(15000),
      });

      const data = await res.json();
      removeTyping();

      if (data.ok && data.results && data.results.length > 0) {
        const reply = data.results[0].reply;
        if (reply) {
          appendMessage(reply, false);
          return;
        }
      }
      appendMessage("Thank you for reaching out! We received your message and will get back to you shortly.", false);
    } catch {
      removeTyping();
      appendMessage("Could not connect to the reply server. Please ensure the local server is running.", false);
    }
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    sendMessage(input.value);
  });

  // Suggestion chips handler
  if (chipsContainer) {
    chipsContainer.addEventListener("click", (e) => {
      const btn = e.target.closest(".bb-chip");
      if (btn && btn.dataset.query) {
        sendMessage(btn.dataset.query);
      }
    });
  }
})();
