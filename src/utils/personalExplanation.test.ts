import { describe, expect, it } from "vitest";
import {
  formatPersonalExplanation,
  parsePersonalExplanation,
} from "./personalExplanation";

describe("personal explanations in existing notes", () => {
  it("preserves historical plain notes", () => {
    const notes = "Hash the seen values.\nKeep the original indices.\n";
    expect(parsePersonalExplanation(notes)).toEqual({
      explanation: notes,
      code: "",
      language: "python",
    });
  });
  it("round-trips the explanation and an optional C++ example", () => {
    const explanation =
      "Check before inserting, so we use two different elements.";
    const code = "class Solution {\npublic:\n  int value() { return 3; }\n};";
    expect(
      parsePersonalExplanation(
        formatPersonalExplanation(explanation, code, "cpp"),
      ),
    ).toEqual({ explanation, code, language: "cpp" });
  });
  it("can remove the example without changing the explanation", () => {
    expect(formatPersonalExplanation("Keep my notes", "", "python")).toBe(
      "Keep my notes",
    );
    expect(parsePersonalExplanation("")).toEqual({
      explanation: "",
      code: "",
      language: "python",
    });
  });
});

it("preserves trailing spaces and newlines while editing with a code example", () => {
  const explanation = "I can keep typing here \n";
  const code = "print(1)\n";
  expect(
    parsePersonalExplanation(
      formatPersonalExplanation(explanation, code, "python"),
    ),
  ).toEqual({ explanation, code, language: "python" });
});
it("extracts only the final code block from historical Markdown notes", () => {
  const notes =
    "Earlier example:\n\n```python\nprint(0)\n```\n\nActual explanation.\n\n```cpp\nint value = 1;\n```";
  expect(parsePersonalExplanation(notes)).toEqual({
    explanation:
      "Earlier example:\n\n```python\nprint(0)\n```\n\nActual explanation.",
    code: "int value = 1;",
    language: "cpp",
  });
});
