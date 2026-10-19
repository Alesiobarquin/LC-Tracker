import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { ExternalLink, Play } from "lucide-react";
import {
  loadProblemReference,
  getProblemApproaches,
  type ProblemApproach,
  type ProblemReference,
  type ReferenceLanguage,
} from "../data/problemReferences";
import type { Problem } from "../data/problems";
import { ReferenceCode } from "./ReferenceCode";
import { Select } from "./ui/Field";
import { Button } from "./ui/Button";

export function ExplanationText({ children }: { children: string }) {
  return (
    <div className="explanation-prose">
      <ReactMarkdown
        components={{ ul: ({ children }) => <ul role="list">{children}</ul> }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

export function ExplanationLinks({ problem }: { problem: Problem }) {
  return (
    <div className="explanation-links">
      <a
        href={`${problem.leetcodeUrl.replace(/\/$/, "")}/editorial/`}
        target="_blank"
        rel="noopener noreferrer"
      >
        Check the explanation on LeetCode <ExternalLink size={14} aria-hidden />
      </a>
      {problem.videoUrl && (
        <a href={problem.videoUrl} target="_blank" rel="noopener noreferrer">
          <Play size={14} aria-hidden /> Watch NeetCode on YouTube{" "}
          <ExternalLink size={14} aria-hidden />
        </a>
      )}
    </div>
  );
}

function ProblemExplanationFootnote({ reference }: { reference: ProblemApproach }) {
  return (
    <details className="explanation-footnote">
      <summary>Source and license</summary>
      <p>
        {reference.codeAuthor
          ? `Explanation and code by ${reference.codeAuthor}. Related reference: `
          : reference.explanationAuthor
          ? `Explanation by ${reference.explanationAuthor}. Code adapted from `
          : "Adapted from "}
        <a href={reference.sourceUrl} target="_blank" rel="noopener noreferrer">
          {reference.sourceName ?? "NeetCode’s source"}
        </a>{" "}
        ·{" "}
        <a href={reference.licenseUrl ?? "/neetcode-license.txt"} target="_blank" rel="noopener noreferrer">
          {reference.codeAuthor ? "Related source’s MIT license" : "MIT license"}
        </a>
        . Node types are supplied by LeetCode where needed.
      </p>
    </details>
  );
}

export function ProblemExplanation({ problem }: { problem: Problem }) {
  const [reference, setReference] = useState<ProblemReference | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [language, setLanguage] = useState<ReferenceLanguage>("python");
  const [approachId, setApproachId] = useState("default");
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    setReference(null);
    setApproachId("default");
    void loadProblemReference(problem.id)
      .then((data) => {
        if (!cancelled) setReference(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [problem.id, retry]);
  if (loading)
    return (
      <p role="status" className="text-muted">
        Loading explanation…
      </p>
    );
  if (error)
    return (
      <div role="alert" className="text-danger">
        Could not load this explanation.{" "}
        <button className="quiet-action" onClick={() => setRetry(retry + 1)}>
          Retry explanation
        </button>
      </div>
    );
  if (!reference)
    return (
      <p className="text-muted text-sm">
        A built-in explanation isn’t available for this full-catalog problem
        yet. Use the LeetCode explanation or your own notes.
      </p>
    );
  const approaches = getProblemApproaches(reference);
  const selected = approaches.find((approach) => approach.id === approachId) ?? approaches[0];
  const selectedLanguage = selected.code[language] ? language : "python";
  const [reasoning, pitfalls] = selected.explanation.split(
    "\n\n### Things to watch for\n\n",
  );
  const sections = reasoning.split(/(?=^### )/m).filter((text) => text.trim());
  return (
    <div className="problem-explanation space-y-5">
      <div>
        <p className="register-label">Built-in explanation</p>
        {approaches.length > 1 && (
          <div className="explanation-approaches" role="group" aria-label="Solution approach">
            <p className="text-sm text-body">Solution approach</p>
            <div className="explanation-approach-options">
              {approaches.map((approach) => (
                <Button
                  key={approach.id}
                  className="explanation-approach-option"
                  aria-pressed={selected.id === approach.id}
                  onClick={() => setApproachId(approach.id)}
                >
                  {approach.approach}
                </Button>
              ))}
            </div>
          </div>
        )}
        <h3 className="explanation-approach" aria-live="polite">{selected.approach}</h3>
      </div>
      <div className="explanation-sections">
        {sections.map((text, index) => (
          <section
            key={index}
            className={`explanation-section${text.startsWith("### Complexity\n") ? " explanation-complexity" : ""}`}
          >
            <ExplanationText>{text}</ExplanationText>
          </section>
        ))}
      </div>
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h3 className="text-sm font-semibold text-foreground">Code example</h3>
        <label className="text-sm text-muted flex items-center gap-2">
          Example language
          <Select
            aria-label="Example language"
            value={selectedLanguage}
            disabled={!selected.code.cpp}
            onChange={(e) => setLanguage(e.target.value as ReferenceLanguage)}
            className="w-auto appearance-auto rounded-md border border-line-strong bg-surface text-foreground p-2"
          >
            <option value="python">Python</option>
            {selected.code.cpp && <option value="cpp">C++</option>}
          </Select>
        </label>
      </div>
      <ReferenceCode
        key={`${problem.id}:${selected.id}:${selectedLanguage}`}
        code={selected.code[selectedLanguage]!}
        language={selectedLanguage}
      />
      {pitfalls && (
        <details key={selected.id} className="recall-pattern-reference">
          <summary className="cursor-pointer text-sm text-accent">
            Edge cases and common mistakes
          </summary>
          <div className="mt-4">
            <ExplanationText>{pitfalls}</ExplanationText>
          </div>
        </details>
      )}
      <ProblemExplanationFootnote reference={selected} />
    </div>
  );
}
