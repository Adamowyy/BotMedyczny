require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const SYSTEM_PROMPT = require("./lib/system-prompt");

const PORT = process.env.PORT || 3000;
const DEEPSEEK_URL = "https://api.deepseek.com/v1/chat/completions";

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

const distPath = path.join(__dirname, "dist");
app.use(express.static(distPath));

app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        error: 'Nieprawidłowe dane: wymagane pole "messages" (tablica)',
      });
    }

    const apiKey = req.headers["x-api-key"] || process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return res.status(401).json({
        error:
          "Brak klucza API. Wprowadź klucz DeepSeek w ekranie konfiguracji.",
      });
    }

    const { thinkingMode } = req.body;

    const payload = {
      model: "deepseek-v4-pro",
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      thinking: { type: thinkingMode ? "enabled" : "disabled" },
      temperature: 0.3,
      max_tokens: 4096,
      stream: true,
    };

    const response = await fetch(DEEPSEEK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error("DeepSeek API error:", err);
      return res.status(response.status).json({
        error: err.error?.message || `Błąd API DeepSeek (${response.status})`,
      });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const reader = response.body.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
    } finally {
      reader.releaseLock();
      res.end();
    }
  } catch (err) {
    console.error("Server error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Wewnętrzny błąd serwera" });
    } else {
      res.end();
    }
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`🩺 Asystent Medyczny – serwer na porcie ${PORT}`);
  console.log(`   API:    http://localhost:${PORT}/api/chat`);
  console.log(`   Front:  http://localhost:${PORT}/`);
});
