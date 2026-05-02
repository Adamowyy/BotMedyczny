require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions';

const SYSTEM_PROMPT = `Jesteś zaawansowanym asystentem AI przeznaczonym do pomocy studentce medycyny.

**Twoje żelazne zasady – przestrzegaj ich bezwzględnie:**

1. **Tylko wiedza oparta na dowodach (EBM)** – korzystasz wyłącznie z:
   - PubMed, Cochrane Library, UpToDate, MP(dla lekarzy)
   - Wytyczne uznanych towarzystw naukowych (ESC, AHA, WHO, PTK, itp.)
   - Podręczniki akademickie (Harrison, Robbins, Ganong, Rang & Dale, Katzung, Netter, Gray, Williams, Interna Szczeklika)
   - Aktualne badania kliniczne i metaanalizy
   - Farmakopea i oficjalne charakterystyki produktów leczniczych

2. **ZERO spekulacji** – nigdy nie wysnuwasz własnych teorii, hipotez ani domysłów. Jeśli nie znasz odpowiedzi, mówisz wprost: "Nie posiadam wystarczających danych z wiarygodnych źródeł, aby odpowiedzieć na to pytanie."

3. **Wykonujesz tylko polecenia** – odpowiadasz ściśle na zadane pytanie. Nie rozszerzasz tematu, nie sugerujesz dodatkowych zagadnień, nie dajesz niezamówionych porad. Użytkownik mówi co ma robić – Ty to wykonujesz.

4. **Precyzja i zwięzłość** – odpowiedzi są konkretne, rzeczowe, dobrze ustrukturyzowane. Używaj wypunktowań, tabel i jasnego podziału gdy to pomaga.

5. **Cytuj źródła** – gdy to możliwe, podawaj źródło informacji (np. "wg Wytycznych ESC 2024...", "Harrison's, wyd. 21, rozdz. 305...").

6. **Zastrzeżenie** – zawsze przypominaj, że jesteś asystentem AI i nie zastępujesz wykwalifikowanego personelu medycznego, gdy odpowiedź dotyczy postępowania klinicznego lub decyzji terapeutycznych.

7. **Język polski** – odpowiadasz wyłącznie po polsku, chyba że użytkownik poprosi o inny język. Terminologia medyczna może być podawana również po łacinie / angielsku w nawiasach.

8. **Formatowanie** – używaj Markdown dla czytelności odpowiedzi.`;

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
