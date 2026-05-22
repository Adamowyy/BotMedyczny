import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import "./styles/styles.css";

const api = window.electronAPI || null;

const THINKING_VARIANTS = [
  { type: "dots" },
  { type: "text", text: "Niech pomyślę..." },
  { type: "text", text: "Analizuję pytanie..." },
  { type: "text", text: "Szukam odpowiedzi..." },
  { type: "text", text: "Zaraz odpowiem..." },
  { type: "text", text: "Chwila zastanowienia..." },
];

function TypingDots() {
  const [variant] = useState(
    () => THINKING_VARIANTS[Math.floor(Math.random() * THINKING_VARIANTS.length)],
  );

  if (variant.type === "text") {
    return (
      <div className="msg bot">
        <div className="avatar">🤖</div>
        <div className="bubble">
          <div className="typing-text">
            {variant.text} 🤔
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="msg bot">
      <div className="avatar">🤖</div>
      <div className="bubble">
        <div className="typing">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="empty">
      <div className="icon">🩺</div>
      <h2>Asystent Medyczny</h2>
      <p>
        Zadaj pytanie – anatomia, fizjologia, farmakologia, patologia,
        diagnostyka. Odpowiadam wyłącznie na podstawie wiarygodnych źródeł
        medycznych, bez spekulacji.
      </p>
      <div className="slow-notice">
        Czasem odpisuję wolniej, bo stawiam na dokładność. Zaawansowany model, z
        którego korzystam, działa trochę jak lekarz przy diagnozie – pośpiech
        nie jest tu wskazany.
      </div>
    </div>
  );
}

function ThinkingToggle({ enabled, onToggle, disabled, className }) {
  return (
    <div
      className={`thinking-toggle-container${className ? " " + className : ""}`}
    >
      <label className="thinking-toggle-label">
        <div className="thinking-toggle-switch">
          <input
            type="checkbox"
            checked={enabled}
            onChange={() => onToggle(!enabled)}
            disabled={disabled}
          />
          <span className="thinking-toggle-slider"></span>
        </div>
        <span className="thinking-toggle-text">
          🧠 Głębokie Myślenie
          <span className="thinking-toggle-hint">
            {enabled ? (
              <>
                Model „myśli” przed odpowiedzią (wolniejszy)
                <br />
                ⚠️ Niezalecane do codziennego użytku!
              </>
            ) : (
              "Szybsza odpowiedź bez łańcucha myślowego"
            )}
          </span>
        </span>
      </label>
    </div>
  );
}

function Titlebar({ messages, onNewChat, dark, onToggleTheme }) {
  const isElectron = api?.isElectron;

  return (
    <div className={isElectron ? "titlebar" : "header"}>
      <div className={isElectron ? "titlebar-drag" : "header-left"}>
        <span className="logo">🩺</span>
        <h1>Asystent Medyczny</h1>
        <span className="subtitle"></span>
      </div>
      <div className="titlebar-center">
        {messages.length > 0 && (
          <button
            className="new-chat-btn"
            onClick={onNewChat}
            title="Nowy czat"
          >
            + Nowy czat
          </button>
        )}
        <button
          className="theme-btn"
          onClick={onToggleTheme}
          title="Zmień motyw"
        >
          {dark ? "☀️" : "🌙"}
        </button>
      </div>
      {isElectron && (
        <div className="titlebar-controls">
          <button
            className="win-btn min-btn"
            onClick={() => api.minimize()}
            title="Minimalizuj"
          >
            ─
          </button>
          <button
            className="win-btn max-btn"
            onClick={() => api.maximize()}
            title="Maksymalizuj"
          >
            □
          </button>
          <button
            className="win-btn cls-btn"
            onClick={() => api.close()}
            title="Zamknij"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [apiKey, setApiKeyState] = useState(
    () => localStorage.getItem("deepseek_api_key") || "",
  );
  const [keyInput, setKeyInput] = useState("");
  const [keyError, setKeyError] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [thinkingMode, setThinkingMode] = useState(false);
  const [dark, setDark] = useState(
    () => localStorage.getItem("theme") === "dark",
  );
  const chatRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);
  const stoppedRef = useRef(false);

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      dark ? "dark" : "light",
    );
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  const toggleTheme = () => setDark((d) => !d);

  const toggleThinkingMode = (val) => {
    setThinkingMode(val);
  };

  useEffect(() => {
    chatRef.current?.scrollTo({
      top: chatRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  useEffect(() => {
    if (apiKey) inputRef.current?.focus();
  }, [apiKey]);

  const handleSaveKey = () => {
    const trimmed = keyInput.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith("sk-")) {
      setKeyError('Nieprawidłowy format. Klucz DeepSeek zaczyna się od "sk-".');
      return;
    }
    localStorage.setItem("deepseek_api_key", trimmed);
    setApiKeyState(trimmed);
    setKeyError("");
  };

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading || !apiKey) return;

    const userMsg = { role: "user", content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);
    stoppedRef.current = false;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
        },
        body: JSON.stringify({ messages: updated, thinkingMode }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("deepseek_api_key");
          setApiKeyState("");
          setMessages([]);
          setKeyError(
            "Klucz API jest nieprawidłowy lub wygasł. Wprowadź nowy klucz.",
          );
          return;
        }
        throw new Error(err.error || `Błąd serwera (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data:")) continue;

          const data = trimmed.slice(5).trim();
          if (!data || data === "[DONE]") continue;

          try {
            const json = JSON.parse(data);
            const token = json.choices?.[0]?.delta?.content;
            if (token) {
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last && last.role === "assistant") {
                  const copy = [...prev];
                  copy[copy.length - 1] = { ...last, content: last.content + token };
                  return copy;
                }
                return [...prev, { role: "assistant", content: token }];
              });
            }
          } catch {}
        }
      }
    } catch (err) {
      if (stoppedRef.current) return;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.role === "assistant") {
          const copy = [...prev];
          copy[copy.length - 1] = {
            ...last,
            content: last.content
              ? last.content + `\n\n❌ **Błąd:** ${err.message}`
              : `❌ **Błąd:** ${err.message}`,
          };
          return copy;
        }
        return [...prev, { role: "assistant", content: `❌ **Błąd:** ${err.message}` }];
      });
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, apiKey, thinkingMode]);

  const stop = () => {
    stoppedRef.current = true;
    abortRef.current?.abort();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const newChat = () => {
    stop();
    if (
      messages.length > 0 &&
      !window.confirm(
        "Czy na pewno chcesz rozpocząć nowy czat? Aktualna konwersacja zostanie utracona.",
      )
    )
      return;
    setMessages([]);
  };

  return (
    <div className="app">
      <Titlebar
        messages={messages}
        onNewChat={newChat}
        dark={dark}
        onToggleTheme={toggleTheme}
      />

      {apiKey && messages.length > 0 && (
        <div className="new-chat-mobile-bar">
          <button className="new-chat-mobile-btn" onClick={newChat}>
            + Nowy czat
          </button>
        </div>
      )}

      {!apiKey ? (
        <div className="setup-screen">
          <div className="setup-card">
            <div className="setup-icon">🔑</div>
            <h2>Konfiguracja klucza API</h2>
            <p>
              Wprowadź swój klucz API, aby rozpocząć.
              <br />
              Klucz jest przechowywany lokalnie na Twoim komputerze.
            </p>
            {keyError && <div className="setup-error">{keyError}</div>}
            <input
              className="setup-input"
              type="password"
              value={keyInput}
              onChange={(e) => {
                setKeyInput(e.target.value);
                setKeyError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSaveKey()}
              placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
              autoFocus
            />
            <button
              className="setup-btn"
              onClick={handleSaveKey}
              disabled={!keyInput.trim()}
            >
              Zapisz i uruchom
            </button>
            <span className="setup-hint">
              Jeśli nie masz swojego klucza, zapytaj właściciela bota czyli{" "}
              <a
                href="https://adamowy.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
              >
                Adama W
              </a>
              .
            </span>
          </div>
        </div>
      ) : (
        <>
          <div className="chat" ref={chatRef}>
            {messages.length === 0 && !loading && <EmptyState />}
            {messages.length === 0 && !loading && (
              <ThinkingToggle
                enabled={thinkingMode}
                onToggle={toggleThinkingMode}
                disabled={loading}
              />
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`msg ${m.role === "user" ? "user" : "bot"}`}
              >
                <div className="avatar">{m.role === "user" ? "👤" : "🤖"}</div>
                <div className="bubble">
                  {m.role === "assistant" ? (
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  ) : (
                    <>{m.content}</>
                  )}
                </div>
              </div>
            ))}
            {loading && messages[messages.length - 1]?.role !== "assistant" && <TypingDots />}
          </div>

          {messages.length === 0 && (
            <div className="disclaimer">
              ⚠️ Ten asystent AI nie zastępuje konsultacji z lekarzem.
              Informacje mają charakter edukacyjny.
              <br />
              Asystent w pełni zaprojektowany przez -{" "}
              <a
                href="https://adamowy.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
              >
                Adam Warzecha
              </a>{" "}
              / © 2026 Wszelkie prawa zastrzeżone.
            </div>
          )}
          <div className="input-area">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Zadaj pytanie..."
              rows={1}
              disabled={loading}
            />
            <button
              onClick={loading ? stop : send}
              disabled={!loading && !input.trim()}
              title={loading ? "Zatrzymaj" : "Wyślij"}
            >
              {loading ? "■" : "↑"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
