# Medical Assistant

Study assistant for medical students. Questions about anatomy, physiology,
pharmacology, pathology or diagnostics, answered from evidence-based sources
only: PubMed, Cochrane, UpToDate, society guidelines, academic textbooks. When
the sources are not enough, it says so instead of guessing.

React + Vite front end, one Express route (or a Vercel function) in front of the
DeepSeek API, streamed answers. Every user pastes their own DeepSeek key.

## Run

Node 22 or newer, and a DeepSeek API key.

```bash
npm install
npm run dev      # Express on :3000, Vite on :5173, /api is proxied
```

`npm run build && npm start` serves the built front end from Express alone.

## The API key

Pasted in the setup screen, kept in the browser's `localStorage`, sent only to
this app's `/api/chat` route and forwarded to DeepSeek as the `Authorization`
header. A `DEEPSEEK_API_KEY` on the server is the fallback for requests that
carry no key of their own. Nothing is stored server side.

## What it does

- Streams answers while the model writes them, and stops mid-answer on request.
- Deep Thinking toggle: the model reasons before answering.
- Reads attached PDF (text layer), TXT and DOCX files, and rebuilds PDF tables as
  Markdown tables before they reach the model.
- English and Polish UI, switched in the header, English by default. The same
  choice selects the system prompt, so the answers follow the interface.
- Light and dark theme, both remembered between visits.

Documents are cut at 50 000 characters; the model is told to ask about specific
sections instead of the whole file.

## Known limits

- Image analysis is off: the DeepSeek API rejects image input, so the vision
  button is commented out in `src/App.jsx`. The system prompt already covers
  image analysis for the day the API accepts them.
- Scanned PDFs have no text layer, so there is nothing to extract. Run OCR first.
- No conversation history: a reload starts a fresh chat.

## Tests

```bash
npm test         # node:test: translation tables, language fallback, prompts
npm run build
```

CI runs both on every push to `main` and on pull requests.

## Deploy

Import the repo in Vercel. `vercel.json` builds the front end and keeps
`api/chat.mjs` as a serverless function on the same domain. Add
`DEEPSEEK_API_KEY` in Environment Variables to give visitors without a key a
shared one.

## Disclaimer

A study tool, not a medical device. It does not replace a consultation with a
doctor, and the app says so in its own footer.

## Licence

MIT, see [LICENSE](LICENSE).

Built by [Adam Warzecha](https://adamowy.vercel.app).

## Polski

Asystent do nauki dla studentów medycyny: anatomia, fizjologia, farmakologia,
patologia, diagnostyka. Odpowiedzi wyłącznie ze źródeł opartych na dowodach
(PubMed, Cochrane, UpToDate, wytyczne towarzystw, podręczniki akademickie), a
gdy danych brakuje, model mówi to wprost zamiast zgadywać.

Front to React + Vite, zapytania idą przez jedną trasę Express albo funkcję
Vercel do API DeepSeek i wracają strumieniem. Każdy użytkownik wkleja własny
klucz DeepSeek.

```bash
npm install
npm run dev
```

Klucz z ekranu konfiguracji jest trzymany w `localStorage` przeglądarki i
trafia wyłącznie do `/api/chat` tej aplikacji. Przełącznik języka w nagłówku
(domyślnie angielski, do wyboru polski) decyduje też, w jakim języku odpowiada
model. Dokumenty: PDF z warstwą tekstową, TXT, DOCX; tabele z PDF są odtwarzane
jako tabele Markdown, a pliki dłuższe niż 50 000 znaków są przycinane. Analiza
obrazów jest wyłączona, bo API DeepSeek nie przyjmuje obrazów. Historia rozmów
nie jest nigdzie zapisywana.

Licencja MIT. Informacje w aplikacji mają charakter edukacyjny i nie zastępują
konsultacji z lekarzem.
