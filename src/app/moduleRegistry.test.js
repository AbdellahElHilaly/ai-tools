import { describe, expect, it } from "vitest";
import { modules } from "./moduleRegistry";

describe("module registry", () => {
  it("keeps module ids and routes unique", () => {
    expect(new Set(modules.map((module) => module.id)).size).toBe(modules.length);
    expect(new Set(modules.map((module) => module.route)).size).toBe(modules.length);
  });

  it("requires every module to own a theme and its related routes", () => {
    for (const module of modules) {
      expect(module.theme).toBeTruthy();
      expect(module.themeRoutes).toContain(module.route);
    }
  });
});
