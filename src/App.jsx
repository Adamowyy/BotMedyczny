import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import "./styles/styles.css";

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
  return (
    <div className="header">
      <div className="header-left">
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
    </div>
  );
}

function buildTableFromItems(items) {
  if (!items || items.length < 10) return null;

  const data = items.map((it) => ({
    str: it.str,
    x: it.transform[4],
    y: it.transform[5],
    fs: Math.abs(it.transform[3]),
    w: it.width || 0,
  }));

  const avgFont = data.reduce((s, d) => s + d.fs, 0) / data.length;

  const allX = [...new Set(data.map((d) => d.x))].sort((a, b) => a - b);
  if (allX.length < 4) return null;

  const gaps = [];
  for (let i = 1; i < allX.length; i++) gaps.push(allX[i] - allX[i - 1]);
  const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  const stdGap = Math.sqrt(
    gaps.reduce((s, g) => s + (g - avgGap) ** 2, 0) / gaps.length,
  );
  const threshold = Math.max(avgGap + 1.2 * stdGap, 18);

  let colEdges = [allX[0]];
  for (let i = 1; i < allX.length; i++) {
    if (allX[i] - allX[i - 1] > threshold) colEdges.push(allX[i]);
  }
  if (colEdges.length < 3) return null;

  const columns = colEdges.map((left, i) => ({
    left,
    right: i < colEdges.length - 1 ? colEdges[i + 1] : Infinity,
  }));
  if (columns.length < 2) return null;

  const sorted = [...data].sort((a, b) => a.y - b.y || a.x - b.x);
  const rows = [];
  for (const d of sorted) {
    const tol = d.fs * 0.5;
    let placed = false;
    for (const row of rows) {
      if (Math.abs(d.y - row.y) < Math.max(tol, row.maxTol)) {
        row.items.push(d);
        row.y = (row.y * (row.items.length - 1) + d.y) / row.items.length;
        row.maxTol = Math.max(row.maxTol, tol);
        placed = true;
        break;
      }
    }
    if (!placed) rows.push({ y: d.y, items: [d], maxTol: tol });
  }

  const mapped = rows.map((row) => {
    const cells = columns.map(() => "");
    for (const d of row.items) {
      const cx = d.x + d.w / 2;
      for (let ci = 0; ci < columns.length; ci++) {
        if (
          cx >= columns[ci].left &&
          (ci === columns.length - 1 || cx < columns[ci].right)
        ) {
          cells[ci] = cells[ci] ? cells[ci] + " " + d.str : d.str;
          break;
        }
      }
    }
    return { y: row.y, cells };
  });

  const multiCellRows = mapped.filter(
    (r) => r.cells.filter((c) => c !== "").length >= 2,
  ).length;
  if (multiCellRows < Math.max(mapped.length * 0.4, 3)) return null;

  const merged = [];
  for (const row of mapped) {
    const filled = row.cells.filter((c) => c !== "").length;
    if (filled === 0) continue;

    if (merged.length > 0) {
      const prev = merged[merged.length - 1];
      const prevFilled = prev.cells.filter((c) => c !== "").length;
      if (
        row.y - prev.y < 2 * avgFont &&
        filled < prevFilled &&
        row.cells.every((c, i) => c === "" || prev.cells[i] !== "")
      ) {
        for (let i = 0; i < row.cells.length; i++) {
          if (row.cells[i] !== "") {
            prev.cells[i] = prev.cells[i]
              ? prev.cells[i] + " " + row.cells[i]
              : row.cells[i];
          }
        }
        continue;
      }
    }
    merged.push(row);
  }

  const dataRows = merged.filter((r) => r.cells.filter((c) => c !== "").length >= 2);
  if (dataRows.length < 2) return null;

  const hdr = dataRows[0];
  const body = dataRows.slice(1);
  let md = "| " + hdr.cells.map((c) => c || " ").join(" | ") + " |\n";
  md += "|" + hdr.cells.map(() => "---").join("|") + "|\n";
  for (const row of body) {
    md += "| " + row.cells.map((c) => c || " ").join(" | ") + " |\n";
  }
  return md;
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
  const fileInputRef = useRef(null);

  const [attachedFile, setAttachedFile] = useState(null);
  const [fileParsing, setFileParsing] = useState(false);

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

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileParsing(true);
    try {
      let content;

      if (file.type === "text/plain" || file.name.endsWith(".txt")) {
        content = await file.text();
      } else if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url
        ).toString();

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({
          data: arrayBuffer,
          useSystemFonts: true,
          disableFontFace: true,
        }).promise;

        const texts = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const items = textContent.items;
          const table = buildTableFromItems(items);
          if (table) {
            texts.push(table);
          } else {
            const sorted = [...items].sort(
              (a, b) => a.transform[5] - b.transform[5] || a.transform[4] - b.transform[4],
            );
            texts.push(sorted.map((it) => it.str).join(" "));
          }
        }
        content = texts.join("\n");
      } else if (
        file.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        file.name.endsWith(".docx")
      ) {
        const mammoth = await import("mammoth");
        const TurndownService = (await import("turndown")).default;
        const arrayBuffer = await file.arrayBuffer();
        const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
        const turndownService = new TurndownService();
        content = turndownService.turndown(htmlResult.value);
      } else {
        throw new Error(
          "Nieobsługiwany format pliku. Dozwolone formaty: PDF, TXT, DOCX."
        );
      }

      if (!content.trim()) {
        throw new Error(
          "Nie udało się wyodrębnić tekstu z pliku. Plik może być skanem lub obrazem bez warstwy tekstowej."
        );
      }

      const MAX_CHARS = 50000;
      if (content.length > MAX_CHARS) {
        content =
          content.slice(0, MAX_CHARS) +
          "\n\n[Tekst został przycięty – plik jest zbyt długi. Zadawaj pytania o konkretne fragmenty.]";
      }

      setAttachedFile({ name: file.name, content, type: file.type });
    } catch (err) {
      alert(err.message);
      setAttachedFile(null);
    } finally {
      setFileParsing(false);
      e.target.value = "";
    }
  };

  const removeFile = () => setAttachedFile(null);

  const send = useCallback(async () => {
    const text = input.trim();
    if ((!text && !attachedFile) || loading || !apiKey) return;

    const file = attachedFile;
    const userContent = file
      ? `**\u{1F4C4} Plik: \`${file.name}\`**\n\n${file.content}\n\n---\n\n${text || "Przeanalizuj powyższy plik."}`
      : text;

    const userMsg = {
      role: "user",
      content: userContent,
      ...(file
        ? { file: { name: file.name, type: file.type }, question: text || "Przeanalizuj powyższy plik." }
        : {}),
    };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setAttachedFile(null);
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
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.docx"
            onChange={handleFileSelect}
            style={{ display: "none" }}
          />
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
                  ) : m.file ? (
                    <>
                      <div className="file-ref">📄 <code>{m.file.name}</code></div>
                      <div style={{ marginTop: 4 }}>{m.question}</div>
                    </>
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
          {attachedFile && (
            <div className="file-chip-bar">
              <div className="file-chip">
                <span className="file-chip-name">
                  📄 {attachedFile.name}
                </span>
                <button
                  className="file-chip-remove"
                  onClick={removeFile}
                  title="Usuń plik"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
          <div className="input-area">
            <button
              className="attach-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading || fileParsing}
              title="Załącz plik (PDF, TXT, DOCX)"
            >
              {fileParsing ? "⏳" : "📎"}
            </button>
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
              disabled={!loading && !input.trim() && !attachedFile}
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
