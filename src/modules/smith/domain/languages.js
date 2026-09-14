export const SMITH_LANGUAGES = Object.freeze([
  Object.freeze({ code: "en", label: "English" }),
  Object.freeze({ code: "ar", label: "Arabic" }),
  Object.freeze({ code: "fr", label: "French" }),
  Object.freeze({ code: "es", label: "Spanish" }),
  Object.freeze({ code: "de", label: "German" }),
  Object.freeze({ code: "it", label: "Italian" }),
  Object.freeze({ code: "pt", label: "Portuguese" })
]);

const languageCodes = new Set(SMITH_LANGUAGES.map((language) => language.code));

export function normalizeLanguages(values) {
  const normalized = [...new Set((values || []).filter((value) => languageCodes.has(value)))];
  return normalized.length ? normalized : ["en"];
}

export function languageLabel(code) {
  return SMITH_LANGUAGES.find((language) => language.code === code)?.label || code;
}
