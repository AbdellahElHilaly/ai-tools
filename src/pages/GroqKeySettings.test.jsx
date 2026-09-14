import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { groqKeyService } from "../core/llm/groqKeyService";
import { GroqKeySettings } from "./GroqKeySettings";

vi.mock("../core/llm/groqKeyService", () => ({
  groqKeyService: {
    list: vi.fn(),
    save: vi.fn(),
    testDraft: vi.fn(),
    testSaved: vi.fn(),
    remove: vi.fn()
  }
}));

const apiKey = "gsk_abcdefghijklmnopqrstuvwxyz123456";

describe("GroqKeySettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    groqKeyService.list.mockResolvedValue([]);
  });

  it("asks signed-out visitors to authenticate", () => {
    render(<GroqKeySettings user={null} />);
    expect(screen.getByText(/Sign in from Account settings/)).toBeInTheDocument();
    expect(groqKeyService.list).not.toHaveBeenCalled();
  });

  it("tests and stores a key without rendering the full secret", async () => {
    const user = userEvent.setup();
    groqKeyService.list
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{
        id: "key-1",
        label: "Primary",
        key_hint: "gsk_••••3456",
        status: "untested"
      }]);
    groqKeyService.testDraft.mockResolvedValue({ valid: true, message: "The key is valid and connected to Groq." });
    groqKeyService.save.mockResolvedValue({ id: "key-1", message: "The key was saved securely." });

    render(<GroqKeySettings user={{ id: "user-1" }} />);
    await waitFor(() => expect(groqKeyService.list).toHaveBeenCalledTimes(1));

    await user.type(screen.getByLabelText("Key name"), "Primary");
    await user.type(screen.getByLabelText("Groq API key"), apiKey);
    await user.click(screen.getByRole("button", { name: "Test key" }));
    await waitFor(() => expect(groqKeyService.testDraft).toHaveBeenCalledWith({ apiKey }));

    await user.click(screen.getByRole("button", { name: "Save key" }));
    await waitFor(() => expect(groqKeyService.save).toHaveBeenCalledWith({ label: "Primary", apiKey }));
    expect(await screen.findByText("gsk_••••3456")).toBeInTheDocument();
    expect(screen.queryByText(apiKey)).not.toBeInTheDocument();
    expect(screen.getByLabelText("Groq API key")).toHaveValue("");
  });
});
