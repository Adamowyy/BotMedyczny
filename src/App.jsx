import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import {
  LANGUAGES,
  createTranslator,
  readLanguage,
  saveLanguage,
} from "./i18n.mjs";
import "./styles/styles.css";

const THINKING_VARIANTS = [
  { type: "dots" },
  { type: "text", key: "thinking.v1" },
  { type: "text", key: "thinking.v2" },
  { type: "text", key: "thinking.v3" },
  { type: "text", key: "thinking.v4" },
  { type: "text", key: "thinking.v5" },
];

function TypingDots({ t }) {
  const [variant] = useState(
    () => THINKING_VARIANTS[Math.floor(Math.random() * THINKING_VARIANTS.length)],
  );

  if (variant.type === "text") {
    return (
      <div className="msg bot">
        <div className="avatar">🤖</div>
        <div className="bubble">
          <div className="typing-text">
            {t(variant.key)} 🤔
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

function EmptyState({ t }) {
  return (
    <div className="empty">
      <div className="icon">🩺</div>
      <h2>{t("empty.title")}</h2>
      <p>{t("empty.text")}</p>
      <div className="slow-notice">{t("empty.slowNotice")}</div>
    </div>
  );
}

function ThinkingToggle({ enabled, onToggle, disabled, className, t }) {
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
          {t("thinking.label")}
          <span className="thinking-toggle-hint">
            {enabled ? (
              <>
                {t("thinking.onA")}
                <br />
                {t("thinking.onB")}
              </>
            ) : (
              t("thinking.off")
            )}
          </span>
        </span>
      </label>
    </div>
  );
}

function Titlebar({
  messages,
  onNewChat,
  dark,
  onToggleTheme,
  language,
  onLanguage,
  t,
}) {
  return (
    <div className="header">
      <div className="header-left">
        <span className="logo">🩺</span>
        <h1>{t("app.title")}</h1>
        <span className="subtitle">{t("app.subtitle")}</span>
      </div>
      <div className="titlebar-center">
        <div className="lang-box" title={t("lang.label")}>
          {LANGUAGES.map((code) => (
            <button
              key={code}
              className={`lang-btn${code === language ? " active" : ""}`}
              onClick={() => onLanguage(code)}
            >
              {code.toUpperCase()}
            </button>
          ))}
        </div>
        {messages.length > 0 && (
          <button
            className="new-chat-btn"
            onClick={onNewChat}
            title={t("btn.newChatTitle")}
          >
            {t("btn.newChat")}
          </button>
        )}
        <button
          className="theme-btn"
          onClick={onToggleTheme}
          title={t("btn.theme")}
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

  const dataRows = merged.filter(
    (r) => r.cells.filter((c) => c !== "").length >= 2,
  );
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
  const [language, setLanguage] = useState(() => readLanguage(localStorage));
  const [dark, setDark] = useState(
    () => localStorage.getItem("theme") === "dark",
  );
  const chatRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);
  const stoppedRef = useRef(false);
  const fileInputRef = useRef(null);
  const visionInputRef = useRef(null);

  const [attachedFile, setAttachedFile] = useState(null);
  const [fileParsing, setFileParsing] = useState(false);
  const [visionImage, setVisionImage] = useState(null);

  const t = useCallback(
    (key, vars) => createTranslator(language)(key, vars),
    [language],
  );

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      dark ? "dark" : "light",
    );
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    document.documentElement.lang = language;
    saveLanguage(localStorage, language);
  }, [language]);

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
      setKeyError(t("error.keyFormat"));
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
              (a, b) =>
                a.transform[5] - b.transform[5] ||
                a.transform[4] - b.transform[4],
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
        throw new Error(t("error.fileUnsupported"));
      }

      if (!content.trim()) {
        throw new Error(t("error.fileNoText"));
      }

      const MAX_CHARS = 50000;
      if (content.length > MAX_CHARS) {
        content = content.slice(0, MAX_CHARS) + "\n\n" + t("file.trimmed");
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

  const handleVisionSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const MAX_SIZE = 20 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      alert(t("error.imageTooLarge"));
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        const MAX_DIM = 2048;

        if (w > MAX_DIM || h > MAX_DIM) {
          if (w > h) {
            h = Math.round((h / w) * MAX_DIM);
            w = MAX_DIM;
          } else {
            w = Math.round((w / h) * MAX_DIM);
            h = MAX_DIM;
          }

          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, w, h);
          setVisionImage({
            name: file.name,
            dataUrl: canvas.toDataURL(file.type || "image/png"),
          });
        } else {
          setVisionImage({
            name: file.name,
            dataUrl: reader.result,
          });
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const removeVision = () => setVisionImage(null);

  const send = useCallback(async () => {
    const text = input.trim();
    const image = visionImage;
    if ((!text && !attachedFile && !image) || loading || !apiKey) return;

    let userMsg;

    if (image) {
      // Multimodal message with vision
      userMsg = {
        role: "user",
        content: [
          { type: "text", text: text || t("prompt.analyzeImage") },
          { type: "image_url", image_url: { url: image.dataUrl } },
        ],
        visionImage: { name: image.name, dataUrl: image.dataUrl },
      };
    } else {
      const file = attachedFile;
      const userContent = file
        ? `${t("prompt.fileHeader", { name: file.name })}\n\n${
            file.content
          }\n\n---\n\n${text || t("prompt.analyzeFile")}`
        : text;

      userMsg = {
        role: "user",
        content: userContent,
        ...(file
          ? {
              file: { name: file.name, type: file.type },
              question: text || t("prompt.analyzeFile"),
            }
          : {}),
      };
    }

    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setAttachedFile(null);
    setVisionImage(null);
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
        body: JSON.stringify({ messages: updated, thinkingMode, language }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("deepseek_api_key");
          setApiKeyState("");
          setMessages([]);
          setKeyError(t("error.keyInvalid"));
          return;
        }
        throw new Error(err.error || t("error.server", { status: res.status }));
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
                  copy[copy.length - 1] = {
                    ...last,
                    content: last.content + token,
                  };
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
              ? last.content + `\n\n❌ **${t("error.label")}:** ${err.message}`
              : `❌ **${t("error.label")}:** ${err.message}`,
          };
          return copy;
        }
        return [
          ...prev,
          {
            role: "assistant",
            content: `❌ **${t("error.label")}:** ${err.message}`,
          },
        ];
      });
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, apiKey, thinkingMode, visionImage, t, language]);

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
    if (messages.length > 0 && !window.confirm(t("confirm.newChat"))) return;
    setMessages([]);
  };

  return (
    <div className="app">
      <Titlebar
        messages={messages}
        onNewChat={newChat}
        dark={dark}
        onToggleTheme={toggleTheme}
        language={language}
        onLanguage={setLanguage}
        t={t}
      />

      {apiKey && messages.length > 0 && (
        <div className="new-chat-mobile-bar">
          <button className="new-chat-mobile-btn" onClick={newChat}>
            {t("btn.newChat")}
          </button>
        </div>
      )}

      {!apiKey ? (
        <div className="setup-screen">
          <div className="setup-card">
            <div className="setup-icon">🔑</div>
            <h2>{t("setup.title")}</h2>
            <p>
              {t("setup.textA")}
              <br />
              {t("setup.textB")}
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
              placeholder={t("setup.placeholder")}
              autoFocus
            />
            <button
              className="setup-btn"
              onClick={handleSaveKey}
              disabled={!keyInput.trim()}
            >
              {t("setup.save")}
            </button>
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
          <input
            ref={visionInputRef}
            type="file"
            accept="image/*"
            onChange={handleVisionSelect}
            style={{ display: "none" }}
          />
          <div className="chat" ref={chatRef}>
            {messages.length === 0 && !loading && <EmptyState t={t} />}
            {messages.length === 0 && !loading && (
              <ThinkingToggle
                enabled={thinkingMode}
                onToggle={toggleThinkingMode}
                disabled={loading}
                t={t}
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
                  ) : m.visionImage ? (
                    <>
                      <img
                        src={m.visionImage.dataUrl}
                        alt={m.visionImage.name}
                        className="vision-preview"
                      />
                      <div className="vision-caption">
                        {Array.isArray(m.content)
                          ? m.content.find((c) => c.type === "text")?.text
                          : m.content}
                      </div>
                    </>
                  ) : m.file ? (
                    <>
                      <div className="file-ref">
                        📄 <code>{m.file.name}</code>
                      </div>
                      <div style={{ marginTop: 4 }}>{m.question}</div>
                    </>
                  ) : (
                    <>{m.content}</>
                  )}
                </div>
              </div>
            ))}
            {loading && messages[messages.length - 1]?.role !== "assistant" && (
              <TypingDots t={t} />
            )}
          </div>

          {messages.length === 0 && (
            <div className="disclaimer">
              {t("disclaimer.text")}
              <br />
              {t("disclaimer.by")}{" "}
              <a
                href="https://adamowy.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
              >
                Adam Warzecha
              </a>{" "}
              {t("disclaimer.tail")}
            </div>
          )}
          {attachedFile && (
            <div className="file-chip-bar">
              <div className="file-chip">
                <span className="file-chip-name">📄 {attachedFile.name}</span>
                <button
                  className="file-chip-remove"
                  onClick={removeFile}
                  title={t("btn.removeFile")}
                >
                  ✕
                </button>
              </div>
            </div>
          )}
          {visionImage && (
            <div className="vision-chip-bar">
              <div className="vision-chip">
                <img
                  src={visionImage.dataUrl}
                  alt={visionImage.name}
                  className="vision-chip-thumb"
                />
                <span className="vision-chip-name">🖼️ {visionImage.name}</span>
                <button
                  className="vision-chip-remove"
                  onClick={removeVision}
                  title={t("btn.removeImage")}
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
              title={t("btn.attach")}
            >
              {fileParsing ? "⏳" : "📎"}
            </button>
            {/* VISION: the DeepSeek API does not accept images (2026-07-01).
                The button comes back once it does. */}
            {/* <button
              className="vision-btn"
              onClick={() => visionInputRef.current?.click()}
              disabled={loading || fileParsing}
              title={t("btn.vision")}
            >
              👁️
            </button> */}
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("input.placeholder")}
              rows={1}
              disabled={loading}
            />
            <button
              onClick={loading ? stop : send}
              disabled={!loading && !input.trim() && !attachedFile}
              title={loading ? t("btn.stop") : t("btn.send")}
            >
              {loading ? "■" : "↑"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
