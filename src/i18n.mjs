// UI translations. English is the default and the fallback for missing keys.

export const DEFAULT_LANGUAGE = "en";
export const LANGUAGES = ["en", "pl"];
export const STORAGE_KEY = "language";

export const STRINGS = {
  en: {
    // header
    "app.title": "Medical Assistant",
    "app.subtitle": "AI study assistant",
    "lang.label": "Language",

    // buttons
    "btn.newChat": "+ New chat",
    "btn.newChatTitle": "New chat",
    "btn.theme": "Switch theme",
    "btn.send": "Send",
    "btn.stop": "Stop",
    "btn.attach": "Attach a file (PDF, TXT, DOCX)",
    "btn.vision": "Image analysis (Vision)",
    "btn.removeFile": "Remove file",
    "btn.removeImage": "Remove image",

    // empty state
    "empty.title": "Medical Assistant",
    "empty.text":
      "Ask about anatomy, physiology, pharmacology, pathology or diagnostics. Answers come only from reliable medical sources, without speculation.",
    "empty.slowNotice":
      "I sometimes answer more slowly because accuracy comes first. The advanced model behind me works a bit like a doctor making a diagnosis, and rushing it helps nobody.",

    // thinking toggle
    "thinking.label": "🧠 Deep Thinking",
    "thinking.onA": "The model reasons before answering (slower)",
    "thinking.onB": "⚠️ Not recommended for everyday use!",
    "thinking.off": "Faster answer without a reasoning chain",

    // setup screen
    "setup.title": "API key setup",
    "setup.textA": "Enter your API key to start.",
    "setup.textB": "The key is stored locally on your computer.",
    "setup.placeholder": "sk-xxx...xxxx",
    "setup.save": "Save and start",

    // disclaimer
    "disclaimer.text":
      "⚠️ This AI assistant does not replace a consultation with a doctor. The information is educational only.",
    "disclaimer.by": "Assistant fully designed by –",
    "disclaimer.tail": "/ © 2026 Adam Warzecha · MIT licence",

    // composer
    "input.placeholder": "Ask a question...",

    // dialogs and errors
    "confirm.newChat":
      "Start a new chat? The current conversation will be lost.",
    "error.keyFormat": 'Invalid format. A DeepSeek key starts with "sk-".',
    "error.keyInvalid": "The API key is invalid or expired. Enter a new key.",
    "error.server": "Server error ({status})",
    "error.label": "Error",
    "error.fileUnsupported":
      "Unsupported file format. Allowed formats: PDF, TXT, DOCX.",
    "error.fileNoText":
      "Could not extract text from the file. It may be a scan or an image without a text layer.",
    "error.imageTooLarge": "The image is too large. The limit is 20 MB.",
    "file.trimmed":
      "[The text was trimmed, the file is too long. Ask about specific sections.]",

    // messages sent to the model
    "prompt.analyzeImage":
      "Analyze this medical image. Describe in detail what you see.",
    "prompt.analyzeFile": "Analyze the file above.",
    "prompt.fileHeader": "**📄 File: `{name}`**",

    // typing variants
    "thinking.v1": "Let me think...",
    "thinking.v2": "Analyzing the question...",
    "thinking.v3": "Looking for an answer...",
    "thinking.v4": "Answering in a moment...",
    "thinking.v5": "A moment to consider...",
  },

  pl: {
    // header
    "app.title": "Asystent Medyczny",
    "app.subtitle": "Asystent nauki AI",
    "lang.label": "Język",

    // buttons
    "btn.newChat": "+ Nowy czat",
    "btn.newChatTitle": "Nowy czat",
    "btn.theme": "Zmień motyw",
    "btn.send": "Wyślij",
    "btn.stop": "Zatrzymaj",
    "btn.attach": "Załącz plik (PDF, TXT, DOCX)",
    "btn.vision": "Analiza obrazu (Vision)",
    "btn.removeFile": "Usuń plik",
    "btn.removeImage": "Usuń obraz",

    // empty state
    "empty.title": "Asystent Medyczny",
    "empty.text":
      "Zadaj pytanie – anatomia, fizjologia, farmakologia, patologia, diagnostyka. Odpowiadam wyłącznie na podstawie wiarygodnych źródeł medycznych, bez spekulacji.",
    "empty.slowNotice":
      "Czasem odpisuję wolniej, bo stawiam na dokładność. Zaawansowany model, z którego korzystam, działa trochę jak lekarz przy diagnozie – pośpiech nie jest tu wskazany.",

    // thinking toggle
    "thinking.label": "🧠 Głębokie Myślenie",
    "thinking.onA": "Model „myśli” przed odpowiedzią (wolniejszy)",
    "thinking.onB": "⚠️ Niezalecane do codziennego użytku!",
    "thinking.off": "Szybsza odpowiedź bez łańcucha myślowego",

    // setup screen
    "setup.title": "Konfiguracja klucza API",
    "setup.textA": "Wprowadź swój klucz API, aby rozpocząć.",
    "setup.textB": "Klucz jest przechowywany lokalnie na Twoim komputerze.",
    "setup.placeholder": "sk-xxx...xxxx",
    "setup.save": "Zapisz i uruchom",

    // disclaimer
    "disclaimer.text":
      "⚠️ Ten asystent AI nie zastępuje konsultacji z lekarzem. Informacje mają charakter edukacyjny.",
    "disclaimer.by": "Asystent w pełni zaprojektowany przez –",
    "disclaimer.tail": "/ © 2026 Adam Warzecha · licencja MIT.",

    // composer
    "input.placeholder": "Zadaj pytanie...",

    // dialogs and errors
    "confirm.newChat":
      "Czy na pewno chcesz rozpocząć nowy czat? Aktualna konwersacja zostanie utracona.",
    "error.keyFormat":
      'Nieprawidłowy format. Klucz DeepSeek zaczyna się od "sk-".',
    "error.keyInvalid":
      "Klucz API jest nieprawidłowy lub wygasł. Wprowadź nowy klucz.",
    "error.server": "Błąd serwera ({status})",
    "error.label": "Błąd",
    "error.fileUnsupported":
      "Nieobsługiwany format pliku. Dozwolone formaty: PDF, TXT, DOCX.",
    "error.fileNoText":
      "Nie udało się wyodrębnić tekstu z pliku. Plik może być skanem lub obrazem bez warstwy tekstowej.",
    "error.imageTooLarge": "Obraz jest zbyt duży. Maksymalny rozmiar to 20 MB.",
    "file.trimmed":
      "[Tekst został przycięty – plik jest zbyt długi. Zadawaj pytania o konkretne fragmenty.]",

    // messages sent to the model
    "prompt.analyzeImage":
      "Przeanalizuj ten obraz medyczny. Opisz szczegółowo co widzisz.",
    "prompt.analyzeFile": "Przeanalizuj powyższy plik.",
    "prompt.fileHeader": "**📄 Plik: `{name}`**",

    // typing variants
    "thinking.v1": "Niech pomyślę...",
    "thinking.v2": "Analizuję pytanie...",
    "thinking.v3": "Szukam odpowiedzi...",
    "thinking.v4": "Zaraz odpowiem...",
    "thinking.v5": "Chwila zastanowienia...",
  },
};

// Anything outside LANGUAGES falls back to English.
export function normalizeLanguage(code) {
  return LANGUAGES.includes(code) ? code : DEFAULT_LANGUAGE;
}

export function readLanguage(storage) {
  try {
    return normalizeLanguage(storage?.getItem(STORAGE_KEY));
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

export function saveLanguage(storage, code) {
  try {
    storage?.setItem(STORAGE_KEY, normalizeLanguage(code));
  } catch {
    // private mode or a full quota
  }
}

// A key missing from one table falls back to English, an unknown key renders as itself.
export function translate(language, key, vars) {
  const table = STRINGS[normalizeLanguage(language)];
  const text = table[key] ?? STRINGS[DEFAULT_LANGUAGE][key] ?? key;
  if (!vars || typeof text !== "string") return text;
  return text.replace(/\{(\w+)\}/g, (match, name) =>
    name in vars ? String(vars[name]) : match,
  );
}

export function createTranslator(language) {
  const code = normalizeLanguage(language);
  return (key, vars) => translate(code, key, vars);
}
