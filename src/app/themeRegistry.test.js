import { describe, expect, it } from "vitest";
import { resolveModuleTheme } from "./themeRegistry";

describe("theme registry", () => {
  it("keeps quiz screens in one visual theme", () => {
    expect(resolveModuleTheme("/quiz").id).toBe("quiz");
    expect(resolveModuleTheme("/library").id).toBe("quiz");
  });

  it("keeps every Smith screen in the Smith theme", () => {
    expect(resolveModuleTheme("/smith").id).toBe("smith");
    expect(resolveModuleTheme("/smith/chats").id).toBe("smith");
    expect(resolveModuleTheme("/smith/chat/session-id").id).toBe("smith");
  });

  it("keeps core screens independent from module themes", () => {
    expect(resolveModuleTheme("/").id).toBe("home");
    expect(resolveModuleTheme("/config").id).toBe("settings");
  });
});
