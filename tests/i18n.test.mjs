import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import {
  DEFAULT_LANGUAGE,
  LANGUAGES,
  STORAGE_KEY,
  STRINGS,
  readLanguage,
  saveLanguage,
  translate,
} from "../src/i18n.mjs";

const require = createRequire(import.meta.url);
const { PROMPTS, getPrompt } = require("../lib/system-prompt.js");

// Minimal stand-in for localStorage, plus one storage that always throws.
function fakeStorage(initial = {}) {
  const data = { ...initial };
  return {
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => {
      data[key] = String(value);
    },
    dump: () => data,
  };
}

test("English is the default language", () => {
  assert.equal(DEFAULT_LANGUAGE, "en");
  assert.ok(LANGUAGES.includes(DEFAULT_LANGUAGE));
  assert.ok(LANGUAGES.length >= 2);
});

test("every language table has exactly the same keys", () => {
  const reference = Object.keys(STRINGS[DEFAULT_LANGUAGE]).sort();
  assert.ok(reference.length > 20);
  for (const code of LANGUAGES) {
    assert.deepEqual(
      Object.keys(STRINGS[code]).sort(),
      reference,
      `translation keys differ in "${code}"`,
    );
  }
});

test("no user-visible string is empty", () => {
  for (const code of LANGUAGES) {
    for (const [key, value] of Object.entries(STRINGS[code])) {
      assert.equal(typeof value, "string", `${code}.${key} is not a string`);
      assert.ok(value.trim().length > 0, `${code}.${key} is empty`);
    }
  }
});

test("an unknown language falls back to English", () => {
  assert.equal(translate("pl", "app.title"), "Asystent Medyczny");
  assert.equal(translate("de", "app.title"), "Medical Assistant");
  assert.equal(translate(undefined, "app.title"), "Medical Assistant");
});

test("an unknown key renders as the key itself", () => {
  assert.equal(translate("pl", "does.not.exist"), "does.not.exist");
});

test("placeholders are substituted, unknown ones are left alone", () => {
  assert.equal(
    translate("en", "error.server", { status: 500 }),
    "Server error (500)",
  );
  assert.equal(translate("en", "error.server", {}), "Server error ({status})");
  assert.equal(translate("pl", "error.server", { status: 502 }), "Błąd serwera (502)");
});

test("the language choice survives a reload", () => {
  const storage = fakeStorage();
  saveLanguage(storage, "pl");
  assert.equal(storage.dump()[STORAGE_KEY], "pl");
  assert.equal(readLanguage(storage), "pl");

  saveLanguage(storage, "nonsense");
  assert.equal(readLanguage(storage), "en");
});

test("a storage that throws does not break the app", () => {
  const blocked = {
    getItem() {
      throw new Error("storage is blocked");
    },
    setItem() {
      throw new Error("storage is blocked");
    },
  };
  assert.equal(readLanguage(blocked), "en");
  assert.doesNotThrow(() => saveLanguage(blocked, "pl"));
});

test("every language has a system prompt and English is the fallback", () => {
  for (const code of LANGUAGES) {
    assert.equal(typeof PROMPTS[code], "string");
    assert.ok(PROMPTS[code].length > 500, `the "${code}" prompt looks truncated`);
  }
  assert.match(PROMPTS.en, /medical students/);
  assert.match(PROMPTS.pl, /studentom medycyny/);
  assert.equal(getPrompt("pl"), PROMPTS.pl);
  assert.equal(getPrompt(undefined), PROMPTS.en);
  assert.equal(getPrompt("klingon"), PROMPTS.en);
});

test("nothing personal is shipped in the strings or the prompts", () => {
  const shipped = JSON.stringify(STRINGS) + PROMPTS.en + PROMPTS.pl;
  for (const forbidden of ["", "studentów medycyny"]) {
    assert.ok(
      !shipped.includes(forbidden),
      `"${forbidden}" must not appear in user-visible text`,
    );
  }
});
