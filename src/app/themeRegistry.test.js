import { describe, expect, it } from "vitest";
import { resolveModuleTheme } from "./themeRegistry";

describe("theme registry", () => {
  it("keeps quiz screens in one visual theme", () => {
    expect(resolveModuleTheme("/quiz").id).toBe("quiz");
    expect(resolveModuleTheme("/library").id).toBe("quiz");
  });

  it("keeps core screens independent from module themes", () => {
    expect(resolveModuleTheme("/").id).toBe("home");
    expect(resolveModuleTheme("/config").id).toBe("settings");
  });
});
