import type { ReferenceLanguage } from "../data/problemReferences";

/** Keep existing notes readable; only a final fenced block becomes the code pane. */
export function parsePersonalExplanation(notes: string) {
  const blocks = [
    ...notes.matchAll(/^```(python|cpp)\n([\s\S]*?)\n```[ \t]*(?:\n|$)/gm),
  ];
  const match = blocks.at(-1);
  if (match && !notes.slice(match.index + match[0].length).trim()) {
    const before = notes.slice(0, match.index);
    return {
      // Remove only the separator we add; preserve spaces and newlines while editing.
      explanation: before.endsWith("\n\n") ? before.slice(0, -2) : before,
      code: match[2],
      language: match[1] as ReferenceLanguage,
    };
  }
  return {
    explanation: notes,
    code: "",
    language: "python" as ReferenceLanguage,
  };
}
export function formatPersonalExplanation(
  explanation: string,
  code: string,
  language: ReferenceLanguage,
) {
  return code.length
    ? `${explanation}\n\n\`\`\`${language}\n${code}\n\`\`\``
    : explanation;
}
