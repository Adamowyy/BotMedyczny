require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const SYSTEM_PROMPT = require('./lib/system-prompt');

const PORT = process.env.PORT || 3000;
const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions';

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Nieprawidłowe dane: wymagane pole "messages" (tablica)' });
    }

    const apiKey = req.headers['x-api-key'] || process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return res.status(401).json({ error: 'Brak klucza API. Wprowadź klucz DeepSeek w ekranie konfiguracji.' });
    }

    const payload = {
      model: 'deepseek-v4-flash',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages,
      ],
      thinking: { type: 'disabled' },
      temperature: 0.3,
      max_tokens: 4096,
    };

    const response = await fetch(DEEPSEEK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('DeepSeek API error:', data);
      return res.status(response.status).json({
        error: data.error?.message || `Błąd API DeepSeek (${response.status})`,
      });
    }

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return res.status(500).json({ error: 'Pusta odpowiedź z API DeepSeek' });
    }

    res.json({ content });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Wewnętrzny błąd serwera' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🩺 Asystent Medyczny – serwer na porcie ${PORT}`);
  console.log(`   API:    http://localhost:${PORT}/api/chat`);
  console.log(`   Front:  http://localhost:${PORT}/`);
});
