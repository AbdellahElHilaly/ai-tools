import { describe, expect, it } from "vitest";
import { languageLabel, normalizeLanguages } from "./languages";

describe("Smith languages", () => {
  it("keeps supported languages unique", () => {
    expect(normalizeLanguages(["ar", "en", "ar", "unknown"])).toEqual(["ar", "en"]);
  });

  it("always returns a usable language", () => {
    expect(normalizeLanguages([])).toEqual(["en"]);
    expect(languageLabel("fr")).toBe("French");
  });
});
