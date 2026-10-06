import { useMemo, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { cpp } from "@codemirror/lang-cpp";
import { EditorView } from "@codemirror/view";
import { syntaxHighlightExtensions } from "../utils/syntaxHighlightTheme";
import type { ReferenceLanguage } from "../data/problemReferences";

export function ReferenceCode({
  code,
  language,
  onChange,
  label = "Solution code",
}: {
  code: string;
  language: ReferenceLanguage;
  onChange?: (code: string) => void;
  label?: string;
}) {
  const [copyState, setCopyState] = useState("Copy code");
  const extensions = useMemo(
    () => [
      language === "cpp" ? cpp() : python(),
      ...syntaxHighlightExtensions,
      EditorView.lineWrapping,
      EditorView.contentAttributes.of({ "aria-label": label }),
      EditorView.theme({
        "&": {
          backgroundColor: "var(--palette-surface)",
          color: "var(--palette-foreground)",
        },
        ".cm-content": {
          caretColor: "var(--palette-foreground)",
          padding: "12px 0",
        },
        ".cm-line": { padding: "0 14px" },
        ".cm-gutters": {
          backgroundColor: "var(--palette-muted-surface)",
          color: "var(--palette-subtle)",
          borderRight: "1px solid var(--palette-line)",
        },
        ".cm-activeLine, .cm-activeLineGutter": {
          backgroundColor: "var(--palette-muted-surface)",
        },
        ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": {
          backgroundColor: "var(--palette-hover-surface)",
        },
        "&.cm-focused": {
          outline: "2px solid var(--palette-accent)",
          outlineOffset: "-2px",
        },
        ".cm-scroller": {
          fontFamily: "var(--font-mono)",
          fontSize: "13px",
          lineHeight: "1.8",
        },
      }),
    ],
    [language, label],
  );
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopyState("Copied");
    } catch {
      setCopyState("Select code to copy");
    }
  }
  return (
    <div className="reference-code">
      <div className="reference-code-toolbar">
        <span>
          {language === "cpp" ? "solution.cpp · C++" : "solution.py · Python"}
        </span>
        <button
          type="button"
          className="quiet-action"
          onClick={() => void copy()}
        >
          {copyState}
        </button>
      </div>
      <CodeMirror
        value={code}
        extensions={extensions}
        theme="none"
        editable={!!onChange}
        readOnly={!onChange}
        onChange={onChange}
        maxHeight="36rem"
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          highlightActiveLine: !!onChange,
          highlightActiveLineGutter: !!onChange,
          autocompletion: !!onChange,
          bracketMatching: true,
          closeBrackets: !!onChange,
        }}
      />
    </div>
  );
}
