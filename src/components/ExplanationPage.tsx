import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { problemMap } from "../data/problems";
import { useProblemProgress } from "../hooks/useUserData";
import { useStore } from "../store/useStore";
import { parsePersonalExplanation } from "../utils/personalExplanation";
import {
  ProblemExplanation,
  ExplanationLinks,
  ExplanationText,
} from "./ProblemExplanation";
import { ReferenceCode } from "./ReferenceCode";
import { PageHeader } from "./ui";

export function ExplanationPage() {
  const { problemId } = useParams();
  const problem = problemId ? problemMap[problemId] : undefined;
  const { progress } = useProblemProgress();
  const activeRecall = useStore((state) => state.activeRecall);
  const [personal, setPersonal] = useState(true);
  if (!problem)
    return (
      <p>
        This explanation isn’t available.{" "}
        <Link className="text-accent" to="/library">
          Open library
        </Link>
      </p>
    );
  if (activeRecall?.problemId === problem.id && !activeRecall.revealed)
    return (
      <div className="premium-card p-6 space-y-4">
        <p>
          Your recall check is in progress. Write your attempt before revealing
          the explanation.
        </p>
        <Link className="text-accent" to={`/recall/${problem.id}`}>
          Resume recall check
        </Link>
      </div>
    );
  const notes = progress[problem.id]?.notes;
  const custom = parsePersonalExplanation(notes ?? "");
  return (
    <div className="recall-workspace mx-auto space-y-6 pb-12">
      <Link
        to="/library"
        className="inline-flex gap-2 items-center text-muted text-sm"
      >
        <ArrowLeft size={14} /> Problem library
      </Link>
      <PageHeader
        title={problem.title}
        description="Explanation and code example"
      />
      {notes && (
        <div className="reference-switch" aria-label="Explanation source">
          <button
            className="quiet-action"
            aria-pressed={personal}
            onClick={() => setPersonal(true)}
          >
            My explanation
          </button>
          <button
            className="quiet-action"
            aria-pressed={!personal}
            onClick={() => setPersonal(false)}
          >
            Built-in explanation
          </button>
        </div>
      )}
      {notes && personal ? (
        <div className="space-y-4">
          <h2 className="text-lg text-foreground">Your saved explanation</h2>
          <ExplanationText>{custom.explanation}</ExplanationText>
          {custom.code && (
            <ReferenceCode code={custom.code} language={custom.language} />
          )}
          <Link className="text-sm text-accent" to={`/recall/${problem.id}`}>
            Edit your explanation during a recall check
          </Link>
        </div>
      ) : (
        <ProblemExplanation problem={problem} />
      )}
      <ExplanationLinks problem={problem} />
    </div>
  );
}
