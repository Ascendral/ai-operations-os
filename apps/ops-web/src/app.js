/**
 * SPARK — Chat Application
 *
 * Chat-first. No dashboard. No admin template.
 * Just a clean chat interface with conversation history.
 */

(function () {
  "use strict";

  var API_BASE = window.OPS_API_BASE || "http://localhost:3100";

  // Auth state
  var authToken = localStorage.getItem("ops_auth_token") || "";

  // Chat state
  var conversationId = null;
  var conversations = [];

  // ═══════════════════════════════════════════════════════════════════
  // API Client
  // ═══════════════════════════════════════════════════════════════════

  function authHeaders() {
    var h = { "Content-Type": "application/json" };
    if (authToken) h["Authorization"] = "Bearer " + authToken;
    return h;
  }

  function apiGet(path) {
    return fetch(API_BASE + path, { headers: authHeaders() })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .catch(function (err) {
        console.error("GET " + path, err);
        return null;
      });
  }

  function apiPost(path, body) {
    return fetch(API_BASE + path, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body || {}),
    })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .catch(function (err) {
        console.error("POST " + path, err);
        return null;
      });
  }

  // ═══════════════════════════════════════════════════════════════════
  // Helpers
  // ═══════════════════════════════════════════════════════════════════

  function esc(str) {
    var el = document.createElement("div");
    el.textContent = str || "";
    return el.innerHTML;
  }

  function formatText(text) {
    return text
      .split("\n\n")
      .map(function (p) {
        p = esc(p);
        p = p.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
        p = p.replace(/`(.*?)`/g, "<code>$1</code>");
        return "<p>" + p + "</p>";
      })
      .join("");
  }

  // ═══════════════════════════════════════════════════════════════════
  // Theme
  // ═══════════════════════════════════════════════════════════════════

  var html = document.documentElement;

  function initTheme() {
    var saved = localStorage.getItem("ops-theme");
    if (saved) html.setAttribute("data-theme", saved);
  }
  initTheme();

  var themeToggle = document.getElementById("theme-toggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      var next = html.getAttribute("data-theme") === "dark" ? "light" : "dark";
      html.setAttribute("data-theme", next);
      localStorage.setItem("ops-theme", next);
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // Sidebar Toggle
  // ═══════════════════════════════════════════════════════════════════

  var sidebar = document.getElementById("sidebar");
  var collapseBtn = document.getElementById("sidebar-collapse-btn");
  var openBtn = document.getElementById("sidebar-open-btn");

  if (collapseBtn) {
    collapseBtn.addEventListener("click", function () {
      sidebar.classList.add("collapsed");
    });
  }

  if (openBtn) {
    openBtn.addEventListener("click", function () {
      if (window.innerWidth <= 768) {
        sidebar.classList.toggle("mobile-open");
      } else {
        sidebar.classList.remove("collapsed");
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // Auth / Login
  // ═══════════════════════════════════════════════════════════════════

  var loginOverlay = document.getElementById("login-overlay");
  var loginForm = document.getElementById("login-form");
  var loginError = document.getElementById("login-error");
  var loginBtn = document.getElementById("login-btn");
  var registerToggle = document.getElementById("register-toggle");
  var devBtn = document.getElementById("dev-continue-btn");
  var isRegister = false;

  if (registerToggle) {
    registerToggle.addEventListener("click", function () {
      isRegister = !isRegister;
      loginBtn.textContent = isRegister ? "Register" : "Sign In";
      registerToggle.textContent = isRegister ? "Sign In" : "Register";
      loginError.textContent = "";
    });
  }

  if (devBtn) {
    devBtn.addEventListener("click", function () {
      function setToken(data) {
        if (data && data.token) {
          authToken = data.token;
          localStorage.setItem("ops_auth_token", authToken);
        }
      }

      function enter() {
        loginOverlay.classList.add("hidden");
        loadConversations();
      }

      // Try register first, then login if that fails
      fetch(API_BASE + "/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "dev@spark.local",
          password: "dev123",
          name: "Dev",
        }),
      })
        .then(function (r) {
          return r.json();
        })
        .then(function (data) {
          setToken(data);
          if (authToken) {
            enter();
            return;
          }
          // Registration didn't give token, try login
          return fetch(API_BASE + "/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: "dev@spark.local",
              password: "dev123",
            }),
          })
            .then(function (r) {
              return r.json();
            })
            .then(function (data) {
              setToken(data);
              enter();
            });
        })
        .catch(function () {
          enter();
        });
    });
  }

  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      loginError.textContent = "";
      loginBtn.disabled = true;

      var endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";
      var email = document.getElementById("login-email").value.trim();
      var password = document.getElementById("login-password").value;
      var payload = { email: email, password: password };
      if (isRegister) payload.name = email.split("@")[0];

      fetch(API_BASE + endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then(function (r) {
          return r.json();
        })
        .then(function (data) {
          loginBtn.disabled = false;
          if (data.error) {
            loginError.textContent = data.error;
            return;
          }
          if (data.token) {
            authToken = data.token;
            localStorage.setItem("ops_auth_token", authToken);
            loginOverlay.classList.add("hidden");
            loadConversations();
          }
        })
        .catch(function () {
          loginBtn.disabled = false;
          loginError.textContent = "Connection error";
        });
    });
  }

  // Auto-login if token exists
  if (authToken) {
    loginOverlay.classList.add("hidden");
    loadConversations();
  }

  // ═══════════════════════════════════════════════════════════════════
  // Chat DOM Refs
  // ═══════════════════════════════════════════════════════════════════

  var messagesEl = document.getElementById("messages");
  var welcomeEl = document.getElementById("welcome");
  var suggestionsEl = document.getElementById("suggestions");
  var inputEl = document.getElementById("chat-input");
  var sendBtn = document.getElementById("send-btn");
  var convListEl = document.getElementById("conversation-list");

  // SPARK avatar SVG (reusable)
  var SPARK_AVATAR_SVG =
    '<svg viewBox="0 0 32 32" fill="none" stroke="white" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;">' +
    '<path d="M16 4 A12 12 0 1 1 4 16 A6 6 0 0 1 16 16" stroke-width="2.5"/>' +
    '<circle cx="16" cy="16" r="1.5" fill="white" stroke="none"/></svg>';

  // ═══════════════════════════════════════════════════════════════════
  // Input Handling
  // ═══════════════════════════════════════════════════════════════════

  if (inputEl) {
    inputEl.addEventListener("input", function () {
      sendBtn.disabled = !inputEl.value.trim();
      inputEl.style.height = "auto";
      inputEl.style.height = Math.min(inputEl.scrollHeight, 200) + "px";
    });

    inputEl.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (inputEl.value.trim()) sendMessage();
      }
    });
  }

  if (sendBtn) {
    sendBtn.addEventListener("click", function () {
      if (inputEl.value.trim()) sendMessage();
    });
  }

  // Suggestion chips
  if (suggestionsEl) {
    suggestionsEl.addEventListener("click", function (e) {
      var btn = e.target.closest(".suggestion");
      if (btn) {
        inputEl.value = btn.dataset.text;
        sendBtn.disabled = false;
        sendMessage();
      }
    });
  }

  // New chat
  var newChatBtn = document.getElementById("new-chat-btn");
  if (newChatBtn) {
    newChatBtn.addEventListener("click", function () {
      conversationId = null;
      clearMessages();
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // Send Message
  // ═══════════════════════════════════════════════════════════════════

  function sendMessage() {
    var text = inputEl.value.trim();
    if (!text) return;

    inputEl.value = "";
    inputEl.style.height = "auto";
    sendBtn.disabled = true;

    // Hide welcome
    if (welcomeEl) welcomeEl.style.display = "none";

    // User message
    appendMessage("user", text);

    // Typing indicator
    var typingEl = appendTyping();

    // API call
    apiPost("/api/spark/chat", {
      message: text,
      conversationId: conversationId,
    }).then(function (data) {
      removeTyping(typingEl);
      if (data && data.response) {
        appendMessage("spark", data.response, data);
        if (data.conversationId) conversationId = data.conversationId;
        loadConversations();
      } else {
        appendMessage("spark", "Something went wrong. Please try again.");
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // Render Messages
  // ═══════════════════════════════════════════════════════════════════

  function appendMessage(role, text, meta) {
    var div = document.createElement("div");
    div.className = "message";

    var avatar =
      role === "user"
        ? '<div class="message-avatar user">Y</div>'
        : '<div class="message-avatar spark">' + SPARK_AVATAR_SVG + "</div>";

    var roleName = role === "user" ? "You" : "SPARK";

    var metaHtml = "";
    if (meta && meta.queryIntent) {
      metaHtml =
        '<div class="message-meta">' +
        '<span class="meta-tag">' +
        esc(meta.queryIntent) +
        "</span>" +
        "</div>";
    }

    div.innerHTML =
      '<div class="message-inner">' +
      avatar +
      '<div class="message-content">' +
      '<div class="message-role">' +
      roleName +
      "</div>" +
      '<div class="message-text">' +
      formatText(text) +
      "</div>" +
      metaHtml +
      "</div></div>";

    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return div;
  }

  function appendTyping() {
    var div = document.createElement("div");
    div.className = "message typing";
    div.innerHTML =
      '<div class="message-inner">' +
      '<div class="message-avatar spark">' +
      SPARK_AVATAR_SVG +
      "</div>" +
      '<div class="message-content"><div class="message-role">SPARK</div>' +
      '<div class="typing-dots"><span></span><span></span><span></span></div>' +
      "</div></div>";
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return div;
  }

  function removeTyping(el) {
    if (el && el.parentElement) el.remove();
  }

  function clearMessages() {
    // Preserve welcome element
    var welcome = welcomeEl;
    messagesEl.innerHTML = "";
    if (welcome) {
      messagesEl.appendChild(welcome);
      welcome.style.display = "";
    }

    // Clear active state in sidebar
    var items = convListEl.querySelectorAll(".conv-item");
    items.forEach(function (item) {
      item.classList.remove("active");
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // Conversations Sidebar
  // ═══════════════════════════════════════════════════════════════════

  function loadConversations() {
    apiGet("/api/spark/conversations").then(function (data) {
      if (!data) return;
      conversations = data.conversations || data || [];
      renderConversations();
    });
  }

  function renderConversations() {
    if (!convListEl) return;
    convListEl.innerHTML = "";

    if (!conversations.length) return;

    conversations.forEach(function (conv) {
      var div = document.createElement("div");
      div.className =
        "conv-item" + (conv.id === conversationId ? " active" : "");
      div.textContent = conv.title || conv.preview || "Untitled";
      div.addEventListener("click", function () {
        loadConversation(conv.id);
      });
      convListEl.appendChild(div);
    });
  }

  function loadConversation(id) {
    conversationId = id;

    apiGet("/api/spark/conversations/" + id).then(function (data) {
      if (!data) return;

      // Clear messages area
      messagesEl.innerHTML = "";
      if (welcomeEl) welcomeEl.style.display = "none";

      // Render turns
      var turns = data.turns || data.messages || [];
      turns.forEach(function (turn) {
        if (turn.userMessage) {
          appendMessage("user", turn.userMessage);
        }
        if (turn.response) {
          appendMessage("spark", turn.response, turn);
        }
      });

      renderConversations();
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // Keyboard Shortcuts
  // ═══════════════════════════════════════════════════════════════════

  document.addEventListener("keydown", function (e) {
    var tag = (e.target.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea") return;

    // Focus chat input with /
    if (e.key === "/") {
      e.preventDefault();
      if (inputEl) inputEl.focus();
    }

    // New chat with Ctrl+Shift+N
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "n") {
      e.preventDefault();
      conversationId = null;
      clearMessages();
      if (inputEl) inputEl.focus();
    }
  });

  // ═══════════════════════════════════════════════════════════════════
  // Toast
  // ═══════════════════════════════════════════════════════════════════

  window.showToast = function (message, type) {
    type = type || "success";
    var container = document.getElementById("toast-container");
    if (!container) return;

    var toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML =
      "<span>" +
      esc(message) +
      "</span>" +
      '<button class="toast-close" onclick="this.parentElement.remove()">&times;</button>';
    container.appendChild(toast);

    setTimeout(function () {
      if (toast.parentElement) toast.remove();
    }, 4000);
  };
})();
