import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LevelPicker } from "./LevelPicker";
import { QuizCreate } from "./QuizCreate";

describe("quiz journey", () => {
  it("keeps the planning screen visible while AI is working", () => {
    render(<QuizCreate busy onSubmit={vi.fn()} />);
    expect(screen.getByRole("status")).toHaveTextContent("Analyzing your goal");
  });

  it("submits the goal with the user's save choice", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<QuizCreate busy={false} onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: "Teach me Java fundamentals" }));
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: /Suggest levels/ }));

    expect(onSubmit).toHaveBeenCalledWith({ prompt: "Teach me Java fundamentals", saveToLibrary: false });
  });

  it("offers to resume an active level", async () => {
    const onStart = vi.fn();
    const user = userEvent.setup();
    const level = { id: "one", title: "Fundamentals", summary: "Start here", topics: ["A", "B"] };
    const quiz = {
      title: "Java",
      description: "A clear path",
      plan: { levels: [level] },
      progressByLevel: { one: { status: "active", questions: [{ id: "q1" }], answers: [] } }
    };
    render(<LevelPicker quiz={quiz} selectedLevel={level} onSelect={vi.fn()} onStart={onStart} busy={false} />);

    await user.click(screen.getByRole("button", { name: /Continue where you left off/ }));
    expect(onStart).toHaveBeenCalledOnce();
  });
});
