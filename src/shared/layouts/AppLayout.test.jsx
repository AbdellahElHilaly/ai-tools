import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { AppLayout } from "./AppLayout";

afterEach(cleanup);

function renderAt(route) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="config" element={<h1>Settings content</h1>} />
          <Route path="quiz" element={<h1>Quiz content</h1>} />
          <Route path="smith/*" element={<h1>Smith content</h1>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe("AppLayout", () => {
  it("shows settings-specific bottom navigation", () => {
    renderAt("/config?section=keys");
    expect(screen.getByRole("link", { name: "Settings" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "API keys" })).toHaveAttribute("aria-current", "page");
    expect(screen.queryByRole("link", { name: "My quizzes" })).not.toBeInTheDocument();
  });

  it("shows quiz-specific bottom navigation", () => {
    renderAt("/quiz");
    expect(screen.getByRole("link", { name: "Quiz" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "New quiz" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "My quizzes" })).toBeInTheDocument();
  });

  it("shows Chat navigation throughout a conversation", () => {
    renderAt("/smith/chat/session-id");
    expect(screen.getByRole("link", { name: "Chat" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Chats" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Characters" })).toBeInTheDocument();
  });
});
