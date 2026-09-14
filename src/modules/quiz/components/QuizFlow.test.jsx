import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LevelPicker } from "./LevelPicker";
import { QuizCreate } from "./QuizCreate";

describe("quiz journey", () => {
  it("keeps the planning screen visible while AI is working", () => {
    render(<QuizCreate busy onSubmit={vi.fn()} />);
    expect(screen.getByRole("status")).toHaveTextContent("كنحلل الهدف");
  });

  it("submits the goal with the user's save choice", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<QuizCreate busy={false} onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: "علّمني أساسيات Java" }));
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: /اقترح المستويات/ }));

    expect(onSubmit).toHaveBeenCalledWith({ prompt: "علّمني أساسيات Java", saveToLibrary: false });
  });

  it("offers to resume an active level", async () => {
    const onStart = vi.fn();
    const user = userEvent.setup();
    const level = { id: "one", title: "الأساسيات", summary: "ابدأ هنا", topics: ["A", "B"] };
    const quiz = {
      title: "Java",
      description: "مسار واضح",
      plan: { levels: [level] },
      progressByLevel: { one: { status: "active", questions: [{ id: "q1" }], answers: [] } }
    };
    render(<LevelPicker quiz={quiz} selectedLevel={level} onSelect={vi.fn()} onStart={onStart} busy={false} />);

    await user.click(screen.getByRole("button", { name: /كمّل من فين وقفتي/ }));
    expect(onStart).toHaveBeenCalledOnce();
  });
});
