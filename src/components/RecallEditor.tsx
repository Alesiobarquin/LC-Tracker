import { memo, useMemo, useRef, useState } from "react";
import CodeMirror, { type ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { cpp } from "@codemirror/lang-cpp";
import { javascript } from "@codemirror/lang-javascript";
import { redo } from "@codemirror/commands";
import { indentUnit, syntaxHighlighting } from "@codemirror/language";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { FileCode2 } from "lucide-react";
import { preferenceStorage } from "../lib/safeStorage";
import { syntaxHighlightStyle } from "../utils/syntaxHighlightTheme";

const LANGUAGE_KEY = "lc-tracker-recall-editor-language";
const MAX_LENGTH = 20000;
const languages = {
  python: { label: "Python", file: "attempt.py", extension: python },
  javascript: { label: "JavaScript", file: "attempt.js", extension: javascript },
  cpp: { label: "C++", file: "attempt.cpp", extension: cpp },
  text: { label: "Plain text", file: "attempt.txt", extension: () => [] },
};
type Language = keyof typeof languages;

function readLanguage(): Language {
  const saved = preferenceStorage.getItem(LANGUAGE_KEY);
  return saved && Object.hasOwn(languages, saved) ? (saved as Language) : "python";
}

const editorTheme = EditorView.theme({
  "&": {
    backgroundColor: "var(--palette-surface)",
    color: "var(--palette-foreground)",
  },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": {
    fontFamily: "var(--font-mono)",
    fontSize: "13px",
    lineHeight: "1.85",
  },
  ".cm-content": { caretColor: "var(--palette-foreground)", padding: "14px 0" },
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
  ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--palette-foreground)" },
  ".cm-placeholder": { color: "var(--palette-subtle)" },
  ".cm-matchingBracket, .cm-selectionMatch": {
    backgroundColor: "var(--palette-hover-surface)",
  },
  ".cm-searchMatch": {
    backgroundColor: "var(--palette-hover-surface)",
    outline: "1px solid var(--palette-line-strong)",
  },
  ".cm-searchMatch.cm-searchMatch-selected": {
    backgroundColor: "var(--palette-muted-surface)",
    outline: "1px solid var(--palette-accent)",
  },
  ".cm-panels": {
    backgroundColor: "var(--palette-muted-surface)",
    color: "var(--palette-foreground)",
  },
  ".cm-panels-bottom": { borderTop: "1px solid var(--palette-line)" },
  ".cm-textfield, .cm-button": {
    background: "var(--palette-surface)",
    color: "var(--palette-foreground)",
    border: "1px solid var(--palette-line-strong)",
    borderRadius: "3px",
  },
});

export const RecallEditor = memo(function RecallEditor({
  value,
  onChange,
  readOnly = false,
}: {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}) {
  const editor = useRef<ReactCodeMirrorRef>(null);
  const [language, setLanguage] = useState(readLanguage);
  const [modifier] = useState(() =>
    /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl",
  );
  const extensions = useMemo(
    () => [
      languages[language].extension(),
      syntaxHighlighting(syntaxHighlightStyle),
      editorTheme,
      EditorView.lineWrapping,
      // Keep the advertised redo shortcut available on Windows as well.
      keymap.of([{ key: "Mod-Shift-z", run: redo, preventDefault: true }]),
      indentUnit.of("    "),
      EditorState.tabSize.of(4),
      EditorView.contentAttributes.of({
        id: "recall-answer",
        role: "textbox",
        "aria-labelledby": "recall-answer-label",
        "aria-describedby": "recall-editor-help",
        "aria-multiline": "true",
        "aria-readonly": String(readOnly),
        spellcheck: "false",
        autocapitalize: "off",
        autocorrect: "off",
        tabindex: "0",
      }),
      // Apply the same answer limit to typing, paste, and editor commands.
      EditorState.transactionFilter.of((transaction) =>
        transaction.docChanged &&
        transaction.newDoc.length > MAX_LENGTH &&
        transaction.newDoc.length > transaction.startState.doc.length
          ? []
          : transaction,
      ),
    ],
    [language, readOnly],
  );
  const basicSetup = useMemo(
    () => ({
      lineNumbers: true,
      foldGutter: false,
      highlightActiveLine: !readOnly,
      highlightActiveLineGutter: !readOnly,
      bracketMatching: true,
      closeBrackets: !readOnly,
      // Closed-notes retrieval should not supply missing syntax.
      autocompletion: false,
      completionKeymap: false,
      lintKeymap: false,
    }),
    [readOnly],
  );
  const shortcuts = [
    ["Tab / Shift + Tab", "Indent / outdent"],
    ["Enter", "New line with indentation"],
    [`${modifier} + /`, "Toggle comment"],
    [`${modifier} + Z / Shift + ${modifier} + Z`, "Undo / redo"],
    [`${modifier} + F`, "Find / replace"],
    [`${modifier} + D`, "Select next matching word"],
    ["Alt + ↑ / ↓", "Move line"],
    ["Shift + Alt + ↑ / ↓", "Duplicate line"],
    ["Esc, then Tab", "Leave the editor"],
  ];

  return (
    <>
      <label
        id="recall-answer-label"
        htmlFor="recall-answer"
        className="block text-sm text-body"
        onClick={() => editor.current?.view?.focus()}
      >
        Your attempt · explanation or pseudocode
      </label>
      <div className="recall-editor" data-readonly={readOnly}>
        <div className="recall-editor-toolbar">
          <span className="recall-editor-file">
            <FileCode2 size={14} aria-hidden="true" /> {languages[language].file}
          </span>
          <select
            aria-label="Answer highlighting"
            value={language}
            onChange={(event) => {
              const next = event.target.value as Language;
              setLanguage(next);
              preferenceStorage.setItem(LANGUAGE_KEY, next);
            }}
          >
            {Object.entries(languages).map(([id, option]) => (
              <option key={id} value={id}>{option.label}</option>
            ))}
          </select>
        </div>
        <CodeMirror
          ref={editor}
          value={value}
          onChange={onChange}
          extensions={extensions}
          theme="none"
          readOnly={readOnly}
          editable={!readOnly}
          indentWithTab={!readOnly}
          minHeight="280px"
          maxHeight="32rem"
          placeholder="Write the code you remember. Use plain English for the rest."
          basicSetup={basicSetup}
        />
        <div className="recall-editor-status">
          <span>4 spaces</span>
          <span>{value.length.toLocaleString("en-US")} / 20,000</span>
        </div>
      </div>
      <div className="recall-editor-help">
        <p id="recall-editor-help">Tab to indent · Esc, then Tab to leave</p>
        <details className="recall-editor-shortcuts">
          <summary>Keyboard shortcuts</summary>
          <dl>
            {shortcuts.map(([keys, action]) => (
              <div key={keys}><dt>{action}</dt><dd><kbd>{keys}</kbd></dd></div>
            ))}
          </dl>
        </details>
      </div>
    </>
  );
});
