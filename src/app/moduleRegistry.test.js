import { describe, expect, it } from "vitest";
import { modules } from "./moduleRegistry";

describe("module registry", () => {
  it("keeps module ids and routes unique", () => {
    expect(new Set(modules.map((module) => module.id)).size).toBe(modules.length);
    expect(new Set(modules.map((module) => module.route)).size).toBe(modules.length);
  });
});
