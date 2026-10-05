import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { getPrompt } = require("../lib/system-prompt.js");

const DEEPSEEK_URL = "https://api.deepseek.com/v1/chat/completions";

function parseBody(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve({});
      }
    });
  });
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-API-Key");

  if (req.method === "OPTIONS") {
    res.statusCode = 200;
    res.end();
    return;
  }

  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  try {
    const body = await parseBody(req);
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          error: 'Nieprawidłowe dane: wymagane pole "messages" (tablica)',
        }),
      );
      return;
    }

    const apiKey = req.headers["x-api-key"] || process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      res.statusCode = 401;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Brak klucza API" }));
      return;
    }

    const { thinkingMode, language } = body;

    const payload = {
      model: "deepseek-v4-pro",
      messages: [{ role: "system", content: getPrompt(language) }, ...messages],
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
      res.statusCode = response.status;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          error:
            err.error?.message || `Błąd API DeepSeek (${response.status})`,
        }),
      );
      return;
    }

    res.statusCode = 200;
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
    console.error("Vercel handler error:", err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Wewnętrzny błąd serwera" }));
    } else {
      res.end();
    }
  }
}
